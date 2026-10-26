import { Head } from '@inertiajs/react';

const resources = [
    {
        label: 'Documentation',
        description: 'Read the',
        url: 'https://laravel.com/docs',
    },
    {
        label: 'Laracasts',
        description: 'Watch video tutorials at',
        url: 'https://laracasts.com',
    },
];

function ExternalLinkIcon() {
    return (
        <svg
            width="10"
            height="11"
            viewBox="0 0 10 11"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M7.70833 6.95834V2.79167H3.54167M2.5 8L7.5 3.00001"
                stroke="currentColor"
                strokeLinecap="square"
            />
        </svg>
    );
}

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />

            <div className="welcome-page">
                <div className="welcome-page__inner">
                    <main className="welcome-card">
                        <section className="welcome-card__content">
                            <h1 className="welcome-card__title">
                                Let&apos;s get started
                            </h1>

                            <p className="welcome-card__description">
                                Laravel has an incredibly rich ecosystem.
                                <br />
                                We suggest starting with the following.
                            </p>

                            <ul className="welcome-links">
                                {resources.map((resource) => (
                                    <li
                                        className="welcome-links__item"
                                        key={resource.label}
                                    >
                                        <span
                                            className="welcome-links__marker"
                                            aria-hidden="true"
                                        />

                                        <span>
                                            {resource.description}

                                            <a
                                                className="welcome-link"
                                                href={resource.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {resource.label}
                                                <ExternalLinkIcon />
                                            </a>
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <ul className="welcome-actions">
                                <li>
                                    <a
                                        className="welcome-button"
                                        href="https://cloud.laravel.com"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Deploy now
                                    </a>
                                </li>
                            </ul>
                        </section>

                        <aside
                            className="welcome-card__art"
                            aria-label="Laravel"
                        >
                            <div className="welcome-art">
                                <span className="welcome-art__number">
                                    13
                                </span>
                                <span className="welcome-art__word">
                                    LARAVEL
                                </span>
                                <span className="welcome-art__caption">
                                    The PHP Framework
                                </span>
                            </div>

                            <div className="welcome-card__art-frame" />
                        </aside>
                    </main>
                </div>
            </div>
        </>
    );
}
