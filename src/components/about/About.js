import React from 'react';
import './About.css';
import News from '../news/News';
import Achievements from '../achievements/Achievements';
import Others from '../others/Others';
import NewsletterSignup from '../forms/NewsletterSignup';

function About() {
    return (
        <div className='about-me-container'>
            <section className="about-hero">
                <p className="about-kicker">Software engineer · Warsaw</p>
                <div className="about-copy-column">
                    <h1>Dmytro Omelian</h1>
                    <p className="about-intro">
                        I&apos;m a Ukrainian software engineer at <a href="https://aisdr.com" target="_blank" rel="noreferrer">AiSDR</a>. I build products, write about startups, and keep notes on what I learn.
                    </p>
                </div>
                <div className="about-links" aria-label="Social links">
                    <a href="https://www.linkedin.com/in/dmytro-omelian/" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
                    <a href="https://twitter.com/intent/user?screen_name=dmytroomelian" target="_blank" rel="noreferrer">X <span aria-hidden="true">↗</span></a>
                    <a href="https://domelian.substack.com/" target="_blank" rel="noreferrer">Substack <span aria-hidden="true">↗</span></a>
                </div>
            </section>

            <section className="about-main-grid">
                <div className="about-side-card">
                    <News />
                </div>
                <div className="about-newsletter">
                    <div className="section-label">Newsletter</div>
                    <div className="about-newsletter-content">
                        <p className="newsletter-copy">Essays, experiments, and updates from what I&apos;m building and learning.</p>
                        <NewsletterSignup title="experimenting is cool, i think" />
                    </div>
                </div>
                <div className="about-side-card">
                    <Achievements />
                </div>
                <div className="about-side-card">
                    <Others />
                </div>
            </section>
        </div>
    );
}

export default About;
