import React from 'react';
import { Link } from 'react-router-dom';
import './BooksList.css';
import { renderMarkdownToHtml } from '../../utils/markdown';
import { getBookSummary, hasBookSummary } from './readingList';

function getBookHash(slug) {
    return slug ? `#book-${encodeURIComponent(slug)}` : '';
}

function getBookFromHash(books) {
    if (typeof window === 'undefined') return null;

    const { hash } = window.location;
    if (!hash || !hash.startsWith('#book-')) return null;

    let slug = hash.replace('#book-', '');
    try {
        slug = decodeURIComponent(slug);
    } catch (error) {
        return null;
    }
    if (!slug) return null;

    return books.find((book) => book.slug === slug && hasBookSummary(book)) || null;
}

function BookNoteModal({ book, onClose }) {
    const dialogTitleId = `book-note-title-${book.slug || book.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}`;

    React.useEffect(() => {
        if (typeof document === 'undefined') return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="book-note-overlay"
            role="presentation"
            onClick={onClose}
        >
            <article
                className="book-note-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="book-note-header">
                    <div>
                        <p className="book-note-eyebrow">Book note</p>
                        <h4 className="book-note-title" id={dialogTitleId}>
                            {book.title}
                        </h4>
                        <p className="book-note-author">by {book.author}</p>
                    </div>
                    <button
                        type="button"
                        className="book-note-close"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                <div className="book-note-content">
                    <div
                        className="book-note-body"
                        dangerouslySetInnerHTML={{
                            __html: renderMarkdownToHtml(getBookSummary(book)),
                        }}
                    />
                </div>
            </article>
        </div>
    );
}

function BooksYearSection({ year, books }) {
    const [selectedBook, setSelectedBook] = React.useState(null);

    const handleOpenSummary = (book) => {
        if (!hasBookSummary(book)) return;

        setSelectedBook(book);

        if (typeof window !== 'undefined' && book.slug) {
            const newHash = getBookHash(book.slug);
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
        if (typeof window === 'undefined') return undefined;

        const syncSelectedBook = () => {
            setSelectedBook(getBookFromHash(books));
        };

        syncSelectedBook();
        window.addEventListener('hashchange', syncSelectedBook);

        return () => {
            window.removeEventListener('hashchange', syncSelectedBook);
        };
    }, [books]);

    return (
        <div>
            <div className="books-by-year">
                <h3>{year}</h3>
                <ul>
                    {books
                        .map((book, index) => (
                            <li key={book.slug || `${book.title}-${index}`}>
                                {hasBookSummary(book) ? (
                                    <button
                                        type="button"
                                        className="book-title book-title-button has-summary"
                                        onClick={() => handleOpenSummary(book)}
                                    >
                                        {book.title}
                                    </button>
                                ) : (
                                    <span className="book-title">{book.title}</span>
                                )}{' '}
                                by {book.author}
                                {book.relatedPostSlug ? (
                                    <>
                                        {' '}
                                        <Link
                                            to={`/blog/${book.relatedPostSlug}`}
                                            className="book-related-link"
                                        >
                                            {book.relatedPostLabel || 'blog post'}
                                        </Link>
                                    </>
                                ) : null}
                            </li>
                        ))}
                </ul>
            </div>

            {selectedBook && (
                <BookNoteModal
                    book={selectedBook}
                    onClose={handleCloseSummary}
                />
            )}
        </div>
    );
}

export default BooksYearSection;
