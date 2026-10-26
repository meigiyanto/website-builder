import { Link, usePage } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';

type AppLayoutProps = {
    children: ReactNode;
};

const navigation = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: '▦',
        available: true,
    },
    {
        label: 'Websites',
        href: '/websites',
        icon: '▤',
        available: false,
    },
    {
        label: 'Templates',
        href: '/templates',
        icon: '▧',
        available: false,
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: '⚙',
        available: false,
    },
];

export default function AppLayout({ children }: AppLayoutProps) {
    const { url } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-shell">
            {sidebarOpen && (
                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label="Tutup menu navigasi"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`app-sidebar${sidebarOpen ? ' app-sidebar--open' : ''}`}
            >
                <Link
                    href="/dashboard"
                    className="app-brand"
                    onClick={() => setSidebarOpen(false)}
                >
                    <span className="app-brand__mark">W</span>
                    <span className="app-brand__text">
                        <strong>Webstudio</strong>
                        <small>Website Builder</small>
                    </span>
                </Link>

                <div className="app-sidebar__section-label">
                    WORKSPACE
                </div>

                <nav className="app-nav" aria-label="Navigasi utama">
                    {navigation.map((item) => {
                        const active =
                            item.href === '/dashboard'
                                ? url === '/dashboard' ||
                                  url.startsWith('/dashboard?')
                                : url.startsWith(item.href);

                        if (!item.available) {
                            return (
                                <div
                                    key={item.label}
                                    className="app-nav__item app-nav__item--disabled"
                                    aria-disabled="true"
                                    title={`${item.label} akan tersedia nanti`}
                                >
                                    <span className="app-nav__icon" aria-hidden="true">
                                        {item.icon}
                                    </span>
                                    <span className="app-nav__label">
                                        {item.label}
                                    </span>
                                    <span className="app-nav__soon">Soon</span>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`app-nav__item${active ? ' is-active' : ''}`}
                                aria-current={active ? 'page' : undefined}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="app-nav__icon" aria-hidden="true">
                                    {item.icon}
                                </span>
                                <span className="app-nav__label">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="app-sidebar__bottom">
                    <div className="workspace-card">
                        <span className="workspace-card__icon" aria-hidden="true">
                            ✦
                        </span>
                        <div>
                            <strong>Free workspace</strong>
                            <p>Ruang kerja awal Anda</p>
                        </div>
                    </div>

                    <div className="app-sidebar__version">
                        Website Builder <span>v1.0</span>
                    </div>
                </div>
            </aside>

            <div className="app-main">
                <header className="app-header">
                    <div className="app-header__left">
                        <button
                            type="button"
                            className="app-header__menu"
                            aria-label="Buka menu navigasi"
                            aria-expanded={sidebarOpen}
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span />
                            <span />
                            <span />
                        </button>

                        <div className="app-breadcrumb">
                            <span>Workspace</span>
                            <span aria-hidden="true">/</span>
                            <strong>Dashboard</strong>
                        </div>
                    </div>

                    <div className="app-header__right">
                        <span className="app-header__status">
                            <span className="app-header__status-dot" />
                            All systems normal
                        </span>

                        <div
                            className="app-header__avatar"
                            title="Profil pengguna"
                            aria-label="Profil pengguna"
                        >
                            U
                        </div>
                    </div>
                </header>

                <main className="app-content">{children}</main>
            </div>
        </div>
    );
}