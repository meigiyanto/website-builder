import { Link } from '@inertiajs/react';
import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { EditorBlock } from '../lib/website-builder/element-registry';
import type { Component } from 'grapesjs';
import { Palette, ArrowLeft, Eye, Undo, Undo2, Redo2, AlignLeft, ArrowRight, ArrowUpDown, BadgeCheck, ChartNoAxesCombined, CircleHelp, Columns3, Columns, CreditCard, Image as ImageIcon, Images, LayoutGrid, List, ListOrdered, Mail, Menu, MessageSquareQuote, Minus, MousePointerClick, PanelBottom, PanelsTopLeft, Play, Quote, ShoppingBag, Sparkles, Square, TriangleAlert, Type,
TextAlignStart, TextAlignEnd, TextAlignJustify, TextAlignCenter } from 'lucide-react';
import { HexColorPicker } from 'react-colorful' ;
import AppSelect from '../components/app-select';

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
    collapsedNavigatorIds: ReadonlySet<string>;
    onToggleNavigatorItem: (id: string) => void;
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
    parentId: string;
    hasChildren: boolean;
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

    // HEX: #RGB atau #RRGGBB
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

    // RGB / RGBA, termasuk transparansi.
    const rgbMatch = value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+%?))?\s*\)$/i);

    if (rgbMatch) {
        const channels = rgbMatch.slice(1, 4).map(Number);
        const alpha = rgbMatch[4];

        const validChannels = channels.every((channel) => channel >= 0 && channel <= 255);

        if (validChannels) {
            if (alpha !== undefined) {
                const alphaValue = alpha.endsWith('%') ? Number(alpha.slice(0, -1)) / 100 : Number(alpha);

                if (!Number.isFinite(alphaValue) ||alphaValue < 0 ||alphaValue > 1) {
                    return fallback;
                }

                if (alphaValue === 0) {
                    return fallback;
                }
            }

            return ('#' +channels.map((channel) => channel.toString(16).padStart(2, '0')).join(''));
        }
    }

    // Format yang tidak didukung menggunakan warna cadangan.
    return fallback;
}

type FloatingPanel = 'blocks' | 'settings';

type FloatingPanelPosition = {
    x: number;
    y: number;
};

type PanelDragState = {
    panel: FloatingPanel;
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
};

type ColorPickerFieldProps = {
    label: string;
    property: 'color' | 'backgroundColor';
    value: string;
    fallback: string;
    placeholder: string;
    onChange: (property: InspectorProperty, value: string) => void;
};

function ColorPickerField({
    label,
    property,
    value,
    fallback,
    placeholder,
    onChange,
}: ColorPickerFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pickerColor = normalizeColorForPreview(value, fallback);

    return (
        <div className="editor-field editor-color-field">
            <span>{label}</span>

            <div className="editor-color-control">
                <button
                    type="button"
                    className="editor-color-swatch"
                    style={{ backgroundColor: pickerColor }}
                    aria-label={`Buka pemilih warna: ${label}`}
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen((open) => !open)}
                >
                    <Palette size={18} aria-hidden="true" />
                </button>

                <input
                    type="text"
                    aria-label={`Nilai warna: ${label}`}
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) =>
                        onChange(property, event.target.value)
                    }
                />
            </div>

            {isOpen && (
                <div className="editor-color-picker-popover">
                    <HexColorPicker
                        color={pickerColor}
                        onChange={(nextColor) =>
                            onChange(property, nextColor)
                        }
                    />

                    <div className="editor-color-picker-footer">
                        <span>{pickerColor.toUpperCase()}</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                        >
                            Finish
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
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
    collapsedNavigatorIds,
    onToggleNavigatorItem,
}: EditorLayoutProps) {

    const [activeMobilePanel, setActiveMobilePanel] = useState<FloatingPanel | null>(null);

    const [panelPositions, setPanelPositions] = useState<Record<FloatingPanel, FloatingPanelPosition>>({
        blocks: { x: 8, y: 72 },
        settings: { x: 8, y: 72 },
    });
    
    const panelDragRef = useRef<PanelDragState | null>(null);
    
    const startPanelDrag = (panel: FloatingPanel, event: ReactPointerEvent<HTMLDivElement>) => {
        if (!window.matchMedia('(max-width: 650px)').matches) return;
    
        if ((event.target as HTMLElement).closest('button, input, select, textarea, a')) {
            return;
        }
    
        panelDragRef.current = {
            panel,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: panelPositions[panel].x,
            originY: panelPositions[panel].y,
        };
    
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    };
    
    const movePanelDrag = (panel: FloatingPanel, event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = panelDragRef.current;
    
        if (!drag || drag.panel !== panel || drag.pointerId !== event.pointerId) {
            return;
        }
    
        const panelElement = event.currentTarget.closest('.editor-panel');
        const rect = panelElement?.getBoundingClientRect();
        const maxX = Math.max(0,window.innerWidth - (rect?.width ?? 300));
        const maxY = Math.max(8,window.innerHeight - (rect?.height ?? 300));
        const x = Math.min(Math.max(0, drag.originX + event.clientX - drag.startX), maxX);
        const y = Math.min(Math.max(8, drag.originY + event.clientY - drag.startY), maxY);
    
        setPanelPositions((current) => ({
            ...current, [panel]: { x, y }
        }));
    };
    
    const stopPanelDrag = (panel: FloatingPanel, event: ReactPointerEvent<HTMLDivElement>) => {
        if (panelDragRef.current?.panel === panel &&panelDragRef.current.pointerId === event.pointerId) {
            panelDragRef.current = null;
        }
    };
    
    const openMobilePanel = (panel: FloatingPanel) => {
        setActiveMobilePanel((current) =>
            current === panel ? null : panel,
        );
    
        if (panel === 'blocks' && !blocksOpen) {
            onToggleBlocks();
        }
    
        if (panel === 'settings' && !settingsOpen) {
            onToggleSettings();
        }
    };
    
    const query = searchValue.trim().toLocaleLowerCase();

    const filteredBlocks = blocks.filter((block) => {
        const matchesCategory = categoryFilter === 'All' || block.category === categoryFilter;
    
        const searchable = [
            block.label,
            block.category,
            block.id,
        ]
        .join(' ')
        .toLocaleLowerCase();
    
        return (matchesCategory && (!query || searchable.includes(query)));
    });
    
    const groupedBlocks = categories
        .filter((category) => category !== 'All')
        .map((category) => ({
            category,
            items: filteredBlocks.filter(
                (block) => block.category === category,
            ),
        }))
        .filter((group) => group.items.length > 0);
        
    const navigatorItemById = new Map(
        navigatorItems.map((item) => [item.id, item]),
    );
    
    const visibleNavigatorItems = navigatorItems.filter((item) => {
        let parentId: string | undefined = item.parentId;
    
        while (parentId) {
            if (collapsedNavigatorIds.has(parentId)) {
                return false;
            }
    
            const parent = navigatorItemById.get(parentId);
            parentId = parent?.parentId;
        }
    
        return true;
    });

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
                        <ArrowLeft />
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
                        <Undo2 size={14} />Undo
                    </button>
                    
                    <button
                        type="button"
                        className="editor-button editor-button--subtle"
                        onClick={onRedo}
                        disabled={!canRedo}
                        aria-label="Redo"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 size={14} /> Redo
                    </button>
                    <button
                        type="button"
                        className="editor-button editor-button--subtle"
                        onClick={onTogglePreview}
                    >
                        {preview ? 'Back to editor' : 'Preview'}
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

            {!preview && (
                <nav
                    className="editor-mobile-dock"
                    aria-label="Panel editor"
                >
                    <button
                        type="button"
                        className={activeMobilePanel === 'blocks' ? 'is-active' : ''}
                        onClick={() => openMobilePanel('blocks')}
                        aria-expanded={activeMobilePanel === 'blocks'}
                    >
                        Element
                    </button>
            
                    <button
                        type="button"
                        className={activeMobilePanel === 'settings' ? 'is-active' : ''}
                        onClick={() => openMobilePanel('settings')}
                        aria-expanded={activeMobilePanel === 'settings'}
                    >
                        Inspector
                    </button>
                </nav>
            )}

            <div className="editor-workspace">
                {!preview && (
                    <aside className={`editor-panel editor-panel--blocks ${blocksOpen ? '' : 'is-collapsed'} ${activeMobilePanel === 'blocks' ? ' is-mobile-active' : '' }`} style={{left: panelPositions.blocks.x, top: panelPositions.blocks.y}}>                
                        <div
                            className="editor-panel__heading editor-panel__heading--draggable"
                            onPointerDown={(event) => startPanelDrag('blocks', event)}
                            onPointerMove={(event) => movePanelDrag('blocks', event)}
                            onPointerUp={(event) => stopPanelDrag('blocks', event)}
                            onPointerCancel={(event) => stopPanelDrag('blocks', event)}
                        >
                            {blocksOpen && <strong>Element</strong>}

                            <button
                                type="button"
                                className="editor-icon-button"
                                onClick={onToggleBlocks}
                                aria-label={blocksOpen ? 'Ciutkan panel elemen' : 'Buka panel elemen'}
                                title={blocksOpen ? 'Ciutkan panel elemen' : 'Buka panel elemen'}
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
                                                    {visibleNavigatorItems?.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className={`editor-navigator__row${item.id === selectedComponentId ? ' is-selected' : ''}`}
                                                            style={{
                                                                paddingLeft: `${8 + item.depth * 12}px`,
                                                            }}
                                                        >
                                                            {item.hasChildren ? (
                                                                <button
                                                                    type="button"
                                                                    className="editor-navigator__collapse"
                                                                    onClick={() => onToggleNavigatorItem(item.id)}
                                                                    aria-label={collapsedNavigatorIds.has(item.id) ? `Buka anak ${item.label}` : `Tutup anak ${item.label}`}
                                                                    aria-expanded={!collapsedNavigatorIds.has(item.id)}
                                                                    title={collapsedNavigatorIds.has(item.id) ? 'Tampilkan anak' : 'Sembunyikan anak'}
                                                                >
                                                                    {collapsedNavigatorIds.has(item.id) ? '▸' : '▾'}
                                                                </button>
                                                            ) : (
                                                                <span className="editor-navigator__collapse-placeholder" />
                                                            )}
                                                            
                                                            <button
                                                                type="button"
                                                                className="editor-navigator__select"
                                                                onClick={() =>onSelectNavigatorItem(item.component)}
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
                                                                    onClick={() =>onMoveNavigatorItem(item.component, -1)}
                                                                    disabled={!item.canMoveUp}
                                                                    aria-label={`Naikkan ${item.label}`}
                                                                    title="Pindah ke atas"
                                                                >
                                                                    ↑
                                                                </button>
                                        
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>onMoveNavigatorItem(item.component, 1)}
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
                                    <span className="sr-only">Filter category</span>
                                    <AppSelect
                                        value={categoryFilter}
                                        options={categories.map((category) => ({
                                            value: category,
                                            label: category,
                                        }))}
                                        onChange={onCategoryFilterChange}
                                        ariaLabel="Filter kategori elemen"
                                        className="editor-catalog-category__select"
                                    />
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
                                                    onDragStart={(event) => {event.dataTransfer.effectAllowed = 'copy';onBlockDragStart(block.id, event.nativeEvent);}}
                                                    onDrag={(event) => {onBlockDrag(event.nativeEvent);}}
                                                    onDragEnd={onBlockDragStop}
                                                >
                                                    {(() => {
                                                        const Icon = block.lucideIcon;
                                                    
                                                        return (
                                                            <>
                                                                <Icon className="editor-block__icon" size={18} strokeWidth={1.8} aria-hidden="true" />
                                                                <span className="editor-block__label">{block.label}</span>
                                                            </>
                                                        );
                                                    })()}
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
                    <aside className={`editor-panel editor-panel--settings ${settingsOpen ? '' : ' is-collapsed'} ${activeMobilePanel === 'settings' ? ' is-mobile-active' : ''}`} style={{left: panelPositions.settings.x, top: panelPositions.settings.y}}>
                        <div
                            className="editor-panel__heading editor-panel__heading--draggable"
                            onPointerDown={(event) => startPanelDrag('settings', event)}
                            onPointerMove={(event) => movePanelDrag('settings', event)}
                            onPointerUp={(event) => stopPanelDrag('settings', event)}
                            onPointerCancel={(event) => stopPanelDrag('settings', event)}
                        >
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
                                            No element choosen yet
                                        </strong>
                                        <p>
                                            Select element on canvas for setting the layout
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
                                                <p className="editor-inspector-section__title">Content</p>
                                    
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
                                                            placeholder="https://example.com"
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
                                                <AppSelect
                                                    value={styles.display}
                                                    options={[
                                                        { value: '', label: 'Default' },
                                                        { value: 'block', label: 'Block' },
                                                        { value: 'inline', label: 'Inline' },
                                                        { value: 'inline-block', label: 'Inline block' },
                                                        { value: 'flex', label: 'Flex' },
                                                        { value: 'grid', label: 'Grid' },
                                                        { value: 'none', label: 'None' },
                                                    ]}
                                                    onChange={(event) => onStyleChange('display', event.target.value)}
                                                    ariaLabel="Display"
                                                />
                                            </label>
                                    
                                            {styles.display === 'flex' && (
                                                <>
                                                    <label className="editor-field">
                                                        <span>Flex Direction</span>
                                                        <AppSelect
                                                            value={styles.flexDirection}
                                                            options={[
                                                                { value: '', label: 'Default' },
                                                                { value: 'row', label: 'Horizontal' },
                                                                { value: 'column', label: 'Vertical' },
                                                                { value: 'row-reverse', label: 'Horizontal Reverse' },
                                                                { value: 'column-reverse', label: 'Vertical Reverse' },
                                                            ]}
                                                            onChange={(event) => onStyleChange('flexDirection', event.target.value)}
                                                            ariaLabel="Flex Direction"
                                                        />
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
                                                ['Max Width', 'maxWidth'],
                                                ['Gap', 'gap'],
                                            ].map(([label, property]) => (
                                                <label className="editor-field" key={property}>
                                                    <span>{label}</span>
                                                    <input
                                                        type="text"
                                                        value={styles[property as keyof InspectorStyles] as string}
                                                        placeholder="e.g.: 100% or 16px"
                                                        onChange={(event) => onStyleChange(property as InspectorProperty,event.target.value)}
                                                    />
                                                </label>
                                            ))}
                                        </section>
                                    
                                        <section className="editor-inspector-section">
                                            <p className="editor-inspector-section__title">Typography</p>
                                    
                                            <label className="editor-field">
                                                <span>Font family</span>
                                                <AppSelect
                                                    value={styles.fontFamily}
                                                    options={[
                                                        { value: '', label: 'Default' },
                                                        { value: 'Arial, sans-serif', label: 'Arial' },
                                                        { value: 'Helvetica, sans-serif', label: 'Helvetica' },
                                                        { value: 'Georgia, serif', label: 'Georgia' },
                                                        { value: '"Times New Roman", serif', label: 'Times New Roman' },
                                                        { value: 'Verdana, serif', label: 'Verdana' },
                                                        { value: 'monospace', label: 'Monospace' },
                                                    ]}
                                                    onChange={(event) => onStyleChange('fontFamily', event.target.value)}
                                                    ariaLabel="Font Family"
                                                />
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
                                                <AppSelect
                                                    value={styles.fontWeight}
                                                    options={[
                                                        { value: '', label: 'Default' },
                                                        { value: '300', label: 'Light' },
                                                        { value: '400', label: 'Normal' },
                                                        { value: '500', label: 'Medium' },
                                                        { value: '600', label: 'Semi-bold' },
                                                        { value: '700', label: 'Bold' },
                                                        { value: '800', label: 'Extra-bold' },
                                                    ]}
                                                    onChange={(event) => onStyleChange('fontWeight', event.target.value)}
                                                    ariaLabel="Font Weight"
                                                />
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
                                                    <option value="left">Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="right">Right</option>
                                                    <option value="justify">Justify</option>
                                                </select>
                                                
                                            </label>
                                        </section>
                                    
                                        <section className="editor-inspector-section">
                                            <p className="editor-inspector-section__title">Color</p>
                                        
                                            <label className="editor-field">
                                                <ColorPickerField
                                                    label="Text color"
                                                    property="color"
                                                    value={styles.color}
                                                    fallback="#24263a"
                                                    placeholder="#24263a"
                                                    onChange={onStyleChange}
                                                />
                                            </label>
                                        
                                            <label className="editor-field">
                                                <ColorPickerField
                                                    label="Background color"
                                                    property="backgroundColor"
                                                    value={styles.backgroundColor}
                                                    fallback="#ffffff"
                                                    placeholder="#ffffff atau transparent"
                                                    onChange={onStyleChange}
                                                />
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
                                                        placeholder="e.g.: 16px"
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