import './Achievements.css';

const achievementItems = [
    { date: "Sep 2023", description: "Winners - AI HOUSE Camp 2023 (team: Hearify)." },
    { date: "May 2023", description: "3-rd place @ SoftServe & LNU Study Smart Hackathon 2023" },
    { date: "2021", description: "1/2 Final of The 2021 ICPC Southeastern Europe Regional Contest." },
    { date: "2021", description: "Facebook Hacker Cup 2021 top 33% in Round 2." },
    { date: "2021", description: "KPI OPEN 2021 Final Contest - 15th out of 80+ teams (international)." },
    { date: "2019", description: "ITalent 2019 Final Contest - 2nd place out of 50+ contestants." },
];

const Achievements = () => {
    return (
        <div className="achievements-container">
            <h2 className="achievements-title">Some small achievements</h2>
            {achievementItems.map((item, index) => (
                <div className="achievements-item" key={index}>
                    <div className="achievements-date">{item.date}</div>
                    <div className="achievements-description">{item.description}</div>
                </div>
            ))}
        </div>
    );
};

export default Achievements;
