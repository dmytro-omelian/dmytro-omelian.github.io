import React from 'react';
import { Link, useParams } from 'react-router-dom';
import './Posts.css';

const posts = [
    {
        id: 3,
        slug: "about-nvidia-way",
        title: "About Nvidia Way",
        date: "January 13, 2026",
        preview: "The Nvidia Way felt less like a success story and more like a field guide to pressure, clarity, and obsession with detail.",
        content: [
            "People joke that \"NVIDIA works 25/8.\" After reading The Nvidia Way, that line stops being a meme and becomes a culture description. This is a company where urgency is essential and \"hard-working\" defines the core approach. And the book makes one thing painfully clear: this culture is powerful and definitely not for everyone.",
            "What I liked about the book is that it does not try to be just a success story. It reads more like a field guide to a specific kind of excellence: the kind that comes from pressure, clarity, and obsession with details. Tae Kim's framing is basically: yes, NVIDIA is a tech giant now, but it was also a company that almost died more than once, and all of that shaped how it works today.",
            "My biggest takeaway: NVIDIA's hardcore reputation is not just about hours, it is about how they think. The book consistently led me into one thing that I am now thinking about how to implement in my life: understand things in detail. The kind of detailed understanding where, if someone asks why three times, you are still standing. This is also why I suddenly started thinking maybe I do need a whiteboard in my life.",
            "Whiteboard at NVIDIA is a weapon. Jensen (and the whole company) uses it to force real-time reasoning: if you cannot explain it live, you do not understand it yet. Whiteboard makes your thinking public and therefore improvable.",
            "Another practice I loved (and think about stealing) is the top-5-things email habit: people send Jensen their top priorities and thoughts, and he uses it as a sensory system for the whole company. The line that stuck with me is that he wants to detect the weak signals, not the obvious trends everyone sees, but the early whispers at the edges. Imagine the newsletter format from the whole company with greatest insights. Sounds cool to me.",
            "This system is demanding because it starts at the CEO. Jensen's style is intense, direct, detail-heavy, and built for speed. NVIDIA is described as a hardcore culture with high accountability, and Jensen stays extremely close to decisions, reportedly with a very large number of direct reports.",
            "At the same time, the story is not simply work more. There is a weird contradiction I respect: high expectations plus a kind of humanity. NVIDIA's own reporting shows overall turnover around 5.3% (FY23) versus a semiconductor industry average of 19.2%, which is not what you would expect from a place with a hardcore reputation. So something is working: mission, compensation, talent density, and the feeling that you are building the future (not just shipping tickets).",
            "The personal-life tradeoff is where I have mixed feelings. Reading about Jensen's always-on mode did not shock me; it made me recognize a pattern. The book mostly avoids personal life commentary, but when small paragraphs appear, like answering emails during moments other people would treat as off-limits, it paints a clear picture: the intensity is not seasonal, it is identity-level. Always.",
            "And then there is the thought that kept returning, and it is the one I cannot unsee: there is no second Jensen inside NVIDIA. The book raises the uncomfortable question of what happens to a culture that is so tightly coupled to one person. Maybe they have plan B or C. Maybe the system can evolve. But it is still fascinating (and a little scary) to see a company run like an extension of one founder's mind.",
            "So my conclusion is simple: The Nvidia Way is inspiring, but not in a copy-paste this culture way. It is more like: here is what it looks like when a company decides to be exceptional on purpose, every day, for decades. Take what you like: the whiteboard thinking, the weak-signal detection, the obsession with details, the bias for action. And if you are curious whether you would thrive in a 25/8 environment, this book is basically an invitation to find out."
        ]
    },
    {
        id: 4,
        slug: "do-it-monthly-well-or-just-from-time-to-time",
        title: "do it monthly! (well, or just from time to time)",
        date: "February 4, 2026",
        preview: "Start of the month feels like the best time to review and reflect, and monthly updates turned from an experiment into a habit.",
        content: [
            "start of the month feels like the best time to review and reflect (as we know).",
            "for the last 13 months, i've been writing something called \"monthly updates.\"",
            "it started as a \"let's give it a try\" and built up into habit.",
            "historically, i think it came from work.",
            "at aisdr we have monthly updates (the ones we send to our investors).",
            "they are not the \"look how busy we are\" kind.",
            "more like what happened, what changed, what we learned, what we do next.",
            "pretty simple ones but well-written.",
            "(frankly speaking, waiting for them at the end of each month is like anticipating a new journal edition 😅)",
            "i used to love yearly planning (even if i only executed half of it).",
            "but seeing this monthly loop was a totally new thing for me.",
            "it forces you to move and iterate faster.",
            "since i started doing monthly updates myself, i'm not a big fan of yearly planning anymore.",
            "i still do a yearly review, just to look back at what actually happened.",
            "but planning a whole year ahead feels too imaginary.",
            "monthly is real enough.",
            "my routine is simple.",
            "i sit down at the end of the month and i review a few sources of truth:",
            "my notes\nmy calendar\nsome analytics (work, product, writing, whatever matters this month).",
            "i'm trying to rebuild the month from scratch.",
            "then i try to answer a few questions:",
            "what was good\nwhat was bad\nwhat should change next month\nwhat i said no to (and maybe should revisit), etc.",
            "the output is usually one short document.",
            "sometimes messy.",
            "sometimes surprisingly clear.",
            "what i still lack is some kind of urgency. or maybe ambition.",
            "sometimes people can look at my monthly goals and say:",
            "(okey, maybe not people, but that's what i could say to me)",
            "\"why can't you do this in a week\"",
            "and honestly i don't always have a good explanation.",
            "anything i say starts to sound like excuses.",
            "maybe it is just being realistic about capacity, or maybe i'm moving too slow.",
            "i'm still figuring it out.",
            "but i'd rather have a realistic loop that runs every month than a bold plan i forget in a week.",
            "after i write the update, i send it to a few people.",
            "i have 7 people in my list. my (so-called) accountability partners (or whatever they call it, just some nice people).",
            "they don't need to reply. they don't even need to read. they can just archive it.",
            "that's actually how i start most of my updates: \"thanks for reading or archiving.\"",
            "the purpose is not \"if people read.\" the purpose is for me to press send.",
            "it turns reflection into something more concrete, like a small commitment.",
            "i think this habit can be applied anytime.",
            "you don't need substack. you don't need linkedin. you don't need a big template.",
            "it can be as simple as emailing yourself 5 bullet points:",
            "one thing i'm proud of\none thing i regret\none thing i learned\none thing i should stop\none focus for next month.",
            "the point is to make it consistent. just try it. you can simply start writing only to yourself.",
            "additionally, i have a gpt project and the knowledge base is essays, memos, and my monthly update. i call it coach and talk to it from time to time :)."
        ]
    },
    {
        id: 1,
        slug: "trying-to-experiment-with-different-concepts-of-writing",
        title: "Trying to experiment with different concepts of writing",
        date: "December 20, 2025",
        preview: "Before I've already been writing for the last 400 days, mostly on LinkedIn. A few months ago, I started using X. For now, I'm not sure about my goals...",
        content: [
            "Trying to experiment with different concepts of writing.",
            "Before I've already been writing for the last 400 days, mostly on LinkedIn. A few months ago, I started using X. For now, I'm not sure about my goals or what I want to achieve with it, but my motivation is pretty simple: it helps me think more clearly.",
            "Why do I think it would not work out?",
            "1. It makes writing a little bit complicated as the process\n2. I can make no difference and be useless because the newsletter format doesn't work on LinkedIn\n3. I'm bad at writing in such a format (but would be happy if I learn something along the way)\n4. Will not be able to do it consistently (without it, it doesn't really make sense)",
            "But still, it is a weekly thing, and I'm curious to try.",
            "Today, I would also like to share an experiment I've tried: flexible studying hours. I've started reading what I like, listening to podcasts I have been interested in for a long time, and taking a deep dive into different topics, all while asking myself various questions.",
            "It is interesting how this process brings different ideas. You find intersections with what you are working on and possible futures. Allow your curiosity to explore a variety of interesting topics.",
            "I will try to have more of those experiences, but sometimes it is hard to find an extra 6 hours. So maybe it makes sense to have them as 1-2 hour sections."
        ]
    },
    {
        id: 2,
        slug: "2025-year-in-review-building-momentum-through-systems",
        title: "2025 Year in Review",
        date: "December 29, 2025",
        preview: "2025 was about building momentum through systems: shipping at AiSDR, testing prototypes with real people, writing in public, growing up fast, and using tiny habits to turn time into compounding.",
        content: [
            "If I had to describe this year in one sentence, it would be: 2025 was about building momentum through systems.",
            "Not big 'life goals,' but repeatable loops: shipping at AiSDR, building prototypes and testing them with people instead of just thinking about building, writing in public consistently, and growing up fast through relationships, moving, travel, and 'adult' responsibilities like investing.",
            "One small trick quietly changed everything: writing monthly updates for a full year. It forced honesty, made progress visible, and turned 'time passing' into compounding.",
            "This was a big shipping year at AiSDR, a YC-backed startup. I shipped a lot, but the interesting part isnt features. Its how I changed as a builder: better decision making, turning 'I dont know what to do' into clear plans, framing problems, picking directions, committing, and changing fast when wrong.",
            "I became faster at going from idea to prototype and using feedback to decide whether to double down, iterate, or kill. Prioritization improved: choosing the few things that matter, saying no more, and protecting momentum, because in startups, focus is everything.",
            "Communication also leveled up: writing early and often, crisp updates, clear tradeoffs, and fewer surprises. Ownership meant taking problems end to end, defining success, driving the work, and staying with it after launch. Shipping features is cool, but shipping better is the real win.",
            "At Ideas Center UCU, three chapters stand out: public speaking, building the Ideas Center website, and helping with IdeasLab. I did nine lectures and talks (IdeasLab, Venture Camp Ukraine, etc.). Speaking is underrated; it forces clear thinking and reveals whether you truly understand your own ideas.",
            "I also built ideascenter.ucu.edu.ua as a freelance project. Shipping something public that others depend on is a good kind of pressure. And I helped with building IdeasLab. Since November I havent worked at the Ideas Center UCU, but Im grateful for almost two years there and the experience it gave me.",
            "On the building side, I got better at stopping the endless planning loop and testing reality fast. My loop became: find a real pain (often my own), build a scrappy prototype, put it in front of people and talk to them, then iterate based on what they do, not just what they say.",
            "I built multiple prototypes and tested them with people. Some showed traction signals, including early paying users. The honest next step is committing long enough for compounding to kick in. Some examples: ai-calendar.com, lnksbot.com, and various small agents for personal use. This year also brought the first money from building SaaS.",
            "Writing turned into a compounding engine. I used to see writing as 'content.' This year, it became a thinking and distribution system. I wrote monthly updates for 12 months, posted daily on LinkedIn (around 3,600 followers and roughly 500,000 impressions), started a LinkedIn newsletter (~380 subscribers), and wrote on X with a small audience but surprisingly high reach (about 389,000 impressions).",
            "The best part wasnt the metrics, but the identity shift: writing made me think more clearly. A set of tiny habits became my operating system: daily journaling, a calendar-first life, monthly planning instead of yearly fantasies, no mindless scrolling with aggressive limits on social media, short feedback loops of build-test-learn, and reading around 22 books while making reading a consistent habit.",
            "When I stop doing these small systems, my output drops fast. On the health side, tennis became a real pillar instead of a random hobby, and the gym was consistent for parts of the year. But I also discovered a painful truth: travel and moving still break my baseline.",
            "One of my goals now is to build a more reliable system that survives travel and life changes, not just ideal weeks. This year was also geographically dense: Kyiv, Cherkasy, Bukovel, Morshyn, Kamianets, Ivano-Frankivsk (including a goat farm), multiple trips to Poltavshchyna, Faine Misto and mountain trips, Poland, Slovakia, Austria, Hungary, Italy, France, and moving to Poland.",
            "Travel was fun and energizing, but also a reminder that mobility without systems kills consistency. On the investing side, this was my first real year of learning. I built a pipeline with Interactive Brokers, a process, dedicated learning time, and I started buying stocks  making the classic mistake of over-diversifying.",
            "I studied quality resources, including Poor Charlies Almanack and other investing thinking. I still see gaps: I need a clearer written investing framework where rules beat vibes, I want fewer, more researched bets instead of chasing hype, and I keep a small domain portfolio mostly for fun.",
            "I dont share much publicly about relationships, but they matter a lot to how this year felt. I wont go into detail here, other than to say: I love you, Po.",
            "Looking ahead, I dont set yearly goals. I prefer monthly goals and short feedback loops. But I do have a direction for 2026: fewer, clearer bets; protecting my baseline (sleep, health, focus); investing heavily into health; and doing more small pet projects as personal R&D.",
            "There is so much interesting stuff happening around. I dont need a perfect plan  just a few good bets, defended focus, and the systems to let compounding do its work."
        ]
    }
];

function Posts() {
    return (
        <div className='posts-container'>
            <h1>Blog</h1>

            <div className="items-list">
                {posts
                    .slice()
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(post => (
                        <Link
                            key={post.id}
                            to={`/blog/${post.slug}`}
                            className="post-item"
                        >
                            <h3>{post.title}</h3>
                            <p className="post-date">{post.date}</p>
                            <p className="post-preview">{post.preview}</p>
                        </Link>
                    ))}
            </div>
            <div className="newsletter-section">
                <iframe
                    src="https://domelian.substack.com/embed"
                    style={{ border: '1px solid #EEE', background: 'white' }}
                    frameBorder="0"
                    scrolling="no"
                    title="Domelian Newsletter"
                ></iframe>
            </div>
        </div>
    );
}

export function PostDetail() {
    const { slug } = useParams();

    const item = posts.find(entry => entry.slug === slug);

    if (!item) {
        return (
            <div className='posts-container'>
                <Link to="/blog" className="go-back">Go back to blog</Link>
                <p>Post not found.</p>
            </div>
        );
    }

    return (
        <div className='posts-container'>
            <div className="selected-item">
                <Link to="/blog" className="go-back">Go back to blog</Link>
                <h2>{item.title}</h2>
                <p className="post-date post-date-selected">{item.date}</p>
                {item.content.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
                <div className="newsletter-section">
                    <iframe
                        src="https://domelian.substack.com/embed"
                        style={{ border: '1px solid #EEE', background: 'white' }}
                        frameBorder="0"
                        scrolling="no"
                        title="Domelian Newsletter"
                    ></iframe>
                </div>
            </div>
        </div>
    );
}

export default Posts;
