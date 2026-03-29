import BooksYearSection from './BooksYearSection';

const books = [
    { year: 2024, title: 'The Lean Startup (eng)', author: 'Eric Ries' },
    { year: 2024, title: 'I See You Are Interested in Darkness (ukr)', author: 'Illarion Pavliuk' },
    { year: 2024, title: '🔥 Steve Jobs (ukr)', author: 'Walter Isaacson' },
    { year: 2024, title: 'Never Stop (ukr)', author: 'Mari Karachina' },
    { year: 2024, title: 'The Path (eng)', author: 'Konosuke Matsushita' },
    { year: 2024, title: 'The Monk Who Sold His Ferrari (ukr)', author: 'Robin Sharma' },
];

function BooksList2024() {
    return <BooksYearSection year="2024" books={books} />;
}

export default BooksList2024;
