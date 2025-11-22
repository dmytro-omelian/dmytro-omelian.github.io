import React from 'react';
import './BooksList.css';

const books = [
    { year: 2024, title: 'The Lean Startup (eng)', author: 'Eric Ries' },
    { year: 2024, title: 'I See You Are Interested in Darkness (ukr)', author: 'Illarion Pavliuk' },
    { year: 2024, title: '🔥 Steve Jobs (ukr)', author: 'Walter Isaacson' },
    { year: 2024, title: 'Never Stop (ukr)', author: 'Mari Karachina' },
    { year: 2024, title: 'The Path (eng)', author: 'Konosuke Matsushita' },
    { year: 2024, title: 'The Monk Who Sold His Ferrari (ukr)', author: 'Robin Sharma' },
];

function BooksList2024() {
    return (
        <div>
            <div className="books-by-year">
                <h3>2024</h3>
                <ul>
                    {books.slice().reverse().map((book, index) => (
                        <li key={index}><u>{book.title}</u> by {book.author}</li>
                    ))}
                </ul>
            </div>
            {/* You can add more years and books as needed */}
        </div>
    );
}

export default BooksList2024;
