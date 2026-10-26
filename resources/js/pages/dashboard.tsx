import { Head } from '@inertiajs/react';
import AppLayout from '../layouts/app-layout';

const stats = [
    {
        label: 'Total Websites',
        value: '0',
        note: 'Website yang Anda buat',
        icon: '▤',
    },
    {
        label: 'Published',
        value: '0',
        note: 'Website yang dipublikasikan',
        icon: '↗',
    },
    {
        label: 'Total Visitors',
        value: '—',
        note: 'Analitik belum tersedia',
        icon: '◉',
    },
];

export default function Dashboard() {
    return (
        <AppLayout>
            <Head title="Dashboard" />

            <section className="dashboard-page">
                <div className="dashboard-welcome">
                    <div>
                        <span className="dashboard-eyebrow">
                            YOUR WORKSPACE
                        </span>
                        <h1>Dashboard</h1>
                        <p>
                            Kelola website Anda dan mulai bangun sesuatu yang
                            hebat.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="dashboard-primary-button"
                        disabled
                        title="Fitur ini akan diaktifkan setelah modul website tersedia"
                    >
                        <span aria-hidden="true">＋</span>
                        Create website
                    </button>
                </div>

                <div className="dashboard-stats">
                    {stats.map((stat) => (
                        <article className="dashboard-stat" key={stat.label}>
                            <div className="dashboard-stat__top">
                                <span className="dashboard-stat__label">
                                    {stat.label}
                                </span>
                                <span
                                    className="dashboard-stat__icon"
                                    aria-hidden="true"
                                >
                                    {stat.icon}
                                </span>
                            </div>

                            <strong className="dashboard-stat__value">
                                {stat.value}
                            </strong>

                            <p className="dashboard-stat__note">{stat.note}</p>
                        </article>
                    ))}
                </div>

                <section className="dashboard-projects">
                    <div className="dashboard-section-heading">
                        <div>
                            <h2>Your websites</h2>
                            <p>Website yang Anda buat akan muncul di sini.</p>
                        </div>
                        <span className="dashboard-count">0 websites</span>
                    </div>

                    <div className="dashboard-empty-state">
                        <div className="dashboard-empty-state__illustration">
                            <div className="empty-browser">
                                <div className="empty-browser__dots">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                                <div className="empty-browser__content">
                                    <div className="empty-browser__bar" />
                                    <div className="empty-browser__line" />
                                    <div className="empty-browser__blocks">
                                        <span />
                                        <span />
                                    </div>
                                </div>
                            </div>
                            <span className="empty-sparkle empty-sparkle--one">
                                ✦
                            </span>
                            <span className="empty-sparkle empty-sparkle--two">
                                ✧
                            </span>
                        </div>

                        <h3>Belum ada website</h3>
                        <p>
                            Website pertama Anda akan dimulai di sini. Nantinya,
                            Anda dapat memilih template atau membangun halaman
                            sendiri dengan editor visual.
                        </p>

                        <button
                            type="button"
                            className="dashboard-secondary-button"
                            disabled
                            title="Editor visual akan ditambahkan pada tahap berikutnya"
                        >
                            <span aria-hidden="true">＋</span>
                            Website pertama Anda
                        </button>

                        <span className="dashboard-empty-state__hint">
                            Website creation · Coming soon
                        </span>
                    </div>
                </section>
            </section>
        </AppLayout>
    );
}