import { Head } from '@inertiajs/react';
import grapesjs, { type Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import EditorLayout, {
    type EditorBlock,
    type InspectorStyles,
} from '../layouts/editor-layout';
import '../../css/editor.scss';

type EditorPageProps = {
    websiteSlug: string;
};

const blocks: EditorBlock[] = [
    {
        id: 'wb-heading',
        label: 'Heading',
        icon: 'T',
        content:
            '<h1 style="font-size:36px;font-weight:700;margin:0 0 16px;">Judul halaman</h1>',
    },
    {
        id: 'wb-text',
        label: 'Text',
        icon: '¶',
        content:
            '<p style="font-size:16px;line-height:1.7;margin:0 0 16px;">Tambahkan teks deskriptif di sini.</p>',
    },
    {
        id: 'wb-image',
        label: 'Image',
        icon: '▧',
        content:
            '<img src="https://placehold.co/960x420?text=Your+Image" alt="Gambar" style="display:block;width:100%;height:auto;border-radius:8px;" />',
    },
    {
        id: 'wb-button',
        label: 'Button',
        icon: '▱',
        content:
            '<a href="#" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#6658e8;color:#ffffff;text-decoration:none;font-weight:600;">Pelajari lebih lanjut</a>',
    },
    {
        id: 'wb-container',
        label: 'Container',
        icon: '▦',
        content:
            '<section style="padding:32px;margin:0 0 16px;background:#f4f5f9;border-radius:12px;"><h2 style="margin:0 0 12px;">Bagian baru</h2><p style="margin:0;line-height:1.7;">Konten bagian ini.</p></section>',
    },
    {
        id: 'wb-columns',
        label: 'Columns',
        icon: '↔',
        content:
            '<div style="display:flex;gap:20px;align-items:flex-start;margin:0 0 20px;"><div style="flex:1;min-width:0;padding:20px;background:#f4f5f9;border-radius:8px;">Kolom satu</div><div style="flex:1;min-width:0;padding:20px;background:#f4f5f9;border-radius:8px;">Kolom dua</div></div>',
    },
];

const emptyStyles: InspectorStyles = {
    color: '',
    backgroundColor: '',
    padding: '',
    fontSize: '',
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
    const [styles, setStyles] = useState<InspectorStyles>(emptyStyles);

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
                appendTo: undefined,
            },

            selectorManager: {
                componentFirst: true,
            },

            canvas: {
                styles: [],
            },
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

        if (!editor) {
            return;
        }

        // Tambahkan komponen ke halaman yang sedang diedit.
        const added = editor.addComponents(block.content);

        // Pilih komponen yang baru ditambahkan agar inspector langsung aktif.
        const component = added.at(0);

        if (component) {
            editor.select(component);
            syncSelection(editor);
        }
    };

    const changeStyle = (
        property: keyof InspectorStyles,
        value: string,
    ) => {
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

    return (
        <>
            <Head title={`Editor — ${websiteSlug}`} />

            <EditorLayout
                websiteName={websiteSlug}
                blocks={blocks}
                blocksOpen={blocksOpen}
                settingsOpen={settingsOpen}
                preview={preview}
                selectedElement={selectedElement}
                styles={styles}
                onToggleBlocks={() =>
                    setBlocksOpen((current) => !current)
                }
                onToggleSettings={() =>
                    setSettingsOpen((current) => !current)
                }
                onTogglePreview={togglePreview}
                onAddBlock={addBlock}
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
