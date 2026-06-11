import BooksYearSection from './BooksYearSection';

const books = [
    { year: 2024, title: 'The Lean Startup', author: 'Eric Ries' },
    { year: 2024, title: 'Я бачу, вас цікавить пітьма', author: 'Illarion Pavliuk' },
    { year: 2024, title: '🔥 Стів Джобс', author: 'Walter Isaacson' },
    { year: 2024, title: 'Never Stop', author: 'Mari Karachina' },
    { year: 2024, title: 'The Path', author: 'Konosuke Matsushita' },
    { year: 2024, title: 'Монах, який продав свій Ferrari', author: 'Robin Sharma' },
];

function BooksList2024() {
    return <BooksYearSection year="2024" books={books} />;
}

export default BooksList2024;
