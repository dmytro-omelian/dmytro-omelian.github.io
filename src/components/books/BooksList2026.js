import React from 'react';
import './BooksList.css';

const books = [
    { year: 2026, title: 'Outliers', author: 'Malcolm Gladwell' },
    { year: 2026, title: '🔥 House of Huawei', author: 'Eva Dou' },
    {
        year: 2026,
        title: '🔥 The Nvidia Way: Jensen Huang and the Making of a Tech Giant',
        author: 'Tae Kim',
    },
    {
        year: 2026,
        title: '🔥 The Art of Learning',
        author: 'Josh Waitzkin',
        slug: 'the-art-of-learning',
        summary: [
            'In Feb, I read an amazing book, The Art of Learning, by Josh Waitzkin.',
            '',
            'He is an 8-time U.S. National Chess Champion, a 2-time World Champion in Tai Chi Chuan Push Hands, and a Brazilian Jiu-Jitsu black belt.',
            '',
            'A few quotes from the book I love:',
            '',
            '1. "I could spend hours at a chessboard and stand up from the experience on fire with insight about chess, basketball, the ocean, psychology, love, art."',
            '',
            '2. "Growth comes at the expense of previous comfort or safety."',
            '',
            '3. "When uncomfortable, my instinct is not to avoid the discomfort but to become at peace with it."',
            '',
            '4. "Sickness is the most potent ambassador for healthy living."',
            '',
            '5. "If I were ready, I would learn."',
            '',
            '6. "We have to be able to do something slowly before we can have any hope of doing it correctly with speed."',
            '',
            '7. "Thirty-minute visualization exercise" and "then I lay in bed visualizing until 3 A.M."',
            '',
            'and much more',
            '',
            'P.S. Unexpected coincidence from this book: I am back to playing chess 🥳 if you are interested in playing, ping me :)',
        ].join('\n'),
    },
];

function BooksList2026() {
    const [selectedBook, setSelectedBook] = React.useState(null);

    const handleOpenSummary = (book) => {
        if (!book.summary) return;
        setSelectedBook(book);

        if (typeof window !== 'undefined' && book.slug) {
            const newHash = `#book-${book.slug}`;
            if (window.location.hash !== newHash) {
                window.history.replaceState(null, '', newHash);
            }
        }
    };

    const handleCloseSummary = () => {
        setSelectedBook(null);

        if (typeof window !== 'undefined') {
            const { pathname, search, hash } = window.location;
            if (hash && hash.startsWith('#book-')) {
                window.history.replaceState(null, '', pathname + search);
            }
        }
    };

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const { hash } = window.location;
        if (!hash || !hash.startsWith('#book-')) return;

        const slug = hash.replace('#book-', '');
        if (!slug) return;

        const bookWithSummary = books.find(
            (book) => book.slug === slug && !!book.summary
        );

        if (bookWithSummary) {
            setSelectedBook(bookWithSummary);
        }
    }, []);

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
                                <span
                                    className={
                                        book.summary
                                            ? 'book-title has-summary'
                                            : 'book-title'
                                    }
                                    onClick={() => handleOpenSummary(book)}
                                >
                                    {book.title}
                                </span>{' '}
                                by {book.author}
                            </li>
                        ))}
                </ul>
            </div>

            {selectedBook && (
                <div className="book-summary-overlay" onClick={handleCloseSummary}>
                    <div
                        className="book-summary-sidebar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="book-summary-close"
                            onClick={handleCloseSummary}
                        >
                            ×
                        </button>
                        <h4 className="book-summary-title">{selectedBook.title}</h4>
                        <p className="book-summary-author">by {selectedBook.author}</p>
                        <div className="book-summary-text">
                            {selectedBook.summary
                                .replace(/\\n/g, '\n')
                                .split('\n')
                                .map((line, index) =>
                                    line.trim() === '' ? (
                                        <div
                                            key={`space-${index}`}
                                            className="book-summary-space"
                                        />
                                    ) : (
                                        <p key={index}>{line}</p>
                                    )
                                )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BooksList2026;
