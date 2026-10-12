import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import News from '../news/News';
import { posts } from '../posts/Posts';

const projects = [
    {
        name: 'SaveNest',
        url: 'https://savenest.app',
        type: 'macOS app',
        year: '2026',
        status: 'active',
        description: 'A private, searchable home for pages you don\'t want to lose.',
    },
    {
        name: 'Learned Anyway',
        url: 'https://domelian.substack.com/',
        type: 'newsletter',
        year: '2025',
        status: 'active',
        description: 'Author · 700+ subscribers · ~24k views.',
    },
];

const recentPosts = posts
    .filter((post) => post.externalUrl)
    .filter((post, index, items) => (
        items.findIndex((item) => item.externalUrl === post.externalUrl) === index
    ))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

function About() {
    return (
        <div className='about-me-container'>
            <section className="about-hero">
                <h1><span aria-hidden="true">👋</span> hi, i&apos;m <strong>Dima</strong></h1>
                <p className="about-kicker">Founder</p>
                <p className="about-intro">
                    Ukrainian founder based in Warsaw. In San Francisco for October, building <a href="https://savenest.app" target="_blank" rel="noreferrer">SaveNest</a>.
                </p>
                <div className="about-links" aria-label="Social links">
                    <a href="https://twitter.com/intent/user?screen_name=dmytroomelian" target="_blank" rel="noreferrer">X</a>
                    <a href="https://www.linkedin.com/in/dmytro-omelian/" target="_blank" rel="noreferrer">LinkedIn</a>
                    <a href="https://domelian.substack.com/" target="_blank" rel="noreferrer">Substack</a>
                </div>
                <nav className="about-nav" aria-label="Homepage sections">
                    <a href="#projects">projects</a>
                    <Link to="/blog">writing</Link>
                    <Link to="/books">books</Link>
                    <a href="#now">now</a>
                </nav>
            </section>

            <main className="about-main-grid">
                <section className="about-section" id="projects">
                    <div className="about-list">
                        {projects.map((project) => (
                            <a className="about-list-item" href={project.url} target="_blank" rel="noreferrer" key={project.name}>
                                <span className="about-list-line">
                                    <span className="about-list-title">{project.name}</span>
                                    <span className="about-list-dots" aria-hidden="true" />
                                    <span className="about-list-meta">{project.type}</span>
                                    <span className="about-list-year">{project.year}</span>
                                    <span className="about-list-status">{project.status}</span>
                                </span>
                                <span className="about-list-description">{project.description}</span>
                            </a>
                        ))}
                    </div>
                </section>

                <section className="about-section">
                    <h2>writing</h2>
                    <div className="about-list about-writing-list">
                        {recentPosts.map((post) => (
                            <a className="about-list-item" href={post.externalUrl} target="_blank" rel="noreferrer" key={post.externalUrl}>
                                <span className="about-list-line">
                                    <span className="about-list-title">{post.title}</span>
                                    <span className="about-list-dots" aria-hidden="true" />
                                    <span className="about-list-year">{post.date.replace(/^[A-Za-z]+ \d{1,2}, /, '')}</span>
                                </span>
                                <span className="about-list-description">{post.preview}</span>
                            </a>
                        ))}
                    </div>
                    <a className="about-more-link" href="https://domelian.substack.com/" target="_blank" rel="noreferrer">all writing</a>
                </section>

                <section className="about-section about-news-section" id="now">
                    <News />
                </section>
            </main>
        </div>
    );
}

export default About;
