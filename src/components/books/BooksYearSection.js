import React from 'react';
import { Link } from 'react-router-dom';
import './BooksList.css';
import { renderMarkdownToHtml } from '../../utils/markdown';
import {
    getBookFinishedOn,
    getBookScore,
    getBookSummary,
    hasBookSummary,
} from './readingList';

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

function formatBookFinishedDate(value) {
    const dateMatch = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!dateMatch) {
        return null;
    }

    return `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`;
}

function formatBookScore(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const numericScore = Number(value);

    if (!Number.isFinite(numericScore)) {
        return null;
    }

    const normalizedScore = numericScore % 1 === 0 ? `${numericScore.toFixed(0)}` : `${numericScore.toFixed(1)}`;
    return `${normalizedScore}/5`;
}

function getHoverMetaLabel(book) {
    const finishedOn = formatBookFinishedDate(getBookFinishedOn(book));
    const score = formatBookScore(getBookScore(book));
    const parts = [finishedOn, score].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
}

function BookNoteModal({ book, onClose }) {
    const dialogTitleId = `book-note-title-${book.slug || book.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}`;
    const summaryMarkdown = getBookSummary(book);
    const finishedOn = formatBookFinishedDate(getBookFinishedOn(book));
    const score = formatBookScore(getBookScore(book));

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
                        {(finishedOn || score) && (
                            <p className="book-note-meta">
                                {finishedOn ? `Finished: ${finishedOn}` : null}
                                {finishedOn && score ? ' · ' : null}
                                {score ? `Score: ${score}` : null}
                            </p>
                        )}
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
                    {summaryMarkdown ? (
                        <div
                            className="book-note-body"
                            dangerouslySetInnerHTML={{
                                __html: renderMarkdownToHtml(summaryMarkdown),
                            }}
                        />
                    ) : (
                        <p className="book-note-empty">No written note yet.</p>
                    )}
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
                        .map((book, index) => {
                            const hoverMetaLabel = getHoverMetaLabel(book);

                            return (
                                <li
                                    key={book.slug || `${book.title}-${index}`}
                                    id={book.slug ? `book-${book.slug}` : undefined}
                                    data-book-meta={hoverMetaLabel || undefined}
                                >
                                    {hasBookSummary(book) ? (
                                        <button
                                            type="button"
                                            className="book-title book-title-button has-summary"
                                            onClick={() => handleOpenSummary(book)}
                                        >
                                            {book.title}
                                        </button>
                                    ) : book.relatedPostSlug ? (
                                        <Link
                                            to={`/blog/${book.relatedPostSlug}`}
                                            className="book-title book-title-link"
                                        >
                                            {book.title}
                                        </Link>
                                    ) : (
                                        <span className="book-title">{book.title}</span>
                                    )}{' '}
                                    by {book.author}
                                    {book.relatedPostSlug && hasBookSummary(book) ? (
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
                            );
                        })}
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
