import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { EditorBlock } from '../lib/website-builder/element-registry';

type EditorLayoutProps = {
    children: ReactNode;
    websiteName: string;
    blocks: EditorBlock[];
    categories: readonly string[];
    searchValue: string;
    categoryFilter: string;
    onSearchChange: (value: string) => void;
    onCategoryFilterChange: (value: string) => void;
    blocksOpen: boolean;
    settingsOpen: boolean;
    preview: boolean;
    selectedElement: string | null;
    styles: InspectorStyles;
    onToggleBlocks: () => void;
    onToggleSettings: () => void;
    onTogglePreview: () => void;
    onAddBlock: (block: EditorBlock) => void;
    onBlockDragStart: (blockId: string, event: Event) => void;
    onBlockDrag: (event: Event) => void;
    onBlockDragStop: () => void;
    onStyleChange: (
        property: keyof InspectorStyles,
        value: string,
    ) => void;
};

export type InspectorStyles = {
    color: string;
    backgroundColor: string;
    padding: string;
    fontSize: string;
};

export default function EditorLayout({
    children,
    websiteName,
    blocks,
    blocksOpen,
    settingsOpen,
    preview,
    selectedElement,
    styles,
    onToggleBlocks,
    onToggleSettings,
    onTogglePreview,
    onAddBlock,
    onStyleChange,
    categories,
    searchValue,
    categoryFilter,
    onSearchChange,
    onBlockDragStart,
    onBlockDrag,
    onBlockDragStop,
    onCategoryFilterChange,
}: EditorLayoutProps) {

    const query = searchValue.trim().toLocaleLowerCase();

    const filteredBlocks = blocks.filter((block) => {
        const matchesCategory =
            categoryFilter === 'Semua' ||
            block.category === categoryFilter;
    
        const searchable = [
            block.label,
            block.category,
            block.id,
        ]
            .join(' ')
            .toLocaleLowerCase();
    
        return (
            matchesCategory &&
            (!query || searchable.includes(query))
        );
    });
    
    const groupedBlocks = categories
        .filter((category) => category !== 'Semua')
        .map((category) => ({
            category,
            items: filteredBlocks.filter(
                (block) => block.category === category,
            ),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <div className={`editor-shell${preview ? ' is-preview' : ''}`}>
            <header className="editor-toolbar">
                <div className="editor-toolbar__brand">
                    <Link
                        href="/dashboard"
                        className="editor-back"
                        aria-label="Kembali ke Dashboard"
                        title="Kembali ke Dashboard"
                    >
                        ←
                    </Link>

                    <div className="editor-identity">
                        <strong>{websiteName}</strong>
                        <span>
                            <span className="editor-status-dot" />
                            Draft · Belum tersimpan
                        </span>
                    </div>
                </div>

                <div className="editor-toolbar__actions">
                    <button
                        type="button"
                        className="editor-button editor-button--subtle"
                        onClick={onTogglePreview}
                    >
                        {preview ? 'Kembali ke editor' : 'Preview'}
                    </button>

                    <button
                        type="button"
                        className="editor-button editor-button--primary"
                        disabled
                        title="Publikasi akan tersedia setelah fitur penyimpanan dibuat"
                    >
                        Publish
                    </button>
                </div>
            </header>

            <div className="editor-workspace">
                {!preview && (
                    <aside
                        className={`editor-panel editor-panel--blocks${
                            blocksOpen ? '' : ' is-collapsed'
                        }`}
                    >
                        <div className="editor-panel__heading">
                            {blocksOpen && <strong>Elemen</strong>}

                            <button
                                type="button"
                                className="editor-icon-button"
                                onClick={onToggleBlocks}
                                aria-label={
                                    blocksOpen ? 'Ciutkan panel elemen' : 'Buka panel elemen'
                                }
                                title={
                                    blocksOpen ? 'Ciutkan panel elemen' : 'Buka panel elemen'
                                }
                            >
                                {blocksOpen ? '«' : '»'}
                            </button>
                        </div>

                        {blocksOpen && (
                            <div className="editor-panel__content">
                                <p className="editor-panel__description">KATALOG ELEMENT</p>
                                
                                <label className="editor-catalog-search">
                                    <span className="sr-only">Cari elemen</span>
                                    <input
                                        type="search"
                                        value={searchValue}
                                        onChange={(event) =>
                                            onSearchChange(event.target.value)
                                        }
                                        placeholder="Cari elemen..."
                                        aria-label="Cari elemen"
                                    />
                                </label>
                                
                                <label className="editor-catalog-category">
                                    <span className="sr-only">Filter kategori</span>
                                    <select
                                        value={categoryFilter}
                                        onChange={(event) =>
                                            onCategoryFilterChange(event.target.value)
                                        }
                                        aria-label="Filter kategori elemen"
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                
                                {groupedBlocks.map(({ category, items }) => (
                                    <section
                                        className="editor-block-category"
                                        key={category}
                                    >
                                        <p className="editor-block-category__title">
                                            {category}
                                        </p>
                                
                                        <div className="editor-block-grid">
                                            {items.map((block) => (
                                                <button
                                                    key={block.id}
                                                    type="button"
                                                    draggable
                                                    className="editor-block"
                                                    title={`${block.label}: klik atau seret ke kanvas`}
                                                    onClick={() => onAddBlock(block)}
                                                    onDragStart={(event) => {
                                                        event.dataTransfer.effectAllowed = 'copy';
                                                        onBlockDragStart(block.id, event.nativeEvent);
                                                    }}
                                                    onDrag={(event) => {
                                                        onBlockDrag(event.nativeEvent);
                                                    }}
                                                    onDragEnd={onBlockDragStop}
                                                >
                                                    <span aria-hidden="true">{block.icon}</span>
                                                    {block.label}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                                
                                {filteredBlocks.length === 0 && (
                                    <p className="editor-catalog-empty">
                                        Tidak ada elemen yang cocok.
                                    </p>
                                )}
                                
                                
                                <p className="editor-panel__hint">
                                    Klik elemen untuk menambahkannya ke
                                    kanvas. Klik elemen pada kanvas untuk
                                    mengedit gayanya.
                                </p>
                            </div>
                        )}
                    </aside>
                )}

                <main className="editor-canvas-area">
                    {!preview && (
                        <div className="editor-canvas-toolbar">
                            <span>Halaman utama</span>
                            <span className="editor-canvas-size">
                                Editor visual
                            </span>
                        </div>
                    )}

                    <div className="editor-canvas-scroll">
                        <div className="editor-canvas">{children}</div>
                    </div>
                </main>

                {!preview && (
                    <aside
                        className={`editor-panel editor-panel--settings${
                            settingsOpen ? '' : ' is-collapsed'
                        }`}
                    >
                        <div className="editor-panel__heading">
                            {settingsOpen && <strong>Pengaturan</strong>}

                            <button
                                type="button"
                                className="editor-icon-button"
                                onClick={onToggleSettings}
                                aria-label={
                                    settingsOpen
                                        ? 'Ciutkan panel pengaturan'
                                        : 'Buka panel pengaturan'
                                }
                                title={
                                    settingsOpen
                                        ? 'Ciutkan panel pengaturan'
                                        : 'Buka panel pengaturan'
                                }
                            >
                                {settingsOpen ? '»' : '«'}
                            </button>
                        </div>

                        {settingsOpen && (
                            <div className="editor-panel__content">
                                <p className="editor-panel__description">
                                    GAYA ELEMEN
                                </p>

                                {!selectedElement ? (
                                    <div className="editor-inspector-empty">
                                        <span aria-hidden="true">◇</span>
                                        <strong>
                                            Belum ada elemen dipilih
                                        </strong>
                                        <p>
                                            Pilih elemen di kanvas untuk
                                            mengatur tampilannya.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="editor-inspector-form">
                                        <div className="editor-selected-name">
                                            <span className="editor-selection-dot" />
                                            <strong>{selectedElement}</strong>
                                        </div>

                                        <label className="editor-field">
                                            <span>Warna teks</span>
                                            <input
                                                type="color"
                                                value={styles.color || '#222222'}
                                                onChange={(event) =>
                                                    onStyleChange(
                                                        'color',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>

                                        <label className="editor-field">
                                            <span>Warna latar</span>
                                            <input
                                                type="color"
                                                value={
                                                    styles.backgroundColor ||
                                                    '#ffffff'
                                                }
                                                onChange={(event) =>
                                                    onStyleChange(
                                                        'backgroundColor',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>

                                        <label className="editor-field">
                                            <span>Padding</span>
                                            <input
                                                type="text"
                                                value={styles.padding}
                                                placeholder="Contoh: 16px"
                                                onChange={(event) =>
                                                    onStyleChange(
                                                        'padding',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>

                                        <label className="editor-field">
                                            <span>Ukuran teks</span>
                                            <input
                                                type="text"
                                                value={styles.fontSize}
                                                placeholder="Contoh: 24px"
                                                onChange={(event) =>
                                                    onStyleChange(
                                                        'fontSize',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
}