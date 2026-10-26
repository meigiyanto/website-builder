import { Head } from '@inertiajs/react';
import grapesjs, { type Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import EditorLayout, { type EditorBlock, type InspectorStyles } from '../layouts/editor-layout';
import '../../css/editor.scss';

type EditorPageProps = {
    websiteSlug: string;
};

const blocks: EditorBlock[] = [
    /* Layout 5 block */
    {
        id: 'wb-divider',
        label: 'Divider',
        icon: '―',
        category: 'Layout',
        content: `<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />`,
    },
    {
        id: 'wb-spacer',
        label: 'Spacer',
        icon: '↕',
        category: 'Layout',
        content: `<div style="height:48px;" aria-hidden="true"></div>`,
    },
    {
        id: 'wb-hero-section',
        label: 'Hero Section',
        icon: '▣',
        category: 'Layout',
        content: `
            <section style="padding:64px 32px;text-align:center;background:linear-gradient(135deg,#f5f3ff,#eef2ff);border-radius:16px;">
                <p style="color:#6658e8;font-size:12px;font-weight:700;letter-spacing:1.5px;">KENALI PRODUK KAMI</p>
                <h1 style="max-width:720px;margin:0 auto 16px;font-size:42px;line-height:1.15;color:#24263a;">Bangun ide besar Anda di sini</h1>
                <p style="max-width:560px;margin:0 auto 24px;color:#666b80;line-height:1.8;">Jelaskan manfaat utama produk atau layanan Anda.</p>
                <a href="#" style="display:inline-block;padding:13px 22px;border-radius:8px;background:#6658e8;color:#fff;text-decoration:none;font-weight:700;">Mulai Sekarang</a>
            </section>
        `,
    },
    {
        id: 'wb-footer',
        label: 'Footer',
        icon: '▤',
        category: 'Layout',
        content: `
            <footer style="padding:32px 24px;background:#202238;color:#fff;border-radius:10px;">
                <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:20px;">
                    <div><strong style="font-size:20px;">Brand Anda</strong><p style="max-width:320px;color:#c7c8d5;line-height:1.7;">Solusi praktis untuk kebutuhan Anda.</p></div>
                    <div><strong>Jelajahi</strong><p><a href="#" style="color:#c7c8d5;">Tentang Kami</a></p><p><a href="#" style="color:#c7c8d5;">Kontak</a></p></div>
                </div>
                <hr style="border:0;border-top:1px solid #44465b;margin:24px 0 16px;" />
                <small style="color:#c7c8d5;">© 2026 Brand Anda. Hak cipta dilindungi.</small>
            </footer>
        `,
    },
    {
        id: 'wb-feature-grid',
        label: '3 Feature Columns',
        icon: '▦',
        category: 'Layout',
        content: `
            <section style="padding:36px 20px;">
                <h2 style="text-align:center;font-size:30px;">Mengapa memilih kami?</h2>
                <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">
                    <article style="padding:22px;border:1px solid #e5e7eb;border-radius:12px;">
                        <strong style="font-size:24px;">01</strong><h3>Praktis</h3><p>Mudah digunakan setiap hari.</p>
                    </article>
                    <article style="padding:22px;border:1px solid #e5e7eb;border-radius:12px;">
                        <strong style="font-size:24px;">02</strong><h3>Cepat</h3><p>Hemat waktu dan tenaga.</p>
                    </article>
                    <article style="padding:22px;border:1px solid #e5e7eb;border-radius:12px;">
                        <strong style="font-size:24px;">03</strong><h3>Terpercaya</h3><p>Fokus pada kualitas.</p>
                    </article>
                </div>
            </section>
        `,
    },

    /* Navigasi 1 block */
    {
        id: 'wb-navbar',
        label: 'Navigation Bar',
        icon: '☰',
        category: 'Navigasi',
        content: `
            <nav style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 24px;border-bottom:1px solid #e5e7eb;">
                <strong style="font-size:20px;">Brand Anda</strong>
                <div style="display:flex;flex-wrap:wrap;gap:18px;">
                    <a href="#" style="color:#24263a;text-decoration:none;">Beranda</a>
                    <a href="#" style="color:#24263a;text-decoration:none;">Tentang</a>
                    <a href="#" style="color:#24263a;text-decoration:none;">Layanan</a>
                    <a href="#" style="color:#24263a;text-decoration:none;">Kontak</a>
                </div>
            </nav>
        `,
    },

    /* Konten 5 block */
    {
        id: 'wb-bullet-list',
        label: 'Bullet List',
        icon: '☷',
        category: 'Konten',
        content: `
            <ul style="padding-left:24px;line-height:2;color:#34364a;">
                <li>Poin keunggulan pertama</li>
                <li>Poin keunggulan kedua</li>
                <li>Poin keunggulan ketiga</li>
            </ul>
        `,
    },
    {
        id: 'wb-quote',
        label: 'Quote',
        icon: '❞',
        category: 'Konten',
        content: `
            <blockquote style="margin:0;padding:18px 24px;border-left:4px solid #6658e8;background:#f7f6ff;font-size:20px;line-height:1.7;color:#34324d;">
                “Ide yang baik layak mendapatkan pengalaman digital yang hebat.”
            </blockquote>
        `,
    },
    {
        id: 'wb-faq',
        label: 'FAQ Item',
        icon: '?',
        category: 'Konten',
        content: `
            <details style="padding:18px 20px;border:1px solid #e5e7eb;border-radius:10px;">
                <summary style="cursor:pointer;font-weight:700;">Bagaimana cara memulai?</summary>
                <p style="margin-top:14px;color:#666b80;line-height:1.7;">Daftar akun, pilih paket yang sesuai, lalu ikuti panduan untuk memulai.</p>
            </details>
        `,
    },
    {
        id: 'wb-alert',
        label: 'Notice / Alert',
        icon: '!',
        category: 'Konten',
        content: `
            <div role="note" style="padding:16px 18px;border:1px solid #c7d2fe;border-radius:10px;background:#eef2ff;color:#3730a3;line-height:1.7;">
                <strong>Informasi penting</strong>
                <div>Tambahkan pengumuman atau informasi yang perlu diketahui pengunjung.</div>
            </div>
        `,
    },
    {
        id: 'wb-badge',
        label: 'Badge',
        icon: '●',
        category: 'Konten',
        content: `<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:12px;font-weight:700;">BARU</span>`,
    },

    /* Media 2 block */
    {
        id: 'wb-video',
        label: 'Video Embed',
        icon: '▶',
        category: 'Media',
        content: `
            <div style="position:relative;aspect-ratio:16/9;max-width:800px;background:#202238;border-radius:12px;overflow:hidden;">
                <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Video demo" style="width:100%;height:100%;border:0;" allowfullscreen></iframe>
            </div>
        `,
    },
    {
        id: 'wb-image-gallery',
        label: 'Image Gallery',
        icon: '▧',
        category: 'Media',
        content: `
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
                <img src="https://placehold.co/400x300?text=Image+1" alt="Galeri gambar 1" style="width:100%;height:180px;object-fit:cover;border-radius:8px;" />
                <img src="https://placehold.co/400x300?text=Image+2" alt="Galeri gambar 2" style="width:100%;height:180px;object-fit:cover;border-radius:8px;" />
                <img src="https://placehold.co/400x300?text=Image+3" alt="Galeri gambar 3" style="width:100%;height:180px;object-fit:cover;border-radius:8px;" />
            </div>
        `,
    },

    /* Formulir 1 block */
    {
        id: 'wb-contact-form',
        label: 'Contact Form',
        icon: '✉',
        category: 'Formulir',
        content: `
            <form style="display:grid;gap:14px;max-width:560px;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
                <label style="display:grid;gap:6px;">Nama<input type="text" placeholder="Nama Anda" style="padding:12px;border:1px solid #d7d9e2;border-radius:8px;" /></label>
                <label style="display:grid;gap:6px;">Email<input type="email" placeholder="nama@email.com" style="padding:12px;border:1px solid #d7d9e2;border-radius:8px;" /></label>
                <label style="display:grid;gap:6px;">Pesan<textarea rows="4" placeholder="Tulis pesan Anda" style="padding:12px;border:1px solid #d7d9e2;border-radius:8px;"></textarea></label>
                <button type="button" style="padding:12px 18px;border:0;border-radius:8px;background:#6658e8;color:#fff;font-weight:700;">Kirim Pesan</button>
            </form>
        `,
    },
    
    /* Basic 6 block */
    {
        id: 'wb-heading',
        label: 'Heading',
        icon: 'T',
        category: 'Basic',
        content:
            '<h1 style="font-size:36px;font-weight:700;margin:0 0 16px;">Judul halaman</h1>',
    },
    {
        id: 'wb-text',
        label: 'Text',
        icon: '¶',
        category: 'Basic',
        content:
            '<p style="font-size:16px;line-height:1.7;margin:0 0 16px;">Tambahkan teks deskriptif di sini.</p>',
    },
    {
        id: 'wb-image',
        label: 'Image',
        icon: '▧',
        category: 'Basic',
        content:
            '<img src="https://placehold.co/960x420?text=Your+Image" alt="Gambar" style="display:block;width:100%;height:auto;border-radius:8px;" />',
    },
    {
        id: 'wb-button',
        label: 'Button',
        icon: '▱',
        category: 'Basic',
        content:
            '<a href="#" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#6658e8;color:#ffffff;text-decoration:none;font-weight:600;">Pelajari lebih lanjut</a>',
    },
    {
        id: 'wb-container',
        label: 'Container',
        icon: '▦',
        category: 'Basic',
        content:
            '<section style="padding:32px;margin:0 0 16px;background:#f4f5f9;border-radius:12px;"><h2 style="margin:0 0 12px;">Bagian baru</h2><p style="margin:0;line-height:1.7;">Konten bagian ini.</p></section>',
    },
    {
        id: 'wb-columns',
        label: 'Columns',
        icon: '↔',
        category: 'Basic',
        content:
            '<div style="display:flex;gap:20px;align-items:flex-start;margin:0 0 20px;"><div style="flex:1;min-width:0;padding:20px;background:#f4f5f9;border-radius:8px;">Kolom satu</div><div style="flex:1;min-width:0;padding:20px;background:#f4f5f9;border-radius:8px;">Kolom dua</div></div>',
    },
    
    /* Marketing 6 block */
    {
        id: 'wb-feature-card',
        label: 'Feature Card',
        icon: '✧',
        category: 'Marketing',
        content: `
            <article style="max-width:320px;padding:24px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
                <div style="display:grid;place-items:center;width:48px;height:48px;margin-bottom:18px;border-radius:12px;background:#f0edff;color:#6658e8;font-size:24px;">✦</div>
                <h3 style="margin:0 0 10px;font-size:20px;">Fitur unggulan</h3>
                <p style="margin:0;color:#666b80;line-height:1.7;">Jelaskan manfaat fitur ini bagi pengguna.</p>
            </article>
        `,
    },
    {
        id: 'wb-testimonial',
        label: 'Testimonial',
        icon: '❝',
        category: 'Marketing',
        content: `
            <blockquote style="margin:0;padding:28px;border-radius:14px;background:#f7f6ff;">
                <p style="font-size:20px;line-height:1.7;color:#34324d;">“Layanan yang sangat membantu dan mudah digunakan. Pengalaman kami menjadi jauh lebih baik.”</p>
                <footer style="display:flex;align-items:center;gap:12px;">
                    <img src="https://placehold.co/56x56?text=AN" alt="Foto pelanggan" style="width:56px;height:56px;border-radius:50%;object-fit:cover;" />
                    <div><strong>Andi Nugraha</strong><div style="margin-top:4px;color:#777b8e;font-size:13px;">Pelanggan</div></div>
                </footer>
            </blockquote>
        `,
    },
    {
        id: 'wb-pricing-card',
        label: 'Pricing Card',
        icon: '$',
        category: 'Marketing',
        content: `
            <article style="max-width:340px;padding:28px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;">
                <p style="color:#6658e8;font-weight:700;">PAKET STARTER</p>
                <h2 style="font-size:32px;">Rp99.000 <small style="font-size:14px;font-weight:400;">/ bulan</small></h2>
                <p style="color:#666b80;line-height:1.7;">Cocok untuk memulai proyek Anda.</p>
                <ul style="padding-left:20px;line-height:2;"><li>Fitur dasar</li><li>Dukungan standar</li><li>Pembaruan rutin</li></ul>
                <a href="#" style="display:block;padding:12px;text-align:center;border-radius:8px;background:#6658e8;color:#fff;text-decoration:none;font-weight:700;">Pilih Paket</a>
            </article>
        `,
    },
    {
        id: 'wb-statistics',
        label: 'Statistics',
        icon: '↗',
        category: 'Marketing',
        content: `
            <section style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:28px 20px;text-align:center;background:#f8fafc;border-radius:12px;">
                <div><strong style="display:block;font-size:34px;color:#6658e8;">10K+</strong><span>Pengguna</span></div>
                <div><strong style="display:block;font-size:34px;color:#6658e8;">98%</strong><span>Kepuasan</span></div>
                <div><strong style="display:block;font-size:34px;color:#6658e8;">24/7</strong><span>Dukungan</span></div>
            </section>
        `,
    },

    {
        id: 'wb-cta',
        label: 'Call to Action',
        icon: '➜',
        category: 'Marketing',
        content: `
            <section style="padding:38px 28px;text-align:center;background:#6658e8;color:#fff;border-radius:16px;">
                <h2 style="font-size:30px;">Siap memulai proyek Anda?</h2>
                <p style="max-width:540px;margin:0 auto 22px;line-height:1.7;">Ambil langkah berikutnya dan wujudkan ide Anda hari ini.</p>
                <a href="#" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#fff;color:#5142d6;text-decoration:none;font-weight:700;">Hubungi Kami</a>
            </section>
        `,
    },
    {
        id: 'wb-product-card',
        label: 'Product Card',
        icon: '▣',
        category: 'Marketing',
        content: `
            <article style="max-width:300px;overflow:hidden;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
                <img src="https://placehold.co/600x420?text=Product" alt="Foto produk" style="display:block;width:100%;height:210px;object-fit:cover;" />
                <div style="padding:18px;">
                    <p style="color:#777b8e;font-size:12px;">KATEGORI PRODUK</p>
                    <h3>Nama Produk</h3>
                    <strong style="font-size:20px;color:#6658e8;">Rp199.000</strong>
                    <p style="color:#666b80;line-height:1.6;">Deskripsi singkat produk Anda.</p>
                    <a href="#" style="display:block;padding:11px;text-align:center;border-radius:8px;background:#6658e8;color:#fff;text-decoration:none;font-weight:700;">Lihat Produk</a>
                </div>
            </article>
        `,
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
