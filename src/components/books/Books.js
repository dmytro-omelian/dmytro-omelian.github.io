import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicReadingList } from '../../api/siteData';
import BooksYearSection from './BooksYearSection';
import { groupBooksByYear } from './readingList';

import './BooksList.css';

function Books() {
  const [books, setBooks] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [booksError, setBooksError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return books;
    return books.filter((book) =>
      book.title.toLowerCase().includes(query)
      || book.author.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);
  const booksByYear = useMemo(() => groupBooksByYear(filteredBooks), [filteredBooks]);

  useEffect(() => {
    let isActive = true;

    setIsLoadingBooks(true);
    setBooksError('');

    getPublicReadingList()
      .then((nextBooks) => {
        if (!isActive) {
          return;
        }

        setBooks(nextBooks);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setBooksError(error.message || 'Failed to load reading list.');
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingBooks(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="books-list-container">
      <h2 className="books-container-title">An incomplete list of books that I&apos;ve been reading lately...</h2>

      {!isLoadingBooks && !booksError && books.length > 0 && (
        <div className="books-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by title or author..."
            className="books-search-input"
          />
          {searchQuery && (
            <span className="books-search-count">
              {filteredBooks.length} of {books.length}
            </span>
          )}
        </div>
      )}

      {isLoadingBooks && <p className="books-feedback">Loading reading list...</p>}
      {!isLoadingBooks && booksError && <p className="books-feedback books-feedback-error">{booksError}</p>}

      {!isLoadingBooks && !booksError && booksByYear.map(({ year, books: yearBooks }) => (
        <BooksYearSection key={year} year={String(year)} books={yearBooks} />
      ))}

      {!isLoadingBooks && !booksError && booksByYear.length === 0 && (
        <p className="books-feedback">Nothing here yet.</p>
      )}

      {!isLoadingBooks && !booksError && (
        <>
          <hr className="books-divider" />
          <p className="books-bookshelf-link">
            <Link to="/bookshelf" className="books-bookshelf-anchor">My Bookshelf</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default Books;
