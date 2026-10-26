import { Head } from '@inertiajs/react';
import grapesjs, { type Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import EditorLayout, { type InspectorProperty, type InspectorStyles } from '../layouts/editor-layout';
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

    const style = selected.getStyle() as Record<string, string>;
    const attributes = selected.getAttributes() as Record<string, string>;
    const tagName = String(selected.get('tagName') || 'div').toLowerCase();
    const canEditContent =
        selected.components().length === 0 &&
        ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a',
            'button', 'li', 'label', 'strong', 'em'].includes(tagName);

    const readStyle = (property: string) => style[property] || '';

    return {
        tagName,
        content: String(selected.get('content') || ''),
        href: attributes.href || '',
        canEditContent,
        isLink: tagName === 'a',
        color: readStyle('color'),
        backgroundColor: readStyle('background-color') || readStyle('backgroundColor'),
        fontFamily: readStyle('font-family') || readStyle('fontFamily'),
        fontSize: readStyle('font-size') || readStyle('fontSize'),
        fontWeight: readStyle('font-weight') || readStyle('fontWeight'),
        lineHeight: readStyle('line-height') || readStyle('lineHeight'),
        textAlign: readStyle('text-align') || readStyle('textAlign'),
        display: readStyle('display'),
        flexDirection: readStyle('flex-direction') || readStyle('flexDirection'),
        justifyContent: readStyle('justify-content') || readStyle('justifyContent'),
        alignItems: readStyle('align-items') || readStyle('alignItems'),
        gap: readStyle('gap'),
        width: readStyle('width'),
        maxWidth: readStyle('max-width') || readStyle('maxWidth'),
        margin: readStyle('margin'),
        padding: readStyle('padding'),
        borderRadius: readStyle('border-radius') || readStyle('borderRadius'),
    };
}

export default function EditorPage({ websiteSlug }: EditorPageProps) {
    const [blocksOpen, setBlocksOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(true);
    const [preview, setPreview] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Semua');
    const [styles, setStyles] = useState<InspectorStyles>(emptyStyles);

    const blockDragHandlersRef = useRef<BlockDragHandlers | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const syncSelection = useCallback((editor: Editor) => {
        const selected = editor.getSelected();

        if (!selected) {
            setSelectedElement(null);
            setStyles(emptyStyles);
            return;
        }

        const tagName = String(
            selected.get('tagName') || 'element',
        ).toLowerCase();

        setSelectedElement(`<${tagName}>`);
        setStyles(getSelectedStyles(editor));
    }, []);
    
    const syncHistory = useCallback((editor: Editor) => {
        setCanUndo(editor.UndoManager.hasUndo());
        setCanRedo(editor.UndoManager.hasRedo());
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
                label: `${block.icon} ${block.label}`,
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
                <p class="wb-eyebrow">SELAMAT DATANG</p>
                <h1>Bangun sesuatu yang hebat.</h1>
                <p>
                    Ini adalah halaman awal Anda. Pilih blok dari panel kiri
                    untuk mulai menyusun website.
                </p>
                <a class="wb-hero__button" href="#">
                    Mulai sekarang
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
        `); 

        editor.on('component:selected', () => syncSelection(editor));
        editor.on('component:deselected', () => syncSelection(editor));
        editor.on('styleable:change', () => syncSelection(editor));

        // Jadikan halaman awal sebagai kondisi dasar.
        // Undo tidak perlu membatalkan pembuatan template awal.
        editor.UndoManager.clear();
        
        editorRef.current = editor;
        syncHistory(editor);
        
        const refreshHistory = () => {
            window.requestAnimationFrame(() => {
                if (editorRef.current === editor) {
                    syncHistory(editor);
                }
            });
        };
        
        const handleHistoryShortcut = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const tagName = target?.tagName?.toLowerCase();
    
        // Perbarui status tombol ketika struktur atau gaya berubah.
        editor.on('component:add', refreshHistory);
        editor.on('component:remove', refreshHistory);
        editor.on('component:update', refreshHistory);
        editor.on('component:styleUpdate', refreshHistory);
        editor.on('styleable:change', refreshHistory);
        editor.on('undo', refreshHistory);
        editor.on('redo', refreshHistory);
    
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
        const isRedo =
            (key === 'z' && event.shiftKey) ||
            (key === 'y' && event.ctrlKey && !event.metaKey);
    
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
    // melindungi input dan area pengeditan teks.
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
    
        canvasDocument?.removeEventListener(
            'keydown',
            handleHistoryShortcut,
        );
    
        canvasDocument = nextDocument;
        canvasDocument.addEventListener(
            'keydown',
            handleHistoryShortcut,
        );
    };
    
    editor.on('canvas:frame:load', attachCanvasKeyboard);
    attachCanvasKeyboard();
        
        return () => {
            document.removeEventListener('keydown', handleHistoryShortcut);

            canvasDocument?.removeEventListener(
                'keydown',
                handleHistoryShortcut,
            );
            
            editor.off('canvas:frame:load', attachCanvasKeyboard);
            editor.destroy();
            editorRef.current = null;
        };
    }, [syncSelection, syncHistory]);

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
    
        selected.addStyle({ [cssProperty]: value });
        setStyles(getSelectedStyles(editor));
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
