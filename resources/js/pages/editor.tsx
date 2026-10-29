import { Head, router } from '@inertiajs/react';
import grapesjs, { type Component, type Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import EditorLayout, { type InspectorProperty, type InspectorStyles, type NavigatorItem } from '../layouts/editor-layout';
import { elementCategories, elementRegistry, type EditorBlock } from '../lib/website-builder/element-registry';
import '../../css/editor.scss';

type EditorPageProps = {
    websiteId: number;
    websiteSlug: string;
    websiteContent: Record<string, unknown> | null;
};

const emptyStyles: InspectorStyles = {
    tagName: '',
    content: '',
    href: '',
    canEditContent: false,
    isLink: false,
    color: '',
    backgroundColor: '',
    fontFamily: '',
    fontSize: '',
    fontWeight: '',
    lineHeight: '',
    textAlign: '',
    display: '',
    flexDirection: '',
    justifyContent: '',
    alignItems: '',
    gap: '',
    width: '',
    maxWidth: '',
    height: '',
    minHeight: '',
    margin: '',
    padding: '',
    borderRadius: '',
    borderWidth: '',
    borderStyle: '',
    borderColor: '',
};

function getNavigatorItems(editor: Editor): NavigatorItem[] {
    const items: NavigatorItem[] = [];
    
    const visit = (parent: Component, depth: number) => {
        const children = parent.components().models;
    
        children.forEach((component, index) => {
            const tagName = String(
                component.get('tagName') || 'div',
            ).toLowerCase();
    
            items.push({
                id: component.getId(),
                parentId: parent.getId(),
                label: component.getName() || tagName,
                tagName,
                depth,
                hasChildren: component.components().length > 0,
                component,
                canMoveUp: index > 0,
                canMoveDown: index < children.length - 1,
            });
    
            visit(component, depth + 1);
        });
    };

    const wrapper = editor.getWrapper();

    if (wrapper) {
        visit(wrapper, 0);
    }

    return items;
}

type BlockDragHandlers = {
    start: (blockId: string, event: Event) => void;
    drag: (event: Event) => void;
    stop: () => void;
};

function getSelectedStyles(editor: Editor): InspectorStyles {
    const selected = editor.getSelected();

    if (!selected) {
        return emptyStyles;
    }

    const inlineStyles = selected.getStyle() as Record<string, string>;
    const attributes = selected.getAttributes() as Record<string, string>;
    const tagName = String(selected.get('tagName') || 'div').toLowerCase();
    const element = selected.getEl();
    const view = element?.ownerDocument?.defaultView;
    const computedStyles = element && view ? view.getComputedStyle(element) : null;

    const editableTags = [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'span', 'a', 'button', 'li', 'label', 'strong', 'em',
    ];

    const canEditContent = selected.components().length === 0 && editableTags.includes(tagName);

    const readStyle = (cssProperty: string, camelCaseProperty: string,): string => {
        const inlineValue = inlineStyles[camelCaseProperty] ?? inlineStyles[cssProperty];

        if (inlineValue) {
            return inlineValue;
        }

        return computedStyles?.getPropertyValue(cssProperty).trim() ?? '';
    };

    return {
        ...emptyStyles,
        tagName,
        content: String(selected.get('content') || ''),
        href: String(attributes.href || ''),
        canEditContent,
        isLink: tagName === 'a',

        color: readStyle('color', 'color'),
        backgroundColor: readStyle('background-color', 'backgroundColor'),
        fontFamily: readStyle('font-family', 'fontFamily'),
        fontSize: readStyle('font-size', 'fontSize'),
        fontWeight: readStyle('font-weight', 'fontWeight'),
        lineHeight: readStyle('line-height', 'lineHeight'),
        textAlign: readStyle('text-align', 'textAlign'),
        display: readStyle('display', 'display'),
        flexDirection: readStyle('flex-direction', 'flexDirection'),
        justifyContent: readStyle('justify-content', 'justifyContent'),
        alignItems: readStyle('align-items', 'alignItems'),
        gap: readStyle('gap', 'gap'),
        width: isLayoutColumn(selected) ? String(attributes['data-wb-width'] || '') : readStyle('width', 'width'),
        maxWidth: readStyle('max-width', 'maxWidth'),
        height: readStyle('height', 'height'),
        minHeight: readStyle('min-height', 'minHeight'),
        margin: readStyle('margin', 'margin'),
        padding: readStyle('padding', 'padding'),
        borderRadius: readStyle('border-radius', 'borderRadius'),
        borderWidth: readStyle('border-width', 'borderWidth'),
        borderStyle: readStyle('border-style', 'borderStyle'),
        borderColor: readStyle('border-color', 'borderColor'),
    };
}

function createLayoutMarkup(columns: 1 | 2 | 3 | 4): string {
    const columnMarkup = Array.from(
        { length: columns },
        (_, index) => `
            <div class="wb-layout-column">
                <h3>Column ${index + 1}</h3>
                <p>Add content here.</p>
            </div>
        `,
    ).join('');

    return `
        <section class="wb-layout-section">
            <div
                class="wb-layout-columns"
                style="--wb-column-count: ${columns};"
            >
                ${columnMarkup}
            </div>
        </section>
    `;
}

function canContainComponents(component: Component): boolean {
    const tagName = String(component.get('tagName') || '').toLowerCase();
    const voidTags = new Set([
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
        'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
    ]);

    return component.get('droppable') !== false && !voidTags.has(tagName);
}

const DROP_TARGET_TAGS = new Set([
    'div',
    'section',
    'main',
    'header',
    'footer',
    'article',
    'nav',
    'aside',
]);

const VOID_TAGS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);

function isLayoutColumn(component: Component): boolean {
    const className = String(
        component.getAttributes().class || '',
    );

    return className.split(/\s+/).includes('wb-layout-column');
}

function canAcceptNativeDrop(source: Component, target: Component ): boolean {
    const sourceTag = String(source?.get('tagName') || '').toLowerCase();
    const targetTag = String(target?.get('tagName') || '').toLowerCase();
    const sourceClass = String(source?.getAttributes().class || '');
    const targetClass = String(target?.getAttributes().class || '');
    const reject = (reason: string): boolean => {
        console.warn('[DnD][VALIDATION] REJECT', {
            reason,
            source: {
                id: source?.getId(),
                tagName: sourceTag,
                className: sourceClass,
            },
            target: {
                id: target?.getId(),
                tagName: targetTag,
                className: targetClass,
            },
        });

        return false;
    };

    if (!source || !target || source === target) {
        return reject('source/target kosong atau sama');
    }

    if (sourceTag === 'body' || source.is('wrapper') || VOID_TAGS.has(targetTag)) {
        return reject('source wrapper/body atau target void');
    }

    const isValidTarget = DROP_TARGET_TAGS.has(targetTag) || isLayoutColumn(target);

    if (!isValidTarget) {
        return reject('target tidak termasuk target yang diizinkan');
    }

    let ancestor: Component | undefined = target;

    while (ancestor) {
        if (ancestor === source) {
            return reject('target adalah source atau keturunannya');
        }

        ancestor = ancestor.parent() ?? undefined;
    }

    console.debug('[DnD][VALIDATION] ACCEPT', {
        source: {
            id: source.getId(),
            tagName: sourceTag,
            className: sourceClass,
        },
        target: {
            id: target.getId(),
            tagName: targetTag,
            className: targetClass,
        },
    });

    return true;
}

function enableComponentDragDrop(
    component: Component,
): void {
    const tagName = String(component.get('tagName') || '').toLowerCase();

    const canBeMoved = !VOID_TAGS.has(tagName);

    component.set({
        draggable: canBeMoved ? (source: Component, target: Component ) => canAcceptNativeDrop(source, target) : false,
        droppable: (source: Component, target: Component) => canAcceptNativeDrop(source, target)
    });

    component.components().models.forEach((child) => {
        enableComponentDragDrop(child);
    });
}

function updateLayoutColumnWidths(parent: Component): void {
    const components = parent.components().models as Component[];

    const columns = components.filter((component: Component) =>
        isLayoutColumn(component),
    );

    if (columns.length === 0) {
        return;
    }

    const explicitWidths: (number | null)[] = columns.map((column: Component): number | null => {
            const value = String(column.getAttributes()['data-wb-width'] || '').trim();

            if (!/^\d+(?:\.\d+)?%$/.test(value)) {
                return null;
            }

            const width = Number.parseFloat(value);

            return Number.isFinite(width) && width > 0 && width <= 100 ? width : null;
        }
    );

    const specifiedTotal = explicitWidths.reduce<number>((total, width) => total + (width ?? 0), 0);

    const unspecifiedCount = explicitWidths.filter((width) => width === null).length;

    const remaining = Math.max(0, 100 - specifiedTotal);

    const automaticWidth = unspecifiedCount > 0 ? remaining / unspecifiedCount : 0;

    const widths = explicitWidths.map((width) => width ?? automaticWidth);

    const total = widths.reduce<number>((sum, width) => sum + width, 0);

    const normalizedWidths = total > 100 ? widths.map((width) => (width / total) * 100) : widths;

    parent.setStyle({
        ...parent.getStyle(), 'grid-template-columns': normalizedWidths.map((width) => `minmax(0, ${width}fr)`).join(' ')
    });
}

type ComponentLocation = {
    id: string;
    tagName: string;
    parentId: string | null;
    parentTag: string | null;
    index: number;
};

function getComponentLocation(
    component: Component,
): ComponentLocation {
    const parent = component.parent();

    return {
        id: component.getId(),
        tagName: String(component.get('tagName') || 'div'),
        parentId: parent?.getId() ?? null,
        parentTag: parent
            ? String(parent.get('tagName') || 'div')
            : null,
        index: component.index(),
    };
}

export default function EditorPage({ websiteSlug, websiteId, websiteContent }: EditorPageProps) {
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>(
        websiteContent ? 'saved' : 'unsaved',
    );
    const [blocksOpen, setBlocksOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(true);
    const [preview, setPreview] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    
    const [navigatorItems, setNavigatorItems] = useState<NavigatorItem[]>([]);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [navigatorOpen, setNavigatorOpen] = useState(true);
    const [collapsedNavigatorIds, setCollapsedNavigatorIds] = useState<Set<string>>(() => new Set());
    
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState('');
    const [styles, setStyles] = useState<InspectorStyles>(emptyStyles);

    const blockDragHandlersRef = useRef<BlockDragHandlers | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const inspectorStyleChangeRef = useRef(false);
    
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    const syncSelection = useCallback((editor: Editor) => {
        const selected = editor.getSelected();
    
        if (!selected) {
            setSelectedComponentId(null);
            setSelectedElement(null);
            setStyles(emptyStyles);
            return;
        }
    
        setSelectedComponentId(selected.getId());
    
        // Buka semua ancestor agar elemen terpilih terlihat.
        const wrapper = editor.getWrapper();
        const ancestorIds: string[] = [];
        let parent = selected.parent();
    
        while (parent && parent !== wrapper) {
            ancestorIds.push(parent.getId());
            parent = parent.parent();
        }
    
        if (ancestorIds.length > 0) {
            setCollapsedNavigatorIds((current) => {
                const next = new Set(current);
    
                ancestorIds.forEach((id) => next.delete(id));
    
                return next;
            });
        }
    
        const tagName = String(selected.get('tagName') || 'element').toLowerCase();
    
        setSelectedElement(`<${tagName}>`);
        setStyles(getSelectedStyles(editor));
    }, []);
    
    const syncHistory = useCallback((editor: Editor) => {
        setCanUndo(editor.UndoManager.hasUndo());
        setCanRedo(editor.UndoManager.hasRedo());
    }, []);
    
    const syncNavigator = useCallback((editor: Editor) => {
        setNavigatorItems(getNavigatorItems(editor));
    }, []);
        
    const saveDraft = useCallback(() => {
        const editor = editorRef.current;
    
        if (!editor) {
            return;
        }
    
        const content = editor.getProjectData();
    
        router.put(`/websites/${websiteId}/draft`, { content }, {
                preserveScroll: true,
                onStart: () => setSaveStatus('saving'),
                onSuccess: () => setSaveStatus('saved'),
                onError: () => setSaveStatus('error'),
            },
        );
    }, [websiteId]);
    
    const markDraftUnsaved = useCallback(() => {
        setSaveStatus((current) => current === 'saving' ? current : 'unsaved');
    }, []);

    useEffect(() => {
        const container = canvasRef.current;

        if (!container || editorRef.current) {
            return;
        }

        const editor = grapesjs.init({
            container,
            height: '100%',
            width: '100%',
            fromElement: false,

            // Penyimpanan akan ditambahkan pada tahap berikutnya.
            storageManager: false,
            
            projectData: websiteContent ?? undefined,

            // Kita menggunakan panel React sendiri.
            panels: {
                defaults: [],
            },

            // Panel blok React ditampilkan di luar GrapesJS.
            blockManager: {
                custom: true,
            },

            selectorManager: {
                componentFirst: true,
            },

            canvas: {
                styles: [],
            },
        });
        const rteModule = editor.RichTextEditor;
        const originalLinkAction = rteModule.get('link');
        
        if (originalLinkAction) {
            rteModule.remove('link');
        
            rteModule.add('link', {
                ...originalLinkAction,
        
                result: (rte) => {
                    const selection = rte.doc.getSelection();
        
                    if (!selection || selection.rangeCount === 0) {
                        return;
                    }
        
                    const range = selection.getRangeAt(0).cloneRange();
        
                    if (range.collapsed || !range.toString().trim()) {
                        return;
                    }
        
                    const startNode = range.startContainer;
                    const startElement =
                        startNode.nodeType === 1
                            ? startNode as Element
                            : startNode.parentElement;
        
                    const existingLink = startElement?.closest('a');
                    const currentUrl = existingLink?.getAttribute('href') ?? '';
        
                    const url = rte.doc.defaultView?.prompt(
                        'Masukkan URL tujuan:',
                        currentUrl,
                    );
        
                    if (url === null || url === undefined) {
                        return;
                    }
        
                    const trimmedUrl = url.trim();
        
                    if (!trimmedUrl) {
                        return;
                    }
        
                    selection.removeAllRanges();
                    selection.addRange(range);
        
                    if (existingLink) {
                        existingLink.setAttribute('href', trimmedUrl);
                    } else {
                        rte.exec('createLink', trimmedUrl);
                    }
                },
            });
        }
        ([1, 2, 3, 4] as const).forEach((columns) => {
            editor.BlockManager.add(`wb-layout-${columns}`, {
                label: `Layout ${columns} column`,
                category: 'Quick Layout',
                content: createLayoutMarkup(columns),
            });
        });
        
        editor.on('block:custom', ({ bm, dragStart, drag, dragStop }) => {
            blockDragHandlersRef.current = {
                start: (blockId, event) => {
                    const block = bm.get(blockId);
        
                    if (block) {
                        dragStart(block, event);
                    }
                },
                drag,
                stop: () => dragStop(),
            };
        });
        
        elementRegistry.forEach((block) => {
            editor.BlockManager.add(block.id, {
                label:  block.label,
                category: block.category,
                content: block.content,
                select: true,
                attributes: {
                    title: block.label,
                },
            });
        });

        const hasSavedProject =
            websiteContent !== null &&
            websiteContent !== undefined &&
            Object.keys(websiteContent).length > 0;
        
        if (!hasSavedProject) {
            editor.setComponents(`
                <section class="wb-hero">
                    <p class="wb-eyebrow">WELCOME</p>
                    <h1>Build that something awesome.</h1>
                    <p>
                        It is front page. Select block from left panel
                        to start arrange website
                    </p>
                    <a class="wb-hero__button" href="#">
                        Start now
                    </a>
                </section>
            `);
        }
        
        const wrapper = editor.getWrapper();
        
        if (wrapper) {
            enableComponentDragDrop(wrapper);
        }

        editor.setStyle(`
            body {
                margin: 0;
                font-family: Arial, Helvetica, sans-serif;
                color: #24263a;
            }

            .wb-hero {
                min-height: 420px;
                padding: 64px 32px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                justify-content: center;
                background: #f7f6ff;
            }

            .wb-eyebrow {
                color: #6658e8;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 1.5px;
            }

            .wb-hero h1 {
                max-width: 650px;
                margin: 8px 0 16px;
                font-size: 42px;
                line-height: 1.12;
            }

            .wb-hero p:not(.wb-eyebrow) {
                max-width: 540px;
                color: #666b80;
                font-size: 16px;
                line-height: 1.8;
            }

            .wb-hero__button {
                display: inline-block;
                margin-top: 12px;
                padding: 12px 20px;
                border-radius: 8px;
                color: #fff;
                background: #6658e8;
                font-weight: 700;
                text-decoration: none;
            }

            @media (max-width: 600px) {
                .wb-hero {
                    padding: 36px 20px;
                }

                .wb-hero h1 {
                    font-size: 32px;
                }
            }
            
            .wb-layout-section {
                box-sizing: border-box;
                width: 100%;
                padding: 24px;
                margin: 0 0 20px;
            }
            
            .wb-layout-columns {
                display: grid;
                grid-template-columns:
                    repeat(var(--wb-column-count, 2), minmax(0, 1fr));
                gap: 16px;
            }
            
            .wb-layout-column {
                box-sizing: border-box;
                min-width: 0;
                padding: 20px;
                border: 1px dashed #c9cddd;
                border-radius: 8px;
                background: #f8fafc;
            }
            
            .wb-layout-column h3 {
                margin: 0 0 8px;
            }
            
            .wb-layout-column p {
                margin: 0;
                color: #666b80;
                line-height: 1.6;
            }
            
            @media (max-width: 640px) {
                .wb-layout-columns {
                    grid-template-columns: 1fr;
                }
            }
        `); 

        const handleStyleableChange = () => {
            if (inspectorStyleChangeRef.current) {
                return;
            }
        
            syncSelection(editor);
        };
        
        
        const handleComponentAdded = (component: Component) => {
            enableComponentDragDrop(component);
        };
        
        editor.on('component:add', handleComponentAdded);
        
        const dragAudit = new Map<string, { component: Component; before: ComponentLocation; }>();
        
        type ComponentDragAuditEvent = {
            target?: Component;
            parent?: Component;
            index?: number;
        };
        
        const handleDragStart = ({ target, parent, index }: { target?: Component; parent?: Component; index?: number; }) => {
            
            if (!target) {
                console.warn('[DnD][START] target undefined');
                return;
            }
        
            const el = target.getEl();
        
            console.group('[DnD][START]');
            console.log('Model ID:', target.getId());
            console.log('Model tagName:', target.get('tagName'));
            console.log('Model type:', target.get('type'));
            console.log('Model content:', target.get('content'));
            console.log('Model attributes:', target.getAttributes());
            console.log('DOM element:', el);
            console.log('DOM tagName:', el?.tagName);
            console.log('DOM text:', el?.textContent);
            console.log('Parent ID:', parent?.getId());
            console.log('Parent tagName:', parent?.get('tagName'));
            console.log('Index:', index);
            console.trace('[DnD][START] trace');
            
            console.groupEnd();
        
            dragAudit.set(target.getId(), {
                component: target,
                before: getComponentLocation(target),
            });
        };

        const handleDragEnd = ({ target, parent, index }: ComponentDragAuditEvent) => {
            // Jangan mengakses komponen jika target tidak tersedia.
            if (!target) {
                console.warn('[DnD] Drag ended without a component target.');
                return;
            }
        
            const component = target;
            const snapshot = dragAudit.get(component.getId());
            
            if (target && parent) {
                const moveCheck = editor.Components.canMove(parent,target,index);
            
                console.log('[DnD][CAN MOVE]', {
                    sourceId: target.getId(),
                    targetParentId: parent.getId(),
                    targetParentTag: parent.get('tagName'),
                    targetParentClass: parent.getAttributes().class || '',
                    candidateIndex: index,
                    result: moveCheck.result,
                    reason: moveCheck.reason,
                });
            }

        
            requestAnimationFrame(() => {
                const after = getComponentLocation(component);
                const element = component.getEl();
        
                console.group('[DnD] RESULT');
                console.log('Before:', snapshot?.before ?? null);
                console.log('Drop candidate parent:', parent?.getId() ?? null);
                console.log('Drop candidate index:', index);
                console.log('Actual model after:', after);
                console.log('Rendered element exists:', Boolean(element));
                console.log('Rendered element connected:', Boolean(element?.isConnected));
                console.log('Component JSON:', component.toJSON());
                console.groupEnd();
        
                dragAudit.delete(component.getId());
        
                syncNavigator(editor);
                syncSelection(editor);
                markDraftUnsaved();
            });
        };
        
        const handleDragMove = ({ target, parent, index }: { target?: Component; parent?: Component; index?: number; }) => {
            
            if (!target) {
                return;
            }
        
            console.log('[DnD][MOVE]', {
                source: {
                    id: target.getId(),
                    tagName: target.get('tagName'),
                    type: target.get('type'),
                    content: target.get('content'),
                },
                candidateParent: parent
                    ? {
                          id: parent.getId(),
                          tagName: parent.get('tagName'),
                          type: parent.get('type'),
                  }
                    : null,
                candidateIndex: index,
            });
        };
        
        editor.on('component:drag:start', handleDragStart);
        editor.on('component:drag', handleDragMove);
        editor.on('component:drag:end', handleDragEnd);

        editor.on('component:selected', () => syncSelection(editor));
        editor.on('component:deselected', () => syncSelection(editor));
        editor.on('styleable:change', handleStyleableChange);

        // Jadikan halaman awal sebagai kondisi dasar.
        // Undo tidak perlu membatalkan pembuatan template awal.
        editor.UndoManager.clear();
        
        editorRef.current = editor;
        syncHistory(editor);
        
        const refreshNavigator = () => {
            window.requestAnimationFrame(() => {
                if (editorRef.current === editor) {
                    syncNavigator(editor);
                }
            });
        };
        
        editor.on('component:add', markDraftUnsaved);
        editor.on('component:remove', markDraftUnsaved);
        editor.on('component:update', markDraftUnsaved);
        editor.on('component:styleUpdate', markDraftUnsaved);
        editor.on('styleable:change', markDraftUnsaved);
        
        editor.on('component:add', refreshNavigator);
        editor.on('component:remove', refreshNavigator);
        editor.on('component:drag:end', refreshNavigator);
        
        syncNavigator(editor);
        
        const refreshHistory = () => {
            window.requestAnimationFrame(() => {
                if (editorRef.current === editor) {
                    syncHistory(editor);
                }
            });
        };
        
        // Daftarkan listener satu kali saat editor dibuat.
        editor.on('component:add', refreshHistory);
        editor.on('component:remove', refreshHistory);
        editor.on('component:update', refreshHistory);
        editor.on('component:styleUpdate', refreshHistory);
        editor.on('styleable:change', refreshHistory);
        editor.on('undo', refreshHistory);
        editor.on('redo', refreshHistory);
        
        const handleHistoryShortcut = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName?.toLowerCase();
        
            // Jangan mengambil alih shortcut ketika pengguna sedang mengetik.
            if (
                tagName === 'input' ||
                tagName === 'textarea' ||
                tagName === 'select' ||
                target?.isContentEditable ||
                target?.closest?.('[contenteditable="true"]')
            ) {
                return;
            }
        
            const key = event.key.toLowerCase();
            const hasModifier = event.ctrlKey || event.metaKey;
        
            if (!hasModifier || event.altKey) {
                return;
            }
        
            const isUndo = key === 'z' && !event.shiftKey;
            const isRedo = (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey && !event.metaKey);
        
            if (isUndo) {
                event.preventDefault();
        
                if (editor.UndoManager.hasUndo()) {
                    editor.UndoManager.undo();
                    syncSelection(editor);
                }
        
                syncHistory(editor);
                return;
            }
        
            if (isRedo) {
                event.preventDefault();
        
                if (editor.UndoManager.hasRedo()) {
                    editor.UndoManager.redo();
                    syncSelection(editor);
                }
        
                syncHistory(editor);
            }
        };    
        
        // Shortcut GrapesJS bawaan diganti dengan handler yang
        // melindungi input dan area pengeditan Text.
        editor.Keymaps.remove('core:undo');
        editor.Keymaps.remove('core:redo');
        
        document.addEventListener('keydown', handleHistoryShortcut);
        
        // Kanvas GrapesJS berjalan di dalam iframe, jadi pasang
        // listener juga pada dokumen kanvas.
        let canvasDocument: Document | null = null;
        
        const attachCanvasKeyboard = () => {
            const frame = editor.Canvas.getFrameEl();
            const nextDocument = frame?.contentDocument ?? null;
        
            if (!nextDocument || nextDocument === canvasDocument) {
                return;
            }
        
            canvasDocument?.removeEventListener('keydown', handleHistoryShortcut);
        
            canvasDocument = nextDocument;
            canvasDocument.addEventListener('keydown', handleHistoryShortcut);
        };
        
        editor.on('canvas:frame:load', attachCanvasKeyboard);
        attachCanvasKeyboard();
        
        return () => {
            document.removeEventListener('keydown', handleHistoryShortcut);

            canvasDocument?.removeEventListener('keydown', handleHistoryShortcut);
            
            editor.off('canvas:frame:load', attachCanvasKeyboard);
            editor.off('component:add', refreshNavigator);
            editor.off('component:remove', refreshNavigator);
            editor.off('component:drag:end', refreshNavigator);
            editor.off('component:add', refreshHistory);
            editor.off('component:add', handleComponentAdded);
            editor.off('component:remove', refreshHistory);
            editor.off('component:update', refreshHistory);
            editor.off('component:styleUpdate', refreshHistory);
            editor.off('styleable:change', handleStyleableChange);
            editor.off('undo', refreshHistory);
            editor.off('redo', refreshHistory);
            editor.off('component:add', markDraftUnsaved);
            editor.off('component:remove', markDraftUnsaved);
            editor.off('component:update', markDraftUnsaved);
            editor.off('component:styleUpdate', markDraftUnsaved);
            editor.off('styleable:change', markDraftUnsaved);
            editor.off('component:drag:start', handleDragStart);
            editor.off('component:drag:end', handleDragEnd);
            editor.off('component:drag', handleDragMove);
            editor.destroy();
            editorRef.current = null;
        };
    }, [syncSelection, syncHistory, syncNavigator, markDraftUnsaved]);

    const addBlock = (block: EditorBlock) => {
        const editor = editorRef.current;
        const wrapper = editor?.getWrapper();
    
        if (!editor || !wrapper) return;
    
        const selected = editor.getSelected();
    
        const target = selected && canContainComponents(selected)
            ? selected
            : selected?.parent() ?? wrapper;
    
        const added = target.append(block.content);
        const component = added[0];
    
        if (component) {
            editor.select(component);
            syncSelection(editor);
            syncNavigator(editor);
            syncHistory(editor);
        }
    };

    const changeStyle = (property: InspectorProperty, value: string) => {
        const editor = editorRef.current;
        const selected = editor?.getSelected();
    
        if (!editor || !selected) {
            return;
        }
    
        if (property === 'content') {
            selected.set('content', value);
            syncSelection(editor);
            return;
        }
    
        if (property === 'href') {
            selected.addAttributes({ href: value });
            syncSelection(editor);
            return;
        }
        
        if (property === 'width' && isLayoutColumn(selected)) {
            const parent = selected.parent();
        
            if (!parent) {
                return;
            }
        
            const normalizedValue = value.trim();
        
            // Pertahankan nilai yang sedang diketik, termasuk nilai sementara.
            setStyles((current) => ({
                ...current,
                width: value,
            }));
        
            if (normalizedValue === '') {
                selected.removeAttributes('data-wb-width');
                updateLayoutColumnWidths(parent);
                return;
            }
        
            // Lebar khusus kolom saat ini menggunakan satuan persen.
            // Jangan menolak input sementara seperti "5" ketika mengetik "50%".
            if (!/^\d+(?:\.\d+)?%$/.test(normalizedValue)) {
                return;
            }
        
            const width = Number.parseFloat(normalizedValue);
        
            if (!Number.isFinite(width) || width <= 0 || width > 100) {
                return;
            }
        
            selected.addAttributes({
                'data-wb-width': normalizedValue,
            });
        
            updateLayoutColumnWidths(parent);
            return;
        }

    
        const cssProperties: Partial<Record<InspectorProperty, string>> = {
            color: 'color',
            backgroundColor: 'background-color',
            fontFamily: 'font-family',
            fontSize: 'font-size',
            fontWeight: 'font-weight',
            lineHeight: 'line-height',
            textAlign: 'text-align',
            display: 'display',
            flexDirection: 'flex-direction',
            justifyContent: 'justify-content',
            alignItems: 'align-items',
            gap: 'gap',
            width: 'width',
            maxWidth: 'max-width',
            height: 'height',
            minHeight: 'min-height',
            margin: 'margin',
            padding: 'padding',
            borderRadius: 'border-radius',
            borderWidth: 'border-width',
            borderStyle: 'border-style',
            borderColor: 'border-color',
        };
    
        const cssProperty = cssProperties[property];
    
        if (!cssProperty) {
            return;
        }
    
        inspectorStyleChangeRef.current = true;
        try {
            selected.addStyle({ [cssProperty]: value });
        } finally {
            inspectorStyleChangeRef.current = false;
        }
        
        setStyles((current) => ({...current, [property]: value }));
    };

    const togglePreview = () => {
        const editor = editorRef.current;

        if (editor) {
            if (preview) {
                editor.stopCommand('preview');
            } else {
                editor.runCommand('preview');
            }
        }

        setPreview((current) => !current);
    };
    
    const handleUndo = () => {
        const editor = editorRef.current;
    
        if (!editor || !editor.UndoManager.hasUndo()) {
            return;
        }
    
        editor.UndoManager.undo();
        syncSelection(editor);
        syncHistory(editor);
    };
    
    const handleRedo = () => {
        const editor = editorRef.current;
        
        if (!editor || !editor.UndoManager.hasRedo()) {
            return;
        }
    
        editor.UndoManager.redo();
        syncSelection(editor);
        syncHistory(editor);
    };
    
    const handleBlockDragStart = (blockId: string, event: Event) => {
        const handlers = blockDragHandlersRef.current;
    
        if (!handlers) {
            event.preventDefault();
            return;
        }
    
        handlers.start(blockId, event);
    };
    
    const handleBlockDrag = (event: Event) => {
        blockDragHandlersRef.current?.drag(event);
    };
    
    const handleBlockDragStop = () => {
        blockDragHandlersRef.current?.stop();
    };
    
    const selectNavigatorItem = (component: Component) => {
        const editor = editorRef.current;
    
        if (!editor) return;
    
        editor.select(component);
        syncSelection(editor);
    };
    
    const moveNavigatorItem = (component: Component, direction: -1 | 1) => {
        const editor = editorRef.current;
        const parent = component.parent();
    
        if (!editor || !parent) return;
    
        const index = component.index();
        const nextIndex = index + direction;
        const siblingCount = parent.components().length;
    
        if (nextIndex < 0 || nextIndex >= siblingCount) {
            return;
        }
    
        // GrapesJS menyesuaikan indeks ketika komponen
        // dipindahkan dalam parent yang sama.
        const at = direction === -1 ? nextIndex : nextIndex + 1;
    
        component.move(parent, { at });
    
        editor.select(component);
        syncSelection(editor);
        syncNavigator(editor);
        syncHistory(editor);
    };
    
    const toggleNavigatorItem = (id: string) => {
        setCollapsedNavigatorIds((current) => {
            const next = new Set(current);
    
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
    
            return next;
        });
    };
    
    const addLayoutPreset = (columns: 1 | 2 | 3 | 4) => {
        const editor = editorRef.current;
    
        if (!editor) return;
    
        const selected = editor.getSelected();
        const containerTags = [
            'div',
            'section',
            'main',
            'header',
            'footer',
            'article',
            'nav',
            'aside',
        ];
    
        const selectedTag = String(selected?.get('tagName') || '').toLowerCase();
    
        const wrapper = editor.getWrapper();

        if (!wrapper) {
            return;
        }
        
        const target = selected && containerTags.includes(selectedTag) ? selected : wrapper;
    
        const columnMarkup = Array.from({ length: columns },
            (_, index) => `
                <div class="wb-layout-column">
                    <h3>Column ${index + 1}</h3>
                    <p>Add content here.</p>
                </div>
            `,
        ).join('');
    
        const markup = `
            <section class="wb-layout-section">
                <div
                    class="wb-layout-columns"
                    style="--wb-column-count: ${columns};"
                >
                    ${columnMarkup}
                </div>
            </section>
        `;
    
        const added = target.append(markup);
        const component = added[0];
    
        if (component) {
            editor.select(component);
            syncSelection(editor);
        }
    
        syncNavigator(editor);
        syncHistory(editor);
    };

    return (
        <>
            <Head title={`Editor — ${websiteSlug}`} />

            <EditorLayout
                websiteName={websiteSlug}
                blocks={elementRegistry}
                categories={elementCategories}
                searchValue={searchValue}
                categoryFilter={categoryFilter}
                onSearchChange={setSearchValue}
                onCategoryFilterChange={setCategoryFilter}
                blocksOpen={blocksOpen}
                settingsOpen={settingsOpen}
                preview={preview}
                selectedElement={selectedElement}
                styles={styles}
                onToggleBlocks={() => setBlocksOpen((current) => !current)}
                onToggleSettings={() => setSettingsOpen((current) => !current)}
                onTogglePreview={togglePreview}
                onAddBlock={addBlock}
                onBlockDragStart={handleBlockDragStart}
                onBlockDrag={handleBlockDrag}
                onBlockDragStop={handleBlockDragStop}
                onStyleChange={changeStyle}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                navigatorItems={navigatorItems}
                selectedComponentId={selectedComponentId}
                onSelectNavigatorItem={selectNavigatorItem}
                onMoveNavigatorItem={moveNavigatorItem}
                navigatorOpen={navigatorOpen}
                collapsedNavigatorIds={collapsedNavigatorIds}
                onToggleNavigatorItem={toggleNavigatorItem}
                onToggleNavigator={() => {
                    setNavigatorOpen((open) => !open);
                }}
                onAddLayoutPreset={addLayoutPreset}
                saveStatus={saveStatus}
                onSaveDraft={saveDraft}
            >
                <div
                    id="gjs-canvas"
                    ref={canvasRef}
                    className="gjs-canvas-mount"
                />
            </EditorLayout>
        </>
    );
}
