import React from 'react';
import './Achievements.css';

const newsItems = [
    { date: "TBD 2024", description: "TBD" },
    { date: "Sep 2023", description: "Winners - AI HOUSE Camp 2023 (team: Hearify)." },
    { date: "May 2023", description: "3-rd place @ SoftServe & LNU Study Smart Hackathon 2023" },
    { date: "2021", description: "1/2 Final of The 2021 ICPC Southeastern Europe Regional Contest." },
    { date: "2021", description: "Facebook Hacker Cup 2021 top 33% in Round 2." },
    { date: "2021", description: "KPI OPEN 2021 Final Contest - 15th out of 80+ teams (international)." },
    { date: "2019", description: "ITalent 2019 Final Contest - 2nd place out of 50+ contestants." },
];

const Achievements = () => {
    return (
        <div className="news-container">
            <h2>Some small achievements</h2>
            {newsItems.map((item, index) => (
                <div className="news-item" key={index}>
                    <div className="news-date">{item.date}</div>
                    <div className="news-description">{item.description}</div>
                </div>
            ))}
        </div>
    );
};

export default Achievements;
