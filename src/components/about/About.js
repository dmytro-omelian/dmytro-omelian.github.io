import React from 'react';
import './About.css';
import News from '../news/News';
import Achievements from '../achievements/Achievements';
import Others from '../others/Others';

function About() {
    return (
        <div className='about-me-container'>
            <img className='me-image' src="me.png" alt="Profile" />
            <News />
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
