import React from 'react';
import './BooksList.css';

const books = [
    { year: 2026, title: '🔥 House of Huawei', author: 'Eva Dou' },
    {
        year: 2026,
        title: '🔥 The Nvidia Way: Jensen Huang and the Making of a Tech Giant',
        author: 'Tae Kim',
    },
    { year: 2026, title: 'Outliers', author: 'Malcolm Gladwell' },
];

function BooksList2026() {
    return (
        <div>
            <div className="books-by-year">
                <h3>2026</h3>
                <ul>
                    {books
                        .slice()
                        .reverse()
                        .map((book, index) => (
                            <li key={index}>
                                <span className="book-title">{book.title}</span> by {book.author}
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    );
}

export default BooksList2026;
