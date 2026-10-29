import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../layouts/app-layout';
import { ChartNoAxesCombined, Globe, MoveUpRight, Plus, Sparkle, Sparkles } from 'lucide-react';

type Website = {
    id: number;
    name: string;
    slug: string;
    status: 'draft' | 'published';
    created_at: string | null;
    updated_at: string | null;
};

type DashboardProps = {
    websites: Website[];
    stats: {
        total: number;
        published: number;
    };
};

function CreateWebsiteForm({ onCancel }: { onCancel: () => void }) {
    const form = useForm({ name: '' });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/websites', {
            onSuccess: () => form.reset(),
        });
    }

    return (
        <form onSubmit={submit} className="dashboard-create-form">
            <label htmlFor="website-name">Nama website</label>
            <input
                id="website-name"
                name="name"
                type="text"
                value={form.data.name}
                onChange={(event) => form.setData('name', event.target.value)}
                maxLength={120}
                required
                autoFocus
                placeholder="Contoh: Website Portofolio"
            />
            {form.errors.name && <p role="alert">{form.errors.name}</p>}
            <div>
                <button type="submit" disabled={form.processing} className="dashboard-primary-button">
                    {form.processing ? 'Membuat...' : 'Buat website'}
                </button>
                <button type="button" onClick={onCancel} className="dashboard-secondary-button">
                    Batal
                </button>
            </div>
        </form>
    );
}

function WebsiteCard({ website }: { website: Website }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        name: website.name,
        status: website.status,
    });

    function update(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.patch(`/websites/${website.id}`, {
            onSuccess: () => setEditing(false),
        });
    }

    function remove() {
        if (window.confirm(`Hapus website "${website.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
            router.delete(`/websites/${website.id}`);
        }
    }

    return (
        <article className="dashboard-stat dashboard-website-card">
            {editing ? (
                <form onSubmit={update}>
                    <label htmlFor={`website-name-${website.id}`} className="dashboard-stat__label">Nama website</label>
                    <input
                        id={`website-name-${website.id}`}
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        maxLength={120}
                        required
                    />
                    {form.errors.name && <p role="alert">{form.errors.name}</p>}
                    <div className="dashboard-website-actions">
                        <label htmlFor={`website-status-${website.id}`} className="dashboard-stat__label">Status</label>
                        <select
                            id={`website-status-${website.id}`}
                            value={form.data.status}
                            onChange={(event) => form.setData('status', event.target.value as Website['status'])}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <button type="submit" className="dashboard-primary-button" disabled={form.processing}>Simpan</button>
                        <button type="button" className="dashboard-secondary-button" onClick={() => setEditing(false)}>Batal</button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="dashboard-stat__top">
                        <span className="dashboard-stat__label">{website.name}</span>
                        <span className="dashboard-count">{website.status}</span>
                    </div>
                    <p className="dashboard-stat__note">/{website.slug}</p>
                    
                    <Link href={`/websites/${website.id}/editor`} className="dashboard-primary-button">
                        Buka editor
                    </Link>
                    <button type="button" onClick={() => setEditing(true)} className="dashboard-secondary-button">
                        Edit
                    </button>
                    <button type="button" onClick={remove} className="dashboard-secondary-button">
                        Hapus
                    </button>
                </>
            )}
        </article>
    );
}

export default function Dashboard({ websites, stats }: DashboardProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);

    const statCards = [
        { label: 'Total Websites', value: String(stats.total), note: 'Website yang Anda buat', icon: Globe },
        { label: 'Published', value: String(stats.published), note: 'Website yang dipublikasikan', icon: MoveUpRight },
        { label: 'Total Visitors', value: '—', note: 'Analitik belum tersedia', icon: ChartNoAxesCombined },
    ];

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <section className="dashboard-page">
                <div className="dashboard-welcome">
                    <div>
                        <span className="dashboard-eyebrow">YOUR WORKSPACE</span>
                        <h1>Dashboard</h1>
                        <p>Kelola website Anda dan mulai bangun sesuatu yang hebat.</p>
                    </div>
                    <button
                        type="button"
                        className="dashboard-primary-button"
                        onClick={() => setShowCreateForm((visible) => !visible)}
                    >
                        <Plus size={18} aria-hidden="true" />
                        Create website
                    </button>
                </div>

                {showCreateForm && (
                    <CreateWebsiteForm onCancel={() => setShowCreateForm(false)} />
                )}

                <div className="dashboard-stats">
                    {statCards.map(({ label, value, note, icon: Icon }) => (
                        <article className="dashboard-stat" key={label}>
                            <div className="dashboard-stat__top">
                                <span className="dashboard-stat__label">{label}</span>
                                <span className="dashboard-stat__icon" aria-hidden="true">
                                    <Icon size={18} aria-hidden="true" />
                                </span>
                            </div>
                            <strong className="dashboard-stat__value">{value}</strong>
                            <p className="dashboard-stat__note">{note}</p>
                        </article>
                    ))}
                </div>

                <section className="dashboard-projects">
                    <div className="dashboard-section-heading">
                        <div>
                            <h2>Your websites</h2>
                            <p>Kelola website yang sudah Anda buat.</p>
                        </div>
                        <span className="dashboard-count">
                            {websites.length} {websites.length === 1 ? 'website' : 'websites'}
                        </span>
                    </div>

                    {websites.length > 0 ? (
                        <div className="dashboard-stats">
                            {websites.map((website) => (
                                <WebsiteCard key={website.id} website={website} />
                            ))}
                        </div>
                    ) : (
                        <div className="dashboard-empty-state">
                            <div className="dashboard-empty-state__illustration">
                                <div className="empty-browser">
                                    <div className="empty-browser__dots"><span /><span /><span /></div>
                                    <div className="empty-browser__content">
                                        <div className="empty-browser__bar" />
                                        <div className="empty-browser__line" />
                                        <div className="empty-browser__blocks"><span /><span /></div>
                                    </div>
                                </div>
                                <span className="empty-sparkle empty-sparkle--one">
                                    <Sparkles size={18} aria-hidden="true" />
                                </span>
                                <span className="empty-sparkle empty-sparkle--two">
                                    <Sparkle size={18} aria-hidden="true" />
                                </span>
                            </div>
                            <h3>Belum ada website</h3>
                            <p>Website pertama Anda dimulai di sini. Buat website untuk membuka editor visual.</p>
                            <button
                                type="button"
                                className="dashboard-secondary-button"
                                onClick={() => setShowCreateForm(true)}
                            >
                                <Plus size={18} aria-hidden="true" />
                                Website pertama Anda
                            </button>
                        </div>
                    )}
                </section>
            </section>
        </AppLayout>
    );
}