import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import News from '../news/News';
import { posts } from '../posts/Posts';

const projects = [
    {
        name: 'savenest',
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
    {
        name: 'writing online every day',
        url: 'https://www.linkedin.com/in/dmytro-omelian/',
        type: 'writing',
        year: '2024',
        status: 'active',
        isDailyWriting: true,
    },
    {
        name: 'ai-calendar',
        url: 'https://ai-calendar.com',
        type: 'web app',
        year: '2025',
        status: 'finished',
        description: 'Reached 100 users and made the first $60.',
    },
    {
        name: 'Hearify',
        type: 'startup',
        year: '2023',
        status: 'finished',
        description: 'Won AI HOUSE Camp and Student Startup Battle · raised a $5k grant.',
    },
];

const WRITING_START_DATE = Date.UTC(2024, 9, 29);
const ONE_DAY = 24 * 60 * 60 * 1000;

const getWritingDayCount = () => {
    const today = new Date();
    const todayDate = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(1, Math.floor((todayDate - WRITING_START_DATE) / ONE_DAY) + 1);
};

const recentPosts = posts
    .filter((post) => post.externalUrl)
    .filter((post, index, items) => (
        items.findIndex((item) => item.externalUrl === post.externalUrl) === index
    ))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

function ProjectItem({ project, writingDayCount }) {
    const content = (
        <>
            <span className="about-list-line">
                <span className="about-list-title">{project.name}</span>
                <span className="about-list-dots" aria-hidden="true" />
                <span className="about-list-meta">{project.type}</span>
                <span className="about-list-year">{project.year}</span>
                <span className={`about-list-status about-list-status-${project.status}`}>{project.status}</span>
            </span>
            <span className="about-list-description">
                {project.isDailyWriting
                    ? `${writingDayCount} days and counting · started October 29, 2024.`
                    : project.description}
            </span>
        </>
    );

    if (!project.url) {
        return <div className="about-list-item about-list-item-static">{content}</div>;
    }

    return (
        <a className="about-list-item" href={project.url} target="_blank" rel="noreferrer">
            {content}
        </a>
    );
}

function About() {
    const [writingDayCount, setWritingDayCount] = useState(getWritingDayCount);

    useEffect(() => {
        const counterTimer = window.setInterval(() => {
            setWritingDayCount(getWritingDayCount());
        }, 60 * 1000);

        return () => window.clearInterval(counterTimer);
    }, []);

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
                            <ProjectItem
                                project={project}
                                writingDayCount={writingDayCount}
                                key={project.name}
                            />
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
