import BooksYearSection from './BooksYearSection';

const books = [
    { year: 2025, title: 'Heart-Led Leadership', author: 'Tommy Spaulding' },
    { year: 2025, title: 'The Five Temptations of a CEO', author: 'Patrick Lencioni' },
    { year: 2025, title: 'Освічена', author: 'Tara Westover' },
    { year: 2025, title: '🔥 Таємнича історія Біллі Міллігана', author: 'Daniel Keyes' },
    { year: 2025, title: 'Fooled by Randomness (1/2)', author: 'Nassim Nicholas Taleb' },
    { year: 2025, title: '🔥 Hell Yeah or No', author: 'Derek Sivers' },
    { year: 2025, title: '🔥 Сліди на дорозі', author: 'Valerii Markus' },
    { year: 2025, title: 'Стрілець (Темна вежа I)', author: 'Stephen King' },
    {
        year: 2025,
        title: '🔥 The Almanack of Naval Ravikant',
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
    { year: 2025, title: 'Білий попіл', author: 'Illarion Pavliuk' },
    { year: 2025, title: '🔥 Start with Why', author: 'Simon Sinek' },
    { year: 2025, title: '🔥 This Is Marketing', author: 'Seth Godin' },
    { year: 2025, title: 'Лють', author: 'Alex Michaelides' },
    { year: 2025, title: 'Інноватори', author: 'Walter Isaacson' },
    { year: 2025, title: 'Довга хода', author: 'Stephen King' },
    { year: 2025, title: 'Тренер на трильйон доларів', author: 'Eric Schmidt, Jonathan Rosenberg, Alan Eagle' },
    { year: 2025, title: '🔥 How to Build a Billion Dollar Company', author: 'Guillaume Moubeche' },
    { year: 2025, title: "П'ять четвертинок апельсина", author: 'Joanne Harris' },
];

function BooksList2025() {
    return <BooksYearSection year="2025" books={books} />;
}

export default BooksList2025;
