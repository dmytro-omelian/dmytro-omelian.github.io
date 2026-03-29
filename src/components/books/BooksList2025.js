import BooksYearSection from './BooksYearSection';

const books = [
    { year: 2025, title: 'Heart-Led Leadership (eng)', author: 'Tommy Spaulding' },
    { year: 2025, title: 'The Five Temptations of a CEO (eng)', author: 'Patrick Lencioni' },
    { year: 2025, title: 'Educated (ukr)', author: 'Tara Westover' },
    { year: 2025, title: '🔥 The Minds of Billy Milligan (ukr)', author: 'Daniel Keyes' },
    { year: 2025, title: 'Fooled by Randomness (eng, 1/2)', author: 'Nassim Nicholas Taleb' },
    { year: 2025, title: '🔥 Hell Yeah or No (eng)', author: 'Derek Sivers' },
    { year: 2025, title: '🔥 Traces on the Road (ukr)', author: 'Valerii Markus' },
    { year: 2025, title: 'The Gunslinger (The Dark Tower I) (ukr)', author: 'Stephen King' },
    {
        year: 2025,
        title: '🔥 The Almanack of Naval Ravikant (eng)',
        author: 'Eric Jorgenson',
        slug: 'the-almanack-of-naval-ravikant-eng',
        summary:
            `score: 5/5 \n\n` +
            `the book i've read maybe 4 times this year 🤓\n\n` +
            `hard to count, because this book has a weird "reading problem" (and a big advantage):\n\n` +
            `you don’t read it like a normal book\n` +
            `you can start from any page\n` +
            `just open it and go\n\n` +
            `sometimes i even scroll through the chapter titles first\n` +
            `pick what matches my mood and then dive in\n\n` +
            `the almanack of naval ravikant, made by Eric Jorgenson\n\n` +
            `this book is very valuable and you can learn about:\n\n` +
            `- leverage (build once, earn many times)\n` +
            `- clear thinking + decision making (taste, judgment, long-term games)\n` +
            `- happiness as a skill (calm, desire, inner peace)\n\n` +
            `but there is a little drawback (and maybe it's intentional)\n\n` +
            `some parts feel like pure conclusions\n` +
            `and i keep thinking\n` +
            `wait, how did Naval get there\n` +
            `what was the chain of thought, etc.\n\n` +
            `(Yuriy Zaremba, now i finally understood what you meant)\n\n` +
            `p.s. i first read the free online version on my tablet\n` +
            `then i got the paperback from Bohdan Mykhailiv (thanks 🙌)`,
    },
    { year: 2025, title: 'White Ash (ukr)', author: 'Illarion Pavliuk' },
    { year: 2025, title: '🔥 Start with Why (eng)', author: 'Simon Sinek' },
    { year: 2025, title: '🔥 This Is Marketing (eng)', author: 'Seth Godin' },
    { year: 2025, title: 'The Fury (ukr)', author: 'Alex Michaelides' },
    { year: 2025, title: 'The Innovators (ukr)', author: 'Walter Isaacson' },
    { year: 2025, title: 'The Long Walk (ukr)', author: 'Stephen King' },
    { year: 2025, title: 'Trillion Dollar Coach (ukr)', author: 'Eric Schmidt, Jonathan Rosenberg, Alan Eagle' },
    { year: 2025, title: '🔥 How to Build a Billion Dollar Company (eng)', author: 'Guillaume Moubeche' },
    { year: 2025, title: 'Five Quarters of the Orange (ukr)', author: 'Joanne Harris' },
];

function BooksList2025() {
    return <BooksYearSection year="2025" books={books} />;
}

export default BooksList2025;
