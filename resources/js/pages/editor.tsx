import { Head } from '@inertiajs/react';
import grapesjs, { type Component, type Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import EditorLayout, { type InspectorProperty, type InspectorStyles, type NavigatorItem } from '../layouts/editor-layout';
import { elementCategories, elementRegistry, type EditorBlock } from '../lib/website-builder/element-registry';
import '../../css/editor.scss';

type EditorPageProps = {
    websiteSlug: string;
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
    margin: '',
    padding: '',
    borderRadius: '',
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
    const computedStyles =
        element && view ? view.getComputedStyle(element) : null;

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
        width: readStyle('width', 'width'),
        maxWidth: readStyle('max-width', 'maxWidth'),
        margin: readStyle('margin', 'margin'),
        padding: readStyle('padding', 'padding'),
        borderRadius: readStyle('border-radius', 'borderRadius'),
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

export default function EditorPage({ websiteSlug }: EditorPageProps) {
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

        editor.setComponents(`
            <section class="wb-hero">
                <p class="wb-eyebrow">WELCOME</p>
                <h1>Build that something awesome.</h1>
                <p>It is front page. Select block from left panel to start arrange website</p>
                <a class="wb-hero__button" href="#">
                    Start now
                </a>
            </section>
        `);

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
            editor.off('component:remove', refreshHistory);
            editor.off('component:update', refreshHistory);
            editor.off('component:styleUpdate', refreshHistory);
            editor.off('styleable:change', handleStyleableChange);
            editor.off('undo', refreshHistory);
            editor.off('redo', refreshHistory);
            editor.destroy();
            editorRef.current = null;
        };
    }, [syncSelection, syncHistory, syncNavigator]);

    const addBlock = (block: EditorBlock) => {
        const editor = editorRef.current;
    
        if (!editor) return;
    
        const added = editor.addComponents(block.content);
        const component = added.at(0);
    
        if (component) {
            editor.select(component);
            syncSelection(editor);
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
            margin: 'margin',
            padding: 'padding',
            borderRadius: 'border-radius',
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
    
        const columnMarkup = Array.from(
            { length: columns },
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
