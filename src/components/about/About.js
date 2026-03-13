import React from 'react';
import './About.css';
import News from '../news/News';
import Achievements from '../achievements/Achievements';
import Others from '../others/Others';

function About() {
    return (
        <div className='about-me-container'>
            <div className="about-top-row">
                <div className="about-profile-column">
                    <img className='me-image' src="me.png" alt="Profile" />
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
                            aria-label="Substack newsletter"
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M3 3h18v3H3V3zm0 5h18v2H3V8zm0 4h18v2H3v-2zm0 3h18v1.744L12 21l-9-4.256V15z" fill="currentColor" />
                            </svg>
                        </a>
                    </div>
                </div>
                <News />
            </div>
            <Achievements />
            <Others />
            <div className="newsletter-section">
                <iframe
                    src="https://domelian.substack.com/embed"
                    width="480"
                    height="320"
                    style={{ border: '1px solid #EEE', background: 'white' }}
                    frameBorder="0"
                    scrolling="no"
                    title="Domelian Newsletter"
                ></iframe>
            </div>
        </div>
    );
}

export default About;
