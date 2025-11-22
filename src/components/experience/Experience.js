import React from 'react';
import './Experience.css';

function Experience() {
    const experiences = [
        {
            title: "Software Engineer",
            company: "TBD",
            dates: "Nov 2023 - Present",
            descriptions: ["Building something people want", "TBD."],
            tags: ["React", "NestJS"]
        },
        // {
        //     title: "Program and Event Coordinator",
        //     company: "Center for Entrepreneurship (CfE), UCU",
        //     dates: "Feb 2024 - Present",
        //     descriptions: ["TBD."],
        // },
        {
            title: "Teaching Assistant @ Football Analytics",
            company: "Ukrainian Catholic University",
            dates: "Dec 2023 - Jan 2024",
            descriptions: ["TBD."],
            tags: ["Data Analytics", "Python", "Mentorship", "Management"]
        },
        {
            title: "Co-Founder & COO",
            company: "Hearify",
            dates: "March 2023 - Nov 2023",
            descriptions: ["TBD."],
            tags: ["Startup", "Management", "Communications", "Research", "Development"]
        },
        {
            title: "Machine Learning Engineer",
            company: "Harmix",
            city: "Kyiv, Ukraine (remote)",
            dates: "Apr 2023 - Aug 2023",
            descriptions: ["TBD."],
            tags: ["Python", "Machine Learning", "Audio Processing"]
        },
        {
            title: "Junior Software Engineer",
            company: "Micro Focus",
            city: "Kyiv, Ukraine (remote)",
            dates: "Nov 2021 - Dec 2022",
            descriptions: [
                "Worked on the ALM Octane project, module \"Release Processes\".",
                "Designed, supported, and implemented new backend features in close cooperation with different teams. Helped to speed up the time of resource loading by 4x.",
                "Contributed to CI / CD open-source GitLab, Jenkins, Bamboo, and TeamCity plugins and integrated them into the project."
            ],
            tags: ["Java", "Spring Framework"]
        },
    ];

    const internships = [
        {
            title: "Research Student",
            company: "Anhalt University",
            dates: "Nov 2023 - Jan 2024",
            descriptions: ["TBD."],
            tags: ["Computer Vision"]
        },
        {
            title: "Machine Learning Intern",
            company: "Center of Responsible AI @ NYU",
            dates: "Sep 2023 - Dec 2023",
            descriptions: ["TBD."],
            tags: ["Academic Research", "Machine Learning", "Fairness"]
        },
        {
            title: "Software Engineer Intern",
            company: "Huawei",
            city: "Dublin, Ireland (remote)",
            dates: "June 2023 - July 2023",
            descriptions: [
                "Researching and experimenting with eBPF technology, which involves running sandboxed programs within the privileged context of the operating system kernel to enhance kernel capabilities without source code modifications or module loading.",
                "Didn't like, resigned."
            ],
            tags: ["Research", "C"]
        },
        {
            title: "ideasLab Accelerator for Student Startups | Batch 3",
            company: "CfE, UCU",
            city: "Lviv, Ukraine",
            dates: "March 2022 - May 2022",
            descriptions: [
                "TBD (winners)",
            ],
            tags: ["Startup", "Management", "Communications", "Research", "Development"]
        },
        {
            title: "Natural Language Processing School",
            company: "Gathers",
            dates: "Feb 2023 - March 2023",
            descriptions: [
                "Learned advanced techniques for processing and analyzing large volumes of text data using PyTorch.",
                "Gained knowledge of a variety of PyTorch-based NLP models, including Recurrent Neural Networks (RNN), Long Short-Term Memory (LSTM), Gated Recurrent Units (GRU), and Transformers.",
                "Developed practical skills in building and training NLP models using PyTorch, and implemented projects using these models to classify and analyze text data."
            ],
            tags: ["Natural Language Processing"]
        },
        {
            title: "Practical Deep Learning",
            company: "DataRoot Labs",
            dates: "Feb 2023 - March 2023",
            descriptions: [
                "Developed knowledge of theoretical concepts behind Deep Learning, including mathematical understanding of Neural Networks and implementation in practice.",
                "Explored PyTorch basics and advanced autograd mechanics, completing two labs to gain hands-on experience in creating, training, and evaluating neural networks.",
                "Tackled essential problems in Computer Vision such as object classification, segmentation, and detection, using state-of-the-art models like YOLOv3, ResNet, and UNet, through completion of three labs, a Kaggle competition, and a test.",
                "Didn't complete the course."
            ],
            tags: ["Deep Learning", "Computer Vision", "PyTorch"]
        },
        {
            title: "Data Science Fundamentals",
            company: "DataRoot Labs",
            dates: "May 2022 - September 2022",
            descriptions: [
                "Got hands-on experience with Python and main data science libraries: NumPy, Pandas, SciPy, and Matplotlib.",
                "We worked with different modifications of Linear Regression, Logistic Regression, Naive Bayes Classifier, and KNN.",
                "Were tasked to solve some different real-life machine learning problems and applied our knowledge working on Kaggle competitions.",
                "Created the guided project using Flask framework and packed it into a container with Docker.",
                "As a final project, I solved a real-life ML problem to predict whether a patient is likely to get a stroke based on the input parameters, exposed it with REST API, and packed it into a container with Docker (accuracy 0.91)."
            ],
            tags: ["Machine Learning", "Python", "Flask"]
        },
        {
            title: "ideasLab Accelerator for Student Startups | Batch 2",
            company: "CfE, UCU",
            city: "Lviv, Ukraine",
            dates: "September 2022 - December 2022",
            descriptions: [
                "Participated in the ideasLab Accelerator for Student Startups program, a 12-week program designed to help student entrepreneurs develop their startups and gain valuable business skills",
            ],
            tags: ["Startup", "Management", "Communications", "Research"]
        },
        {
            title: "Software Engineering School | Batch 2",
            company: "Genesis, Kyiv-Mohyla Academy, AWS",
            city: "Kyiv, Ukraine",
            dates: "August 2022 - November 2022",
            descriptions: [
                "Implemented unit, integration, and e2e tests and did regular code reviews of students' assignments. Worked with design patterns, SOLID & GRASP principles, DB optimizations, scaling and caching. Layered architecture and microservices, event bus, message broker, Saga, 2PC, and Cloud.",
            ],
            tags: ["TypeScript", "Design Patterns", "Microservices"]
        },
        {
            title: "Java Camp",
            company: "ELEKs",
            dates: "September 2021 - November 2021",
            descriptions: [
                "TBD",
            ],
            tags: ["Java", "Spring Framework"]
        },
        {
            title: "Full-Stack DevOps Intern",
            company: "Openware",
            city: "Kyiv, Ukraine",
            dates: "August 2021 - November 2021",
            descriptions: [
                "TBD",
            ],
        }
    ];

    return (
        <div className='experience-container'>
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
                    {exp.tags &&
                        <div className='tags-box'>
                            {exp.tags.map((tag, index) => (
                                <p className="tag" key={index}>{tag}</p>
                            ))}
                        </div>
                    }
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
                    {exp.tags &&
                        <div className='tags-box'>
                            {exp.tags.map((tag, index) => (
                                <p className="tag" key={index}>{tag}</p>
                            ))}
                        </div>
                    }
                </div>
            ))}
        </div>
    );
}

export default Experience;
