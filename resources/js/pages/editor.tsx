import { Head } from '@inertiajs/react';
import grapesjs, { type Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import EditorLayout, { type InspectorStyles } from '../layouts/editor-layout';
import { elementCategories, elementRegistry, type EditorBlock } from '../lib/website-builder/element-registry';
import '../../css/editor.scss';

type EditorPageProps = {
    websiteSlug: string;
};

const emptyStyles: InspectorStyles = {
    color: '',
    backgroundColor: '',
    padding: '',
    fontSize: '',
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

    const current = selected.getStyle() as Record<string, string>;

    return {
        color: current.color || '',
        backgroundColor:
            current['background-color'] || current.backgroundColor || '',
        padding: current.padding || '',
        fontSize: current['font-size'] || current.fontSize || '',
    };
}

export default function EditorPage({ websiteSlug }: EditorPageProps) {
    const [blocksOpen, setBlocksOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(true);
    const [preview, setPreview] = useState(false);
    const [selectedElement, setSelectedElement] = useState<string | null>(
        null,
    );
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

        editorRef.current = editor;

        return () => {
            editor.destroy();
            editorRef.current = null;
        };
    }, [syncSelection]);

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

    const changeStyle = (property: keyof InspectorStyles, value: string) => {
        const editor = editorRef.current;
        const selected = editor?.getSelected();

        if (!editor || !selected) {
            return;
        }

        const cssProperty: Record<keyof InspectorStyles, string> = {
            color: 'color',
            backgroundColor: 'background-color',
            padding: 'padding',
            fontSize: 'font-size',
        };

        selected.addStyle({
            [cssProperty[property]]: value,
        });

        setStyles((current) => ({
            ...current,
            [property]: value,
        }));
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
    
    const handleBlockDragStart = (
        blockId: string,
        event: Event,
    ) => {
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
