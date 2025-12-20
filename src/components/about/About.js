import React from 'react';
import './About.css';
import News from '../news/News';
import Achievements from '../achievements/Achievements';
import Others from '../others/Others';

function About() {
    return (
        <div className='about-me-container'>
            <img className='me-image' src="me.png" alt="Profile" />
            <h3>Education</h3>
            <p>2020-2024 Kyiv Polytechnic Institute (Software Engineering)</p>
            <News />
            <Achievements />
            <Others />
        </div>
    );
}

export default About;
