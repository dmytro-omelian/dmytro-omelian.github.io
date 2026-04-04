import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCommentCounts } from '../../api/siteData';
import { getAllPostViews, getPostViewsForSlug, incrementPostView } from './postViews';
import PostComments, { DiscussionIcon, formatDiscussionLabel } from './PostComments';
import NewsletterSignup from '../forms/NewsletterSignup';
import './Posts.css';

const posts = [
    {
        id: 8,
        slug: "1984-book-note",
        title: "1984 — нотатка після прочитання",
        author: "Dmytro Omelian",
        date: "April 4, 2026",
        preview: "Мій перший роман-антиутопія і книга, яка змусила по-іншому дивитись на мову, правду і контроль.",
        content: [
            "Мій перший роман-антиутопія і приємне знайомство з жанром.",
            "Чомусь на старті я думав, що книга буде про щось позитивне, бо в мене є англійське видання — воно рожеве, з хлопчиком на обкладинці (читав українську версію від КСД).",
            { type: "heading", text: "Далі можливі спойлери" },
            {
                type: "image",
                src: "/images/books/1984-cover-eng.jpeg",
                alt: "1984, англійське видання з рожевою обкладинкою",
                caption: "Моя англійська версія 1984 — та сама рожева обкладинка, яка спочатку здалась \"позитивною\".",
            },
            "Але після того, як почав читати і розуміти, про що вона, то побачив на цій рожевій обкладинці десятки деталей, яких раніше не помічав (руки, написи, щоденник, його стан, тощо).",
            "Все стало зрозуміло десь після 50 сторінок.",
            "Поведінка людей, партія, телеекрани, які за тобою слідкують, Гольдштайн… все дуже нагадує і легко проводити паралелі. В деякі моменти навіть не віриться, що люди можуть так себе поводити.",
            "Мені здається, це дуже гарна книга для десь 10–11 класу або університетського періоду. Мені дуже сподобалася.",
            "У мене є сформовані якісь бачення і переконання, які збігаються з тим, що відбувається в книзі, але багато нового.",
            "Джулія + Сміт Вінстон — цікаво, що ця книжка була навіть про любов. Я почав співпереживати Вінстону — мені було за нього сумно.",
            "В сцені про щурів було ще й дуже страшно… А момент зради О'Браяна — один з найбільш нищівних у книзі. Ти йому довіряєш разом з Вінстоном, і тебе ламають разом з ним.",
            "Маніпуляції правдою, тортури, НОВОМОВА, 2+2, назви міністерств і якесь дивне відчуття паралелізму з сучасним світом (ну і, звісно, з совком + нацистською Німеччиною).",
            { type: "heading", text: "Новомова як головний удар" },
            "Новомова — це, мабуть, ідея, яка запала мені найбільше. Мова не просто описує думки, вона їх формує і обмежує.",
            "Якщо в мові немає слова для \"свобода\" — чи можеш ти взагалі про неї думати?",
            "Ще з цією AI-епохою згадуєш, що мова = контроль, і в 1984, і зараз.",
            { type: "heading", text: "Чотири спайки продажів за останні 20 років" },
            {
                type: "image",
                src: "/images/books/1984-sales-spikes.png",
                alt: "Графік спайків продажів 1984",
                caption: "Сплески продажів 1984 та причини, які з ними співпали.",
            },
            {
                type: "list",
                items: [
                    "2013 — повʼязаний зі Сноуденом і витоком даних про масове стеження NSA. Продажі на Amazon зросли на 6000%+ за 24 години.",
                    "2017 — коли Трампа обрали і Келліенн Конвей сказала \"alternative facts\" на захист брехні про розмір натовпу на інавгурації. Продажі зросли на 9500%, Penguin надрукував 500 000 копій за тиждень (ДВОМИСЛ + маніпуляція правдою).",
                    "2021 — штурм Капітолію 6 січня + книга увійшла в public domain у більшості країн світу (крім США, де копірайт діє до 2045). Зʼявились десятки нових видань від різних видавництв.",
                    "2025 — чергова інавгурація Трампа.",
                ],
            },
            { type: "heading", text: "Кілька фактів про книгу" },
            {
                type: "list",
                items: [
                    "Є теорія що назва роману утворена від \"перевернутого\" року написання (1948), але це не точно — в чернетках Орвел спочатку писав 1980, потім 1982, і лише потім 1984.",
                    "Це 9-та і остання книга Орвела, написана за життя.",
                    "Надихнувся романом-антиутопією Євгена Замятіна \"Ми\" (1924) — Орвел прочитав його приблизно в 1946 році і навіть написав рецензію.",
                    "В 1984 році книга очолювала список бестселерів США.",
                    "Загалом продано понад 30 мільйонів копій по всьому світу.",
                ],
            },
        ],
        englishContent: [
            "My first dystopian novel and a pleasant introduction to the genre.",
            "For some reason at the start I thought the book would be positive because I own a pink English edition with a boy on the cover (I read the Ukrainian edition from KSD).",
            { type: "heading", text: "Spoilers ahead" },
            {
                type: "image",
                src: "/images/books/1984-cover-eng.jpeg",
                alt: "1984, English edition with a pink cover",
                caption: "My English copy of 1984 — the pink cover that initially felt strangely optimistic.",
            },
            "But once I started reading and understanding what it is about, I noticed dozens of details on that pink cover that I had missed before (hands, inscriptions, the diary, its condition, etc.).",
            "Everything clicked for me after about 50 pages.",
            "People’s behavior, the Party, the telescreens watching you, Goldstein… it all feels painfully familiar and easy to draw parallels with. At times you can’t believe people could behave like this.",
            "I think it is a great book for 10–11 grade or the university period. I loved it.",
            "I already had some formed views and beliefs that align with what happens in the book, but there was a lot that felt new.",
            "Julia + Winston Smith — it’s interesting that the book is also about love. I started empathizing with Winston — I felt sad for him.",
            "The rat scene was terrifying… And O’Brien’s betrayal is one of the most devastating moments in the book. You trust him together with Winston, and you get broken together with him.",
            "Truth manipulation, torture, NEWSPEAK, 2+2, the ministry names, and that strange sense of parallelism with the modern world (and of course with the USSR + Nazi Germany).",
            { type: "heading", text: "Newspeak as the biggest punch" },
            "Newspeak is probably the idea that stuck with me the most. Language doesn’t just describe thoughts — it shapes and limits them.",
            "If a language doesn’t have a word for “freedom,” can you even think about it?",
            "And with this AI era, you remember again that language = control, both in 1984 and now.",
            { type: "heading", text: "Four sales spikes in the last 20 years" },
            {
                type: "image",
                src: "/images/books/1984-sales-spikes.png",
                alt: "Chart of 1984 sales spikes",
                caption: "Sales spikes for 1984 and the events that coincided with them.",
            },
            {
                type: "list",
                items: [
                    "2013 — linked to Snowden and the NSA mass-surveillance leak. Amazon sales jumped 6000%+ in 24 hours.",
                    "2017 — after Trump’s election and Kellyanne Conway’s “alternative facts” comment. Sales rose 9500%, Penguin reprinted 500,000 copies in a week (DOUBLETHINK + truth manipulation).",
                    "2021 — Jan 6 Capitol attack + the book entered the public domain in most countries (except the US, where copyright lasts until 2045). Dozens of new editions appeared.",
                    "2025 — another Trump inauguration.",
                ],
            },
            { type: "heading", text: "A few facts about the book" },
            {
                type: "list",
                items: [
                    "There’s a theory that the title comes from the “reversed” year of writing (1948), but it’s not certain — in drafts Orwell first wrote 1980, then 1982, and only later 1984.",
                    "It was Orwell’s 9th and last book published in his lifetime.",
                    "He was inspired by Yevgeny Zamyatin’s dystopian novel We (1924) — Orwell read it around 1946 and even wrote a review.",
                    "In 1984 the book topped the US bestseller list.",
                    "Over 30 million copies sold worldwide.",
                ],
            },
        ],
    },
    {
        id: 7,
        slug: "im-23-today",
        title: "i'm 23 today",
        date: "March 25, 2026",
        preview: "so: 23 random facts about me that i probably never mentioned.",
        content: [
            "i'm 23 today.",
            "so: 23 random facts about me that i probably never mentioned.",
            "1. i have a ukulele that i play once a year. one day i will start my ukulele career.",
            "2. i played ping pong professionally at school for 1.5 years and once got 3rd place at a city tournament.",
            "3. i keep saying that i drink coffee. actually, i started only after moving to Lviv (damn, this community...), and my coffee is basically відро of milk with a little bit of coffee.",
            "4. when i was a child, i had loooots of LEGO.",
            "5. i have a bicycle but still haven't bought a mudguard or a bell for it. bad.",
            "6. i take English lessons and, honestly, my speaking still frustrates me sometimes.",
            "7. i am an active contributor to the dead internet theory, which probably also explains why i don't have TikTok, Instagram, Telegram, Viber, etc.",
            "8. i want to buy drums one day.",
            "9. my favorite fruit is an orange.",
            "10. i am in love with the idea of Meta glasses. and not because i wear glasses, you know.",
            "11. i want to become a bookworm this year. i even downloaded more books than i can realistically read, but the intention is there.",
            "12. my first internship was at a crypto company, and right after that i was dangerously close to joining an internship at a gambling company. i was bad at researching companies.",
            "13. i have 1.5k Apple Notes and 5.5k completed reminders.",
            "14. i still don't have a driver's license.",
            "15. i used to solve LeetCode problems for fun. like actual fun.",
            "16. there are only two people who call me Митько: my grandmother and Andrii -_-",
            "17. i was born on a Tuesday.",
            "18. i tried betting on sports events once. lost 150 UAH and quit.",
            "19. i didn't have a single date during university.",
            "20. i love reading people and watching behavior. sometimes i can stare at strangers 👀",
            "21. a school teacher got me into programming 8 years ago. right after that, i joined a programming school, and that's where i met Po for the first time 🥰",
            "22. once i was fired.",
            "23. i moved to a new country recently.",
            "hope that by next year i'll either have +1 here or 24 completely new ones.",
            "✌️"
        ],
    },
    {
        id: 6,
        slug: "how-donald-knuths-ai-experiment-changed-my-approach-to-testing-ideas",
        title: "How Donald Knuth's AI Experiment Changed My Approach to Testing Ideas",
        author: "Dmytro Omelian",
        date: "March 21, 2026",
        preview: "Donald Knuth just changed how I think about validating ideas.",
        content: [
            "Donald Knuth just changed how I think about validating ideas.",
            "Here's the backstory: Knuth, the godfather of computer science, had been stuck on an open graph theory conjecture for weeks.",
            "His colleague Filip Stappers fed the exact problem to Claude (Anthropic). In roughly 1 hour and 31 systematic explorations, Claude tried brute-force searches, invented what he called serpentine patterns, hit dead ends, pivoted strategies, and eventually found a working solution for all cases [1].",
            "Knuth's reaction? \"It seems that I'll have to revise my opinions about 'generative AI' one of these days.\"",
            "This paper is so impressive, even if I definitely did not understand all of it.",
            "But the key point I understood and immediately asked myself was simple: why am I still validating my ideas manually?",
            "So I started doing exactly that with Claude Cowork. Thanks to Yuriy Zaremba for giving the whole team access.",
            { type: "heading", text: "The process" },
            "The last experiment was on Friday: validating a hypothesis about bad emails at AiSDR.",
            "The process is surprisingly simple:",
            "-> I described the hypothesis I wanted to validate. I had already done some Datadog work to come up with it.",
            "-> I gave Claude the API key for one of our providers and the context it needed.",
            "-> I provided limitations and restrictions.",
            "-> Claude wrote the code, built the filtration algorithm, ran the experiments, and logged everything [2].",
            "-> It calculated metrics, tested edge cases, and iterated on the approach.",
            "-> I got back structured results with all the reasoning visible.",
            "It's like having a research partner who doesn't sleep, doesn't get bored, and documents every single step.",
            "What impressed me most was the process itself. It looked exactly like what Knuth described in his paper. Claude did not just try one thing. It explored systematically. It tried an approach, evaluated it, hit a wall, changed direction, and kept going.",
            "That's not generating text. That's experimenting.",
            "The difference between reading about AI capabilities and actually watching it validate your hypothesis in real time, writing code, running calculations, and logging results, is huge. It also saves an absurd amount of time.",
            "Back when I was doing research at the Center for Responsible AI at NYU on incorporating stability objectives into the design of data-intensive pipelines, I ran lots of experiments on my own. Now I can see that with tools like this, I would mostly create hypotheses, analyze them, and top up my Claude account balance from time to time :) [3]",
            "If you have an idea you've been sitting on because testing it properly feels like too much work, just describe it. Let Claude do the experimenting.",
            "You might be surprised what comes back.",
            { type: "heading", text: "References" },
            {
                type: "link",
                prefix: "[1] Paper: ",
                text: "claude-cycles.pdf",
                url: "https://www-cs-faculty.stanford.edu/~knuth/papers/claude-cycles.pdf"
            },
            "[2] Logging is important since I can validate every step on a small sample first, then scale up.",
            "[3] This research was online, and thanks to Ukrainian Catholic University and UCU Faculty of Applied Sciences / APPS UCU."
        ]
    },
    {
        id: 5,
        slug: "now-i-see-how-it-is-coming",
        title: "Now I See How It Is Coming",
        author: "Dmytro Omelian",
        date: "March 9, 2026",
        preview: "You're paying $9.99 a month for an app that does three things you care about and forty-seven you don't.",
        content: [
            "You're paying $9.99 a month for an app that does three things you care about and forty-seven you don't.",
            "I know this because I've been you. For six years, I cycled through lots of productivity tools I could find. Notion, Todoist, TickTick, things I can't even remember the names of anymore. Each time, the pattern was the same: excitement, setup, migration of my entire database from the old tool, a few good weeks, then a slow fade. Not because the app broke. Because something felt off. Something slightly didn't fit. And then I'd spot a new one, think \"maybe this one works,\" and start all over again.",
            "Thanks for reading experimenting is cool, i think! Subscribe for free to receive new posts and support my work.",
            "Tiago Forte calls this \"tool churn\" - the endless cycle of switching productivity systems, not because they fail, but because the novelty wears off. Research from Wendy Wood's habit lab at Duke backs this up: the tool you use matters far less than the environment you build around it. At some point, I realized the same thing. It wasn't about the app. It was about mindset. The kind of mindset that lets you get things done even with a bullet-point list in Apple Notes.",
            "But here's what shifted my thinking further: what if you didn't have to choose someone else's app at all?",
            "What if you just built your own?",
            "I'm not talking about building the next Spotify or replicating your telecom provider's app. Those live in a different category entirely - massive infrastructure, licensed content, millions of users. I'm talking about the smaller stuff. Habit trackers. Calorie counters. Personal dashboards. Journaling apps. The kind of tools where someone's product team made a hundred decisions about how you should organize your life - and got most of them slightly wrong.",
            "Robin Sloan wrote a beautiful essay in 2020 called \"An App Can Be a Home-Cooked Meal.\" He built a tiny messaging app just for his family - no scale, no users, no App Store listing - and argued that not all software needs to be a product [1]. After reading it, I keep thinking about building one tool that sends the same message to all my family members. Since I don't have socials and everyone in my family uses different messaging apps, I'd find it useful to type a single message and have it distributed to all the right channels. Maggie Appleton later expanded on this idea, calling them \"home-cooked apps.\" Software should be personal, not mass-produced.",
            "A year ago, that sounded idealistic. Now it's just... possible.",
            { type: "heading", text: "My $10 habit tracker" },
            "I don't have much iOS experience. A university course two years ago, and one vibe-coded habit tracking app. That's it. The app is not rocket science. It's simple. But it has exactly the set of features I want, arranged exactly the way I want them. Nothing crazy. And I've been using it for months.",
            "Here's what surprised me: I feel connected to it. Even though I built it in a few hours with AI doing most of the heavy lifting, there's an attachment there that I never felt toward any app I downloaded. It's the same reason home-cooked food feels different from a restaurant meal - effort, ownership, and the absence of someone else's vision imposed on you.",
            "My habit tracker isn't better than Todoist or TickTick in general. It's better for me. And that's the whole point. Personal software fits you in a way no product team would ever prioritize, because you're a market of one. And with TestFlight, your app doesn't have to stay personal - you can share it with close friends, family, or your whole class without ever publishing to the App Store [2].",
            { type: "caption", text: "My app vibe-coded with Superapp :)" },
            { type: "heading", text: "The math that kills subscriptions" },
            "Here's the thing: people overcomplicate. Building your own app is just cheaper. Say you use three personal-utility apps - a habit tracker, a calorie counter, and some kind of daily planner. At $5-10 each per month, that's $180-360 a year. Every year. And you're still stuck with someone else's design choices.",
            "An Apple Developer account costs $99 a year. Build all three apps yourself, and that's $33 per app - a one-time equivalent of three months of a single subscription. But unlike a subscription, the app doesn't expire. It's yours forever. You can update it whenever you want. And you can share it with up to 100 people via TestFlight for free - your family, your friends, your team. No one else pays a cent.",
            "The more apps you build, the more absurd the subscription model looks. Five apps? That's $20 each. Ten? $10. Meanwhile, the subscription crowd is still paying $60-100 a month for tools they half-use. The economics aren't even close.",
            { type: "heading", text: "Not everyone can do this yet" },
            "I won't pretend there's no barrier. Right now, you still need the courage to download Xcode. You probably need to not be scared of something like Supabase for a backend. There's a gap between \"anyone can prompt an AI\" and \"anyone can ship an app to their phone.\"",
            "But that gap is shrinking fast. Tools like Replit, Bolt, and Lovable are pushing toward a world where you don't need Xcode at all.",
            "The strongest argument for building your own tools isn't that it's cheaper, though it is. It's that personal software fits you in a way that nothing off the shelf ever will.",
            "If you disagree or want to share your own perspective, I'd love to hear it. Happy to discuss.",
            { type: "heading", text: "References" },
            "[1] Robin Sloan - \"An App Can Be a Home-Cooked Meal\" - Sloan built a messaging app for his family and argued that not all software needs to scale.",
            "[2] Apple's TestFlight allows you to distribute apps to up to 100 people without publishing to the App Store."
        ]
    },
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

const DEFAULT_AUTHOR = 'Dmytro Omelian';
const viewCountFormatter = new Intl.NumberFormat('en-US');

function getPostAuthor(post) {
    return post.author || DEFAULT_AUTHOR;
}

function formatViewLabel(viewCount) {
    const safeViewCount = Number.isFinite(viewCount) && viewCount >= 0 ? Math.floor(viewCount) : 0;
    const suffix = safeViewCount === 1 ? 'view' : 'views';
    return `${viewCountFormatter.format(safeViewCount)} ${suffix}`;
}

function PostMeta({ date, viewCount, commentCount, discussionHref, selected = false }) {
    return (
        <div className={`post-meta${selected ? ' post-meta-selected' : ''}`}>
            <span className="post-meta-date">{date}</span>
            {typeof viewCount === 'number' && (
                <>
                    <span className="post-meta-separator" aria-hidden="true">•</span>
                    <span className="post-views">{formatViewLabel(viewCount)}</span>
                </>
            )}
            {typeof commentCount === 'number' && (
                <>
                    <span className="post-meta-separator" aria-hidden="true">•</span>
                    {discussionHref ? (
                        <a className="post-discussion-link" href={discussionHref}>
                            <DiscussionIcon className="post-discussion-icon" />
                            <span>{formatDiscussionLabel(commentCount)}</span>
                        </a>
                    ) : (
                        <span className="post-discussion-link post-discussion-link-static">
                            <DiscussionIcon className="post-discussion-icon" />
                            <span>{formatDiscussionLabel(commentCount)}</span>
                        </span>
                    )}
                </>
            )}
        </div>
    );
}

function renderBacklink(link, index) {
    if (!link?.href || !link?.label) {
        return null;
    }

    const isInternal = link.href.startsWith('/');

    if (isInternal) {
        return (
            <Link key={`${link.href}-${index}`} to={link.href} className="post-backlink">
                {link.label}
            </Link>
        );
    }

    return (
        <a
            key={`${link.href}-${index}`}
            href={link.href}
            className="post-backlink"
            target="_blank"
            rel="noopener noreferrer"
        >
            {link.label}
        </a>
    );
}

function renderContentBlock(block, index) {
    if (typeof block === 'string') {
        return <p key={index}>{block}</p>;
    }

    if (block?.type === 'image') {
        return (
            <figure key={index} className="post-figure">
                <img className="post-image" src={block.src} alt={block.alt || ''} loading="lazy" />
                {block.caption ? <figcaption className="post-figcaption">{block.caption}</figcaption> : null}
            </figure>
        );
    }

    if (block?.type === 'heading') {
        return (
            <h3 key={index} className="post-section-heading">
                {block.text}
            </h3>
        );
    }

    if (block?.type === 'caption') {
        return (
            <p key={index} className="post-caption">
                {block.text}
            </p>
        );
    }

    if (block?.type === 'link') {
        return (
            <p key={index}>
                {block.prefix}
                <a href={block.url} target="_blank" rel="noopener noreferrer">
                    {block.text}
                </a>
                {block.suffix}
            </p>
        );
    }

    if (block?.type === 'list' && Array.isArray(block.items)) {
        const ListTag = block.ordered ? 'ol' : 'ul';

        return (
            <ListTag key={index} className="post-list">
                {block.items.map((item, itemIndex) => (
                    <li key={`${index}-${itemIndex}`}>{item}</li>
                ))}
            </ListTag>
        );
    }

    return null;
}

function Posts() {
    const [viewsBySlug, setViewsBySlug] = useState({});
    const [commentCountsBySlug, setCommentCountsBySlug] = useState({});

    useEffect(() => {
        let isActive = true;

        getAllPostViews(true)
            .then(nextViews => {
                if (isActive) {
                    setViewsBySlug(nextViews);
                }
            })
            .catch(() => {
                // Keep the UI usable even if the endpoint is unavailable.
            });

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        let isActive = true;

        getCommentCounts(posts.map(post => post.slug))
            .then(nextCounts => {
                if (isActive) {
                    setCommentCountsBySlug(nextCounts);
                }
            })
            .catch(() => {
                // Keep the blog index usable if the comments endpoint is unavailable.
            });

        return () => {
            isActive = false;
        };
    }, []);

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
                            <PostMeta
                                date={post.date}
                                viewCount={viewsBySlug[post.slug]}
                                commentCount={commentCountsBySlug[post.slug]}
                            />
                            <p className="post-preview">{post.preview}</p>
                        </Link>
                    ))}
            </div>
            <div className="newsletter-section">
                <p className="newsletter-copy">
                    Essays, experiments, and updates from what I&apos;m building and learning.
                </p>
                <NewsletterSignup title="experimenting is cool, i think" />
            </div>
        </div>
    );
}

export function PostDetail() {
    const { slug } = useParams();
    const item = posts.find(entry => entry.slug === slug);
    const [viewCount, setViewCount] = useState();
    const [commentCount, setCommentCount] = useState();
    const [showEnglish, setShowEnglish] = useState(false);
    const hasEnglish = Boolean(item?.englishContent?.length);
    const contentToRender = showEnglish && hasEnglish ? item.englishContent : item.content;
    const backlinks = Array.isArray(item?.backlinks)
        ? item.backlinks.filter((link) => link?.href && link?.label)
        : [];

    useEffect(() => {
        let isActive = true;

        if (!item) {
            setViewCount(undefined);
            return () => {
                isActive = false;
            };
        }

        setViewCount(undefined);

        (async () => {
            const currentViews = await getPostViewsForSlug(slug);

            if (isActive) {
                setViewCount(currentViews);
            }

            const nextViews = await incrementPostView(slug);

            if (isActive) {
                setViewCount(nextViews);
            }
        })().catch(() => {
            // Keep rendering the post content even if views fail to load.
        });

        return () => {
            isActive = false;
        };
    }, [item, slug]);

    useEffect(() => {
        setShowEnglish(false);
    }, [slug]);

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
                <p className="post-author">{getPostAuthor(item)}</p>
                <PostMeta
                    date={item.date}
                    viewCount={viewCount}
                    commentCount={commentCount}
                    discussionHref="#discussion"
                    selected
                />
                {backlinks.length > 0 && (
                    <div className="post-backlinks">
                        {backlinks.map(renderBacklink)}
                    </div>
                )}
                {hasEnglish && (
                    <button
                        type="button"
                        className="post-language-toggle"
                        onClick={() => setShowEnglish((current) => !current)}
                    >
                        {showEnglish ? 'Show in Ukrainian' : 'Show in English'}
                    </button>
                )}
                {contentToRender.map(renderContentBlock)}
                <div className="newsletter-section">
                    <p className="newsletter-copy">
                        Essays, experiments, and updates from what I&apos;m building and learning.
                    </p>
                    <NewsletterSignup title="experimenting is cool, i think" />
                </div>
                <PostComments
                    postSlug={item.slug}
                    postTitle={item.title}
                    onCountChange={setCommentCount}
                />
            </div>
        </div>
    );
}

export default Posts;
