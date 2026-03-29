import React from 'react';
import './Others.css';

const othersItems = [
    { date: "July-Nov 2023", description: "AI HOUSE Student Ambassador 2023 - building AI community at Kyiv Polytechnic Institute. Co-Founder at Royal Papers Club." },
    { date: "2021 - 2022", description: "Google Developer Student Club 2021 - shared experience through hands-on workshops, events and articles." },
];

const Others = () => {
    return (
        <div className="others-container">
            <h2 className="others-title">Some small activities</h2>
            {othersItems.map((item, index) => (
                <div className="others-item" key={index}>
                    <div className="others-date">{item.date}</div>
                    <div className="others-description">{item.description}</div>
                </div>
            ))}
        </div>
    );
};

export default Others;
