import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { EditorBlock } from '../lib/website-builder/element-registry';
import type { Component } from 'grapesjs';

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
    onStyleChange: ( property: InspectorProperty, value: string) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    navigatorItems: NavigatorItem[];
    selectedComponentId: string | null;
    onSelectNavigatorItem: (component: Component) => void;
    onMoveNavigatorItem: (component: Component, direction: -1 | 1) => void;
    navigatorOpen: boolean;
    onToggleNavigator: () => void;
    onAddLayoutPreset: (columns: 1 | 2 | 3 | 4) => void;
};

export type InspectorStyles = {
    tagName: string;
    content: string;
    href: string;
    canEditContent: boolean;
    isLink: boolean;
    color: string;
    backgroundColor: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    textAlign: string;
    display: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    gap: string;
    width: string;
    maxWidth: string;
    margin: string;
    padding: string;
    borderRadius: string;
};

export type NavigatorItem = {
    id: string;
    label: string;
    tagName: string;
    depth: number;
    component: Component;
    canMoveUp: boolean;
    canMoveDown: boolean;
};

export type InspectorProperty =
    | 'content'
    | 'href'
    | 'color'
    | 'backgroundColor'
    | 'fontFamily'
    | 'fontSize'
    | 'fontWeight'
    | 'lineHeight'
    | 'textAlign'
    | 'display'
    | 'flexDirection'
    | 'justifyContent'
    | 'alignItems'
    | 'gap'
    | 'width'
    | 'maxWidth'
    | 'margin'
    | 'padding'
    | 'borderRadius';

function normalizeColorForPreview(color: string, fallback: string): string {
    const value = color.trim();

    // HEX: #RGB, #RRGGBB
    const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

    if (hexMatch) {
        if (hexMatch[1].length === 3) {
            return `#${hexMatch[1]
                .split('')
                .map((char) => char + char)
                .join('')}`;
        }

        return value;
    }

    // RGB / RGBA
    const rgbMatch = value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i);

    if (rgbMatch) {
        const channels = rgbMatch.slice(1, 4).map(Number);

        if (channels.every((channel) => channel >= 0 && channel <= 255)) {
            return (
                '#' +
                channels
                    .map((channel) => channel.toString(16).padStart(2, '0'))
                    .join('')
            );
        }
    }

    // Nama warna atau format lain yang tidak didukung:
    // gunakan fallback agar pratinjau tetap valid.
    return fallback;
}

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
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    navigatorItems, 
    selectedComponentId, 
    onSelectNavigatorItem, 
    onMoveNavigatorItem,
    onAddLayoutPreset,
    navigatorOpen,
    onToggleNavigator,
}: EditorLayoutProps) {

    const query = searchValue.trim().toLocaleLowerCase();

    const filteredBlocks = blocks.filter((block) => {
        const matchesCategory = categoryFilter === 'Semua' || block.category === categoryFilter;
    
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
                        onClick={onUndo}
                        disabled={!canUndo}
                        aria-label="Undo"
                        title="Undo (Ctrl+Z)"
                    >
                        ↶ Undo
                    </button>
                    
                    <button
                        type="button"
                        className="editor-button editor-button--subtle"
                        onClick={onRedo}
                        disabled={!canRedo}
                        aria-label="Redo"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        ↷ Redo
                    </button>
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
                                
                                <section className="editor-navigator">
                                    <div className="editor-navigator__header">
                                        <p className="editor-panel__description">NAVIGATOR</p>
                                    
                                        <button
                                            type="button"
                                            className="editor-navigator__toggle"
                                            onClick={onToggleNavigator}
                                            aria-expanded={navigatorOpen}
                                            aria-controls="editor-navigator-content"
                                            title={navigatorOpen ? 'Tutup Navigator' : 'Buka Navigator'}
                                        >
                                            <span aria-hidden="true">
                                                {navigatorOpen ? '−' : '+'}
                                            </span>
                                            <span>{navigatorOpen ? 'Hide' : 'Show'}</span>
                                        </button>
                                    </div>
                                    
                                    {navigatorOpen && (
                                        <div id="editor-navigator-content">
                                            {navigatorItems?.length === 0 ? (
                                                <p className="editor-navigator__empty">Halaman belum memiliki elemen.</p>
                                            ) : (
                                                <div className="editor-navigator__list">
                                                    {navigatorItems?.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className={`editor-navigator__row${
                                                                item.id === selectedComponentId
                                                                    ? ' is-selected'
                                                                    : ''
                                                            }`}
                                                            style={{
                                                                paddingLeft: `${8 + item.depth * 12}px`,
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="editor-navigator__select"
                                                                onClick={() =>
                                                                    onSelectNavigatorItem(item.component)
                                                                }
                                                                title={`Pilih <${item.tagName}>`}
                                                            >
                                                                <span aria-hidden="true">
                                                                    {item.depth > 0 ? '↳' : '◇'}
                                                                </span>
                                                                <span className="editor-navigator__label">
                                                                    {item.label}
                                                                </span>
                                                            </button>
                                        
                                                            <div className="editor-navigator__actions">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onMoveNavigatorItem(item.component, -1)
                                                                    }
                                                                    disabled={!item.canMoveUp}
                                                                    aria-label={`Naikkan ${item.label}`}
                                                                    title="Pindah ke atas"
                                                                >
                                                                    ↑
                                                                </button>
                                        
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onMoveNavigatorItem(item.component, 1)
                                                                    }
                                                                    disabled={!item.canMoveDown}
                                                                    aria-label={`Turunkan ${item.label}`}
                                                                    title="Pindah ke bawah"
                                                                >
                                                                    ↓
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>

                                <p className="editor-panel__description">CATALOG ELEMENT</p>
                                
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
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </label>

                                <section className="editor-layout-presets">
                                    <p className="editor-panel__description">QUICK LAYOUT</p>
                                
                                    <div className="editor-layout-presets__grid">
                                        {([1, 2, 3, 4] as const).map((columns) => (
                                            <button
                                                key={columns}
                                                type="button"
                                                className="editor-layout-preset"
                                                draggable
                                                onClick={() => onAddLayoutPreset(columns)}
                                                onDragStart={(event) => {
                                                    event.dataTransfer.effectAllowed = 'copy';
                                            
                                                    onBlockDragStart(
                                                        `wb-layout-${columns}`,
                                                        event.nativeEvent,
                                                    );
                                                }}
                                                onDrag={(event) => {
                                                    onBlockDrag(event.nativeEvent);
                                                }}
                                                onDragEnd={onBlockDragStop}
                                                title={`Tambahkan layout ${columns} kolom`}
                                            >
                                                <span aria-hidden="true">
                                                    {'▥'.repeat(columns)}
                                                </span>
                                                {columns} kolom
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                
                                {groupedBlocks.map(({ category, items }) => (
                                    <section className="editor-block-category" key={category}>
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
                            {settingsOpen && <strong>Settings</strong>}

                            <button
                                type="button"
                                className="editor-icon-button"
                                onClick={onToggleSettings}
                                aria-label={
                                    settingsOpen ? 'Ciutkan panel pengaturan' : 'Buka panel pengaturan'
                                }
                                title={
                                    settingsOpen ? 'Ciutkan panel pengaturan' : 'Buka panel pengaturan'
                                }
                            >
                                {settingsOpen ? '»' : '«'}
                            </button>
                        </div>

                        {settingsOpen && (
                            <div className="editor-panel__content">
                                <p className="editor-panel__description">
                                    ELEMENT STYLE
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
                                            <strong>{`<${styles.tagName}>`}</strong>
                                        </div>
                                    
                                        {styles.canEditContent && (
                                            <section className="editor-inspector-section">
                                                <p className="editor-inspector-section__title">Konten</p>
                                    
                                                <label className="editor-field">
                                                    <span>Text</span>
                                                    <textarea
                                                        value={styles.content}
                                                        rows={3}
                                                        onChange={(event) =>
                                                            onStyleChange('content', event.target.value)
                                                        }
                                                    />
                                                </label>
                                    
                                                {styles.isLink && (
                                                    <label className="editor-field">
                                                        <span>URL destination</span>
                                                        <input
                                                            type="text"
                                                            value={styles.href}
                                                            placeholder="https://contoh.com"
                                                            onChange={(event) =>
                                                                onStyleChange('href', event.target.value)
                                                            }
                                                        />
                                                    </label>
                                                )}
                                            </section>
                                        )}
                                    
                                        <section className="editor-inspector-section">
                                            <p className="editor-inspector-section__title">Layout</p>
                                    
                                            <label className="editor-field">
                                                <span>Display</span>
                                                <select
                                                    value={styles.display}
                                                    onChange={(event) =>
                                                        onStyleChange('display', event.target.value)
                                                    }
                                                >
                                                    <option value="">Default</option>
                                                    <option value="block">Block</option>
                                                    <option value="inline">Inline</option>
                                                    <option value="inline-block">Inline block</option>
                                                    <option value="flex">Flex</option>
                                                    <option value="grid">Grid</option>
                                                    <option value="none">None</option>
                                                </select>
                                            </label>
                                    
                                            {styles.display === 'flex' && (
                                                <>
                                                    <label className="editor-field">
                                                        <span>Flex Direction</span>
                                                        <select
                                                            value={styles.flexDirection}
                                                            onChange={(event) =>
                                                                onStyleChange('flexDirection', event.target.value)
                                                            }
                                                        >
                                                            <option value="">Default</option>
                                                            <option value="row">Horizontal</option>
                                                            <option value="column">Vertikal</option>
                                                            <option value="row-reverse">Horizontal terbalik</option>
                                                            <option value="column-reverse">Vertikal terbalik</option>
                                                        </select>
                                                    </label>
                                    
                                                    <label className="editor-field">
                                                        <span>Justify Content</span>
                                                        <select
                                                            value={styles.justifyContent}
                                                            onChange={(event) =>
                                                                onStyleChange('justifyContent', event.target.value)
                                                            }
                                                        >
                                                            <option value="">Default</option>
                                                            <option value="flex-start">Start</option>
                                                            <option value="center">Center</option>
                                                            <option value="flex-end">End</option>
                                                            <option value="space-between">Space between</option>
                                                            <option value="space-around">Space around</option>
                                                        </select>
                                                    </label>
                                    
                                                    <label className="editor-field">
                                                        <span>Align Items</span>
                                                        <select
                                                            value={styles.alignItems}
                                                            onChange={(event) =>
                                                                onStyleChange('alignItems', event.target.value)
                                                            }
                                                        >
                                                            <option value="">Default</option>
                                                            <option value="stretch">Stretch</option>
                                                            <option value="flex-start">Start</option>
                                                            <option value="center">Center</option>
                                                            <option value="flex-end">End</option>
                                                        </select>
                                                    </label>
                                                </>
                                            )}
                                    
                                            {[
                                                ['Width', 'width'],
                                                ['Max width', 'maxWidth'],
                                                ['Gap', 'gap'],
                                            ].map(([label, property]) => (
                                                <label className="editor-field" key={property}>
                                                    <span>{label}</span>
                                                    <input
                                                        type="text"
                                                        value={styles[property as keyof InspectorStyles] as string}
                                                        placeholder="Contoh: 100% atau 16px"
                                                        onChange={(event) => onStyleChange(property as InspectorProperty,event.target.value)}
                                                    />
                                                </label>
                                            ))}
                                        </section>
                                    
                                        <section className="editor-inspector-section">
                                            <p className="editor-inspector-section__title">Typograhy</p>
                                    
                                            <label className="editor-field">
                                                <span>Font family</span>
                                                <select
                                                    value={styles.fontFamily}
                                                    onChange={(event) =>
                                                        onStyleChange('fontFamily', event.target.value)
                                                    }
                                                >
                                                    <option value="">Default</option>
                                                    <option value="Arial, sans-serif">Arial</option>
                                                    <option value="Helvetica, sans-serif">Helvetica</option>
                                                    <option value="Georgia, serif">Georgia</option>
                                                    <option value="'Times New Roman', serif">Times New Roman</option>
                                                    <option value="Verdana, sans-serif">Verdana</option>
                                                    <option value="monospace">Monospace</option>
                                                </select>
                                            </label>
                                    
                                            <label className="editor-field">
                                                <span>Font size</span>
                                                <input
                                                    type="text"
                                                    value={styles.fontSize}
                                                    placeholder="16px"
                                                    onChange={(event) =>
                                                        onStyleChange('fontSize', event.target.value)
                                                    }
                                                />
                                            </label>
                                    
                                            <label className="editor-field">
                                                <span>Thickness</span>
                                                <select
                                                    value={styles.fontWeight}
                                                    onChange={(event) =>
                                                        onStyleChange('fontWeight', event.target.value)
                                                    }
                                                >
                                                    <option value="">Default</option>
                                                    <option value="300">Light</option>
                                                    <option value="400">Normal</option>
                                                    <option value="500">Medium</option>
                                                    <option value="600">Semi-bold</option>
                                                    <option value="700">Bold</option>
                                                    <option value="800">Extra-bold</option>
                                                </select>
                                            </label>
                                    
                                            <label className="editor-field">
                                                <span>Line height</span>
                                                <input
                                                    type="text"
                                                    value={styles.lineHeight}
                                                    placeholder="1.5"
                                                    onChange={(event) =>
                                                        onStyleChange('lineHeight', event.target.value)
                                                    }
                                                />
                                            </label>
                                    
                                            <label className="editor-field">
                                                <span>Text alignment</span>
                                                <select
                                                    value={styles.textAlign}
                                                    onChange={(event) =>
                                                        onStyleChange('textAlign', event.target.value)
                                                    }
                                                >
                                                    <option value="">Default</option>
                                                    <option value="left">Kiri</option>
                                                    <option value="center">Tengah</option>
                                                    <option value="right">Kanan</option>
                                                    <option value="justify">Rata kiri-kanan</option>
                                                </select>
                                            </label>
                                        </section>
                                    
                                        <section className="editor-inspector-section">
                                            <p className="editor-inspector-section__title">Color</p>
                                        
                                            <label className="editor-field">
                                                <span>Text color</span>
                                                
                                                <div className="editor-color-control">
                                                   <input
                                                        type="color"
                                                        aria-label="Pilih warna teks"
                                                        value={normalizeColorForPreview(styles.color, '#24263a')}
                                                        onChange={(event) => onStyleChange('color', event.target.value)}
                                                    />
                                        
                                                    <input
                                                        type="text"
                                                        value={styles.color}
                                                        placeholder="#24263a"
                                                        onChange={(event) => onStyleChange('color', event.target.value)}
                                                    />
                                                </div>
                                            </label>
                                        
                                            <label className="editor-field">
                                                <span>Background color</span>
                                                
                                                <div className="editor-color-control">
                                                    <input
                                                        type="color"
                                                        aria-label="Pilih warna latar"
                                                        value={normalizeColorForPreview(styles.backgroundColor, '#ffffff')}
                                                        onChange={(event) => onStyleChange('backgroundColor', event.target.value )}
                                                    />
                                        
                                                    <input
                                                        type="text"
                                                        value={styles.backgroundColor}
                                                        placeholder="#ffffff atau transparent"
                                                        onChange={(event) => onStyleChange('backgroundColor', event.target.value )}
                                                    />
                                                </div>
                                            </label>
                                        </section>
                                    
                                        <section className="editor-inspector-section">
                                            <p className="editor-inspector-section__title">Spacing & Box Model</p>
                                    
                                            {[
                                                ['Margin', 'margin'],
                                                ['Padding', 'padding'],
                                                ['Border radius', 'borderRadius'],
                                            ].map(([label, property]) => (
                                                <label className="editor-field" key={property}>
                                                    <span>{label}</span>
                                                    <input
                                                        type="text"
                                                        value={styles[property as keyof InspectorStyles] as string}
                                                        placeholder="Contoh: 16px"
                                                        onChange={(event) => onStyleChange( property as InspectorProperty, event.target.value, )}
                                                    />
                                                </label>
                                            ))}
                                        </section>
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