import React, { useState } from 'react';
import './Posts.css';

const posts = [
    {
        id: 1,
        title: "Here is going to be first post",
        content: ["TBD."],
        tags: ['tag1']
    },
];

const experiments = [
    {
        id: 3,
        title: "experiment 3 - tasks to work on (1)",
        content: [
            "There are lots of theories about how to handle your daily backlog and work on tasks, but for now, I've chosen a method for deciding what to work on during the day. Among the various approaches (which I'll describe later), this one has proven to be the most effective. It looks like this:",
            "(1) Focus on only 3 main problems.\n(2) Prioritize them as your top tasks that need immediate attention.\n(3) Select tasks that are challenging.",
            "Here, it's crucial to cultivate the right mindset and remind yourself each morning, evening, during shower time, etc., that you have to tackle the most important and challenging problem. If you find it difficult, ask yourself why, reflect, and try again.",
            "It's well-known that starting the day by working on the most challenging task is important, but in practice, it's not that easy.",
            "The challenge in this approach is avoiding the temptation to say, 'Oh, only 3 tasks; I have much more to get done.' It's important to identify what truly constitutes the top 3 tasks for the day. People tend to set easy, accomplishable tasks and create long backlogs and to-do lists for the day, giving them a false sense of accomplishment. For example, tasks like shopping, calling X, and saying 'hi' 9 times might serve as distractions when mixed with more substantial items.",
            "When you identify the most challenging problems for the day and see that there are no tasks accomplished, it can be demotivating. However, completing the list provides a sense of achievement.",
            "A good practice is to have at least one problem every 1-2 days that serves as a blocker for specific directions. If you encounter more blockers, prioritize them and address them as soon as possible."
        ],
        tags: ['daily planning', 'prioritisation', 'to-dos']
    },
    {
        id: 2,
        title: "experiment 2 - identify blockers (1)",
        content: [
            "It is crucial to understand what stops you from moving forward and unblock yourself as soon as possible.",
            "If you have a task to do, address it today. If you need assistance, seek out someone who has faced a similar problem and ask for advice.",
            "Consider incorporating 15-30 minute weekly sessions labeled \"Working on Blockers\" to identify and resolve some of these obstacles. If a particular blocker demands more time, allocate dedicated time during the week to address it.",
            "You can set aside time on Sunday evening to reflect on and plan for the upcoming week, gaining a better understanding and vision.",
            "The following questions, along with a step-by-step approach, currently aid me (though it may not be applicable later): \n(1) What am I working on?\n(2) What tasks must be accomplished for each direction?\n(3) What is impeding my progress? \n(4) What potential obstacles could hinder my progress? \n(5) What actions can I take to unblock these directions? \n(6) Are there individuals I can approach for advice, if needed?"
        ],
        tags: ['blockers']
    },
    {
        id: 1,
        title: "experiment 1 - блог про експерименти",
        content: [
            "чомусь мені так хочеться. це складно пояснити, але хочеться.",
            "зараз трішки пафосних слів, але в житті все можна описати експериментами. успішними і не дуже. ідея в тому, щоб виносити з того якісь уроки пробувати ще раз, але в трішки інший спосіб :)",
            "вся ідея цього блогу показати силу ітеративності. я дійшов висновку, що останні роки, все що я робив - це просто ітерував те, що працює і не працює. будь-яка зміна, вона ітеративна. перед нею слідує ще n різних кроків. і тут головне \"різних\", а не n 🤓",
            "тому цей блог також свого роду експеримент. я запускаю його без підготовки, лише трішечки. будемо покращувати в процесі. все рівно ніколи не буду готовий, а ще і скоро Новий рік, а там буде ковбаска, тому...",
            "в усякому разі, хочеться вірити, що це діло не загнеться через... завтра... чи відчуваю я страх? так. розгубленість? так. чи турбуюся я через це? ні 🙂",
            "чи буде це весело? еге ж, ще й як. тому, поооїхали! перший з 10000 🥳"
        ],
        tags: ['blog', 'experiments', 'beginning']
    },
];

const generatePreview = (contentArray, maxLength = 100) => {
    const preview = contentArray.join(' ');
    if (preview.length <= maxLength) {
        return preview;
    }
    return preview.substring(0, maxLength) + '...';
};

function Posts() {
    const [activeTab, setActiveTab] = useState('posts');
    const [selectedItem, setSelectedItem] = useState(null);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedItem(null);
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    const handleGoBack = () => {
        setSelectedItem(null);
    };

    const filteredPosts = posts;
    const filteredExperiments = experiments;

    return (
        <div className='posts-container'>
            <div className='tab-buttons'>
                <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => handleTabChange('posts')}>Posts</button>
                <button className={activeTab === 'experiments' ? 'active' : ''} onClick={() => handleTabChange('experiments')}>Experiments</button>
            </div>

            {/* <div className="search-tags-section">
                <input
                    type="text"
                    placeholder="Search by tag..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div> */}

            {activeTab === 'posts' && !selectedItem && (
                <div className="items-list">
                    {filteredPosts.map(post => (
                        <div key={post.id} className="post-item" onClick={() => handleItemClick(post)}>
                            <h2>{post.title}</h2>
                            <p>{generatePreview(post.content)}</p>
                            {/* <div className="tags">
                                {post.tags.map((tag, index) => (
                                    <span key={index} className="tag">{tag}</span>
                                ))}
                            </div> */}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'experiments' && !selectedItem && (
                <div className="items-list">
                    {filteredExperiments.map(experiment => (
                        <div key={experiment.id} className="post-item" onClick={() => handleItemClick(experiment)}>
                            <h2>{experiment.title}</h2>
                            <p>{generatePreview(experiment.content)}</p>
                            <div className="tags">
                                {experiment.tags.map((tag, index) => (
                                    <span key={index} className="tag">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedItem && (
                <div className="selected-item">
                    <button onClick={handleGoBack} className="go-back">Go Back</button>
                    <h2>{selectedItem.title}</h2>
                    {selectedItem.content.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                    <div className="tags">
                        {selectedItem.tags.map((tag, index) => (
                            <span key={index} className="tag">#{tag}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Posts;