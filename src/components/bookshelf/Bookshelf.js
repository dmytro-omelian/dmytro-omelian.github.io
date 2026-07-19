import React, { useEffect, useMemo, useState } from 'react';
import { getPublicBookshelf } from '../../api/siteData';

import './Bookshelf.css';

const STATUS_ORDER = ['active', 'want_to_read', 'backlog'];
const STATUS_LABELS = {
  active: 'Active',
  want_to_read: 'Want to Read',
  backlog: 'Backlog',
};

function groupByStatus(entries) {
  const grouped = {};

  for (const status of STATUS_ORDER) {
    grouped[status] = [];
  }

  for (const entry of entries) {
    const status = STATUS_ORDER.includes(entry.status) ? entry.status : 'backlog';
    grouped[status].push(entry);
  }

  return STATUS_ORDER
    .filter((status) => grouped[status].length > 0)
    .map((status) => ({ status, label: STATUS_LABELS[status], entries: grouped[status] }));
}

function Bookshelf() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) =>
      entry.title.toLowerCase().includes(query)
      || entry.author.toLowerCase().includes(query)
      || (entry.tags || []).some((tag) => tag.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);
  const sections = useMemo(() => groupByStatus(filteredEntries), [filteredEntries]);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError('');

    getPublicBookshelf()
      .then((nextEntries) => {
        if (isActive) {
          setEntries(nextEntries);
        }
      })
      .catch((err) => {
        if (isActive) {
          setError(err.message || 'Failed to load bookshelf.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="bookshelf-container">
      <h2 className="bookshelf-container-title">My bookshelf</h2>

      {!isLoading && !error && entries.length > 0 && (
        <div className="bookshelf-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or tag..."
            className="bookshelf-search-input"
          />
          {searchQuery && (
            <span className="bookshelf-search-count">
              {filteredEntries.length} of {entries.length}
            </span>
          )}
        </div>
      )}

      {isLoading && <p className="bookshelf-feedback">Loading bookshelf...</p>}
      {!isLoading && error && <p className="bookshelf-feedback bookshelf-feedback-error">{error}</p>}

      {!isLoading && !error && sections.map(({ status, label, entries: sectionEntries }) => (
        <section className="bookshelf-section" key={status}>
          <h3>{label}</h3>
          <ul>
            {sectionEntries.map((entry) => (
              <li key={entry.id}>
                <span className="bookshelf-book-title">
                  {entry.isOnline && entry.url ? (
                    <a href={entry.url} target="_blank" rel="noopener noreferrer">
                      {entry.title}
                    </a>
                  ) : (
                    entry.title
                  )}
                </span>
                <span className="bookshelf-book-author"> &mdash; {entry.author}</span>
                {entry.isOnline && (
                  <span className="bookshelf-online-badge">online</span>
                )}
                {entry.tags.map((tag) => (
                  <button
                    className={`bookshelf-tag${searchQuery.trim().toLowerCase() === tag.toLowerCase() ? ' bookshelf-tag-active' : ''}`}
                    key={tag}
                    onClick={() => setSearchQuery((prev) => prev.trim().toLowerCase() === tag.toLowerCase() ? '' : tag)}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!isLoading && !error && sections.length === 0 && (
        <p className="bookshelf-feedback">Nothing here yet.</p>
      )}
    </div>
  );
}

export default Bookshelf;
