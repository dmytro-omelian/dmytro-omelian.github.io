import React from 'react';
import './News.css';

const newsItems = [
    { date: "Oct 2025", description: "1 year of daily writing on LinkedIn with 400,000 impressions and 3,100 followers" },
    { date: "Nov 2025", description: "Built lnksbot.com as agent for my reading backlog (for now, personal usage mostly, but talking to people)" },
    { date: "Oct 2025", description: "After 1 year and 9 months, I am no longer working at Ideas Center UCU (former Center for Entrepreneurship)" },
    { date: "Aug 2025", description: "Started working on ai-calendar.com, got 100 users and $60 in revenue, but quitted due to numerous reasons (main ones are deprioritization and not full commitment)" },
    { date: "July 2025", description: "Started posting on X", link: { text: "@dmytroomelian", url: "https://x.com/dmytroomelian" } },
    { date: "Nov 2024", description: "Had 2 batches involved part time and now going to help and mentor students, lecturing about problem analysis, cust dev and pitching. Involvement like help building IdeasLab" },
    { date: "Oct 2024", description: "Started daily writing on LinkedIn", link: { text: "Dmytro Omelian", url: "https://www.linkedin.com/in/dmytro-omelian/" } },
    { date: "Feb 2024", description: "Started working in Center for Entrepreneurship, Ukrainian Catholic University as Project Manager" },
    { date: "Jan 2024", description: "Finished Football Analytics Course as teaching assistant (UCU)." },
    { date: "Jan 2024", description: "Finished my research @ Anhalt University" },
    { date: "Dec 2023", description: "Blog and website created 🥳" },
    { date: "Dec 2023", description: "Finished internship  - Center of Responsible AI @ NYU" },
    { date: "Nov 2023", description: "Started working in AiSDR (YC-backed startup, S23 - raised $3m at 20mln valuation) as early engineer - building the leading ai sales platform" },
    { date: "Nov 2023", description: "Not working on Hearify anymore :(" },
    { date: "Nov 2023", description: "Student Startup Battle (IT Arena) Winners (Slush Conference) (team: Hearify)" },
    { date: "Sep 2023", description: "AI HOUSE Camp 2023 Winners (team: Hearify)" },
    { date: "Aug 2023", description: "Not working at Harmix anymore :(" },
    { date: "July 2023", description: "Didn't like, quitted the internship at Huawei." },
    { date: "May 2023", description: "Got $5k grant from CfE (team: Hearify)." },
    { date: "March 2023", description: "Participated at MIT & KSE Bootcamp 2023 (team: Hearify)" },
    { date: "March 2023", description: "Finished NLP School (Gathers)." },
    { date: "Feb 2023", description: "Presented final project @ NLP for Good School (AI HOUSE)." },
    { date: "Dec 2022", description: "finished ideasLab program | Batch 2" },
    { date: "Dec 2022", description: "Quitted the job at MicroFocus :(" },
    { date: "Nov 2022", description: "Finished Software Engineering School 2 @ Genesis, Kyiv-Mohyla Academy, AWS." },
    { date: "Nov 2021", description: "Desided not to finish Java Camp @ ELEKs, quitted" },
    { date: "Nov 2021", description: "Desided not to finish Openware Hackademy, quitted" },
    { date: "Apr 2021", description: "Desided not to finish EPAM Java Course, quitted" },
];

const sortedNewsItems = newsItems.sort((a, b) => {
    const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    const parseDate = (dateStr) => {
        const [month, year] = dateStr.split(' ');
        return new Date(`${year}-${monthMap[month]}-01`);
    };

    return parseDate(b.date) - parseDate(a.date); // Sort newest first
});

const News = () => {
    return (
        <div className="news-container">
            <h2>News</h2>
            {sortedNewsItems.map((item, index) => (
                <div className="news-item" key={index}>
                    <div className="news-date">{item.date}</div>
                    <div className="news-description">
                        {item.description}
                        {item.link && (
                            <> (<a href={item.link.url} target="_blank" rel="noopener noreferrer">{item.link.text}</a>)</>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default News;
