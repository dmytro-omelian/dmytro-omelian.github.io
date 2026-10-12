import React from 'react';
import './About.css';
import News from '../news/News';
import { posts } from '../posts/Posts';

const projects = [
    {
        name: 'SaveNest',
        url: 'https://savenest.app',
        meta: 'Founder · Oct 2026–now',
        description: 'A private, searchable home for pages you don\'t want to lose.',
    },
    {
        name: 'Learned Anyway',
        url: 'https://domelian.substack.com/',
        meta: 'Author · Dec 2025–now · 700+ subscribers · ~24k views',
        description: 'Writing something I\'ll want to reread in 20 years.',
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
                <h1>Dima Omelian</h1>
                <p className="about-kicker">Founder</p>
                <p className="about-intro">
                    I&apos;m a Ukrainian founder in San Francisco, building <a href="https://savenest.app" target="_blank" rel="noreferrer">SaveNest</a>.
                </p>
                <div className="about-links" aria-label="Social links">
                    <a href="https://www.linkedin.com/in/dmytro-omelian/" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
                    <a href="https://twitter.com/intent/user?screen_name=dmytroomelian" target="_blank" rel="noreferrer">X <span aria-hidden="true">↗</span></a>
                    <a href="https://domelian.substack.com/" target="_blank" rel="noreferrer">Substack <span aria-hidden="true">↗</span></a>
                </div>
            </section>

            <main className="about-main-grid">
                <section className="about-section">
                    <h2>Projects</h2>
                    <div className="about-list">
                        {projects.map((project) => (
                            <a className="about-list-item" href={project.url} target="_blank" rel="noreferrer" key={project.name}>
                                <span className="about-list-title">{project.name} <span aria-hidden="true">↗</span></span>
                                <span className="about-list-meta">{project.meta}</span>
                                <span className="about-list-description">{project.description}</span>
                            </a>
                        ))}
                    </div>
                </section>

                <section className="about-section">
                    <h2>Writing</h2>
                    <div className="about-list about-writing-list">
                        {recentPosts.map((post) => (
                            <a className="about-list-item" href={post.externalUrl} target="_blank" rel="noreferrer" key={post.externalUrl}>
                                <span className="about-list-title">{post.title} <span aria-hidden="true">↗</span></span>
                                <span className="about-list-meta">{post.date}</span>
                            </a>
                        ))}
                    </div>
                    <a className="about-more-link" href="https://domelian.substack.com/" target="_blank" rel="noreferrer">All writing ↗</a>
                </section>

                <section className="about-section about-news-section">
                    <News />
                </section>
            </main>
        </div>
    );
}

export default About;
