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
                <div className="about-left-stack">
                    <div className="about-copy-column">
                        <p className="about-intro">
                            I&apos;m Ukrainian, a software engineer at AiSDR (a YC-backed startup), living in Warsaw.
                        </p>
                        <div className="about-socials">
                            <a
                                href="https://www.linkedin.com/in/dmytro-omelian/"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="LinkedIn profile"
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="currentColor" />
                                </svg>
                            </a>
                            <a
                                href="https://twitter.com/intent/user?screen_name=dmytroomelian"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="X profile"
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor" />
                                </svg>
                            </a>
                            <a
                                href="https://domelian.substack.com/"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Substack profile"
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M3 3H21V6H3V3ZM3 8H21V10H3V8ZM3 12H21V14H3V12ZM5 16H19V21H5V16Z" fill="currentColor" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="about-profile-card">
                    <img className='me-image' src="me.png" alt="Profile" />
                    <p className="about-profile-meta">Warsaw, Poland</p>
                    <p className="about-profile-meta about-profile-meta-muted">Software Engineer</p>
                </div>
            </section>

            <section className="about-main-grid">
                <div className="about-side-card">
                    <News />
                </div>
                <div className="newsletter-section">
                    <p className="newsletter-copy">
                        Essays, experiments, and updates from what I&apos;m building and learning.
                    </p>
                    <NewsletterSignup title="experimenting is cool, i think" />
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
