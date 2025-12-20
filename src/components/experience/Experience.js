import React from 'react';
import './Experience.css';

function Experience() {
    const experiences = [
        {
            title: "Software Engineer",
            company: "AiSDR",
            dates: "Nov 2023 - Present",
            descriptions: [
                "Building the leading AI sales platform at a YC-backed startup (S23 batch, raised $3M at $20M valuation)",
            ]
        },
        {
            title: "Project Manager",
            company: "Center for Entrepreneurship (CfE), UCU",
            dates: "Feb 2024 - Oct 2025",
            descriptions: [
                "Managed the IdeasLab startup accelerator program at Ukrainian Catholic University",
                "Coordinated 2 batches of student startups, providing mentorship and guidance",
                "Led lectures on problem analysis, customer development, and pitching",
                "Built ideascenter.ucu.edu.ua website as a freelance project",
                "Served as guest lecturer at Venture Camp Ukraine (3 lectures)"
            ]
        },
        {
            title: "Teaching Assistant @ Football Analytics",
            company: "Ukrainian Catholic University",
            dates: "Dec 2023 - Jan 2024",
            descriptions: ["Assisted in teaching football analytics course to university students"]
        },
        {
            title: "Co-Founder & COO",
            company: "Hearify",
            dates: "March 2023 - Nov 2023",
            descriptions: [
                "Won multiple startup competitions including AI HOUSE Camp 2023 and Student Startup Battle",
                "Raised $5k grant from Center for Entrepreneurship (CfE) for product development"
            ]
        },
        {
            title: "Machine Learning Engineer",
            company: "Harmix",
            city: "Kyiv, Ukraine (remote)",
            dates: "Apr 2023 - Aug 2023",
            descriptions: [
                "Worked on audio processing and machine learning models for music technology",
                "Developed ML solutions for music analysis and processing pipelines"
            ]
        },
        {
            title: "Junior Software Engineer",
            company: "Micro Focus",
            city: "Kyiv, Ukraine (remote)",
            dates: "Nov 2021 - Dec 2022",
            descriptions: [
                "Worked on the ALM Octane project, module \"Release Processes\"",
                "Designed, supported, and implemented new backend features in close cooperation with different teams",
                "Helped to speed up the time of resource loading by 4x",
                "Contributed to CI/CD open-source GitLab, Jenkins, Bamboo, and TeamCity plugins and integrated them into the project"
            ]
        },
    ];

    const internships = [
        {
            title: "Research Student",
            company: "Anhalt University",
            dates: "Nov 2023 - Jan 2024",
            descriptions: [
                "Conducted research on computer vision and AI applications",
                "Collaborated on academic research projects during university break"
            ]
        },
        {
            title: "Machine Learning Intern",
            company: "Center of Responsible AI @ NYU",
            dates: "Sep 2023 - Dec 2023",
            descriptions: [
                "Worked on responsible AI research and fairness in machine learning models",
                "Participated in academic research on AI ethics and bias mitigation"
            ]
        },
        {
            title: "Software Engineer Intern",
            company: "Huawei",
            city: "Dublin, Ireland (remote)",
            dates: "June 2023 - July 2023",
            descriptions: [
                "Researched and experimented with eBPF technology for kernel-level networking",
                "Resigned after determining it wasn't the right fit"
            ]
        },
        {
            title: "ideasLab Accelerator for Student Startups | Batch 3",
            company: "CfE, UCU",
            city: "Lviv, Ukraine",
            dates: "March 2022 - May 2022",
            descriptions: [
                "Participated in intensive 12-week startup accelerator program",
                "Developed entrepreneurial skills and business acumen",
                "Worked on real startup projects and business model validation"
            ]
        },
        {
            title: "Natural Language Processing School",
            company: "Gathers",
            dates: "Feb 2023 - March 2023",
            descriptions: [
                "Learned advanced techniques for processing and analyzing large volumes of text data using PyTorch",
                "Mastered various NLP models including RNN, LSTM, GRU, and Transformers",
                "Developed practical skills in building and training NLP models"
            ]
        },
        {
            title: "Practical Deep Learning",
            company: "DataRoot Labs",
            dates: "Feb 2023 - March 2023",
            descriptions: [
                "Gained deep understanding of theoretical concepts behind Deep Learning and practical implementation in PyTorch",
                "Completed labs on neural network basics and advanced autograd mechanics",
                "Worked on computer vision problems including object classification, segmentation, and detection",
                "Competed in Kaggle competitions and built Flask web applications with Docker deployment"
            ]
        },
        {
            title: "Data Science Fundamentals",
            company: "DataRoot Labs",
            dates: "May 2022 - September 2022",
            descriptions: [
                "Mastered Python and core data science libraries: NumPy, Pandas, SciPy, and Matplotlib",
                "Applied machine learning algorithms including Linear/Logistic Regression, Naive Bayes, and KNN",
                "Solved real-world ML problems and competed in Kaggle competitions",
                "Built and deployed ML models as REST APIs using Flask and Docker"
            ]
        },
        {
            title: "ideasLab Accelerator for Student Startups | Batch 2",
            company: "CfE, UCU",
            city: "Lviv, Ukraine",
            dates: "September 2022 - December 2022",
            descriptions: [
                "Completed 12-week intensive startup accelerator program for student entrepreneurs",
                "Developed comprehensive business skills including strategy, marketing, and operations",
                "Worked on real startup projects and received mentorship from industry experts"
            ]
        },
        {
            title: "Software Engineering School | Batch 2",
            company: "Genesis, Kyiv-Mohyla Academy, AWS",
            city: "Kyiv, Ukraine",
            dates: "August 2022 - November 2022",
            descriptions: [
                "Implemented comprehensive testing strategies: unit, integration, and e2e tests",
                "Applied software engineering best practices including design patterns, SOLID principles, and GRASP",
                "Optimized database performance and implemented caching solutions",
                "Learned scalable architecture, microservices, event-driven systems, and cloud technologies"
            ]
        },
        {
            title: "Java Camp",
            company: "ELEKs",
            dates: "September 2021 - November 2021",
            descriptions: [
                "Intensive Java programming bootcamp covering core Java concepts and frameworks",
                "Decided not to complete the program to focus on other opportunities"
            ]
        },
        {
            title: "Full-Stack DevOps Intern",
            company: "Openware",
            city: "Kyiv, Ukraine",
            dates: "August 2021 - November 2021",
            descriptions: [
                "Gained experience in full-stack development and DevOps practices",
                "Decided not to complete the program to focus on other opportunities"
            ]
        },
    ];

    return (
        <div className='experience-container'>
            <h1>Education</h1>
            <p>2020-2024 Kyiv Polytechnic Institute (Software Engineering)</p>
            <h1>Experience</h1>
            {experiences.map((exp, index) => (
                <div className='experience-box' key={index}>
                    <h3>{exp.title}</h3>
                    <h4>{exp.company} {exp.city ? `- ${exp.city}` : ''}</h4>
                    <p>{exp.dates}</p>
                    <ul className='descriptions-box'>
                        {exp.descriptions.map((point, index) => (
                            <li id={index}>{point}</li>
                        ))}
                    </ul>
                    {exp.tags && (
                        <ul className='tags-box'>
                            {exp.tags.map((tag, index) => (
                                <li id={index}>{tag}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
            <h2 className='margin-top'>Courses & Internships</h2>
            {internships.map((exp, index) => (
                <div className='experience-box' key={index}>
                    <h3>{exp.title}</h3>
                    <h4>{exp.company} {exp.city ? `- ${exp.city}` : ''}</h4>
                    <p>{exp.dates}</p>
                    <ul className='descriptions-box'>
                        {exp.descriptions.map((point, index) => (
                            <li id={index}>{point}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default Experience;
