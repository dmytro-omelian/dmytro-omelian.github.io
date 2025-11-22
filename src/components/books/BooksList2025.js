import React from 'react';
import './BooksList.css';

const books = [
    { year: 2025, title: 'Heart-Led Leadership (eng)', author: 'Tommy Spaulding' },
    { year: 2025, title: 'The Five Temptations of a CEO (eng)', author: 'Patrick Lencioni' },
    { year: 2025, title: 'Educated (ukr)', author: 'Tara Westover' },
    { year: 2025, title: '🔥 The Minds of Billy Milligan (ukr)', author: 'Daniel Keyes' },
    { year: 2025, title: 'Fooled by Randomness (eng, 1/2)', author: 'Nassim Nicholas Taleb' },
    { year: 2025, title: '🔥 Hell Yeah or No (eng)', author: 'Derek Sivers' },
    { year: 2025, title: '🔥 Traces on the Road (ukr)', author: 'Valerii Markus' },
    { year: 2025, title: 'The Gunslinger (The Dark Tower I) (ukr)', author: 'Stephen King' },
    { year: 2025, title: '🔥 The Almanack of Naval Ravikant (eng)', author: 'Eric Jorgenson' },
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
    return (
        <div>
            <div className="books-by-year">
                <h3>2025</h3>
                <ul>
                    {books.slice().reverse().map((book, index) => (
                        <li key={index}><u>{book.title}</u> by {book.author}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default BooksList2025;
