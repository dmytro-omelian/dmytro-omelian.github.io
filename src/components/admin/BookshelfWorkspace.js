import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdminBookshelfEntry,
  deleteAdminBookshelfEntry,
  getAdminBookshelf,
  updateAdminBookshelfEntry,
} from '../../api/siteData';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'backlog', label: 'Backlog' },
];

const STATUS_LABELS = {
  active: 'Active',
  want_to_read: 'Want to Read',
  backlog: 'Backlog',
};

function getDefaultNewEntryDraft() {
  return {
    title: '',
    author: '',
    status: 'backlog',
    isOnline: false,
    url: '',
    tags: '',
  };
}

function formatEntryMeta(entry) {
  const parts = [entry.author, STATUS_LABELS[entry.status] || entry.status];

  if (entry.isOnline) {
    parts.push('Online');
  }

  if (entry.tags && entry.tags.length > 0) {
    parts.push(entry.tags.join(', '));
  }

  parts.push(`Order ${entry.sortOrder}`);
  return parts.join(' · ');
}

function groupByStatus(entries) {
  const grouped = {};

  for (const { value } of STATUS_OPTIONS) {
    grouped[value] = [];
  }

  for (const entry of entries) {
    const status = grouped[entry.status] ? entry.status : 'backlog';
    grouped[status].push(entry);
  }

  return STATUS_OPTIONS
    .filter(({ value }) => grouped[value].length > 0)
    .map(({ value, label }) => ({ status: value, label, entries: grouped[value] }));
}

function WorkspaceSwitch({ activeWorkspace, onWorkspaceChange }) {
  return (
    <div className="admin-workspace-switch" role="tablist" aria-label="Admin workspaces">
      <button
        className={`admin-workspace-switch-button${activeWorkspace === 'questions' ? ' is-active' : ''}`}
        type="button"
        onClick={() => onWorkspaceChange('questions')}
      >
        Questions
      </button>
      <button
        className={`admin-workspace-switch-button${activeWorkspace === 'readingList' ? ' is-active' : ''}`}
        type="button"
        onClick={() => onWorkspaceChange('readingList')}
      >
        Reading list
      </button>
      <button
        className={`admin-workspace-switch-button${activeWorkspace === 'bookshelf' ? ' is-active' : ''}`}
        type="button"
        onClick={() => onWorkspaceChange('bookshelf')}
      >
        Bookshelf
      </button>
    </div>
  );
}

function BookshelfWorkspace({
  adminKeyword,
  activeWorkspace,
  onLogout,
  onWorkspaceChange,
}) {
  const [entries, setEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [newEntryDraft, setNewEntryDraft] = useState(getDefaultNewEntryDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [sidebarSearch, setSidebarSearch] = useState('');

  const selectedEntry = useMemo(
    () => entries.find((e) => e.id === selectedEntryId) || null,
    [entries, selectedEntryId],
  );
  const filteredEntries = useMemo(() => {
    const query = sidebarSearch.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) =>
      entry.title.toLowerCase().includes(query)
      || entry.author.toLowerCase().includes(query)
      || (entry.tags || []).some((tag) => tag.toLowerCase().includes(query))
    );
  }, [entries, sidebarSearch]);
  const entriesByStatus = useMemo(() => groupByStatus(filteredEntries), [filteredEntries]);

  async function loadEntries(keyword = adminKeyword, preferredId = selectedEntryId) {
    if (!keyword) {
      return false;
    }

    setIsLoading(true);
    setWorkspaceError('');

    try {
      const nextEntries = await getAdminBookshelf(keyword);
      setEntries(nextEntries);
      setSelectedEntryId((currentId) => {
        const candidateId = preferredId || currentId;

        if (candidateId && nextEntries.some((e) => e.id === candidateId)) {
          return candidateId;
        }

        return nextEntries[0]?.id || null;
      });
      return true;
    } catch (error) {
      setWorkspaceError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEntries(adminKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKeyword]);

  function handleEntryFieldChange(fieldName, value) {
    setEntries((current) => current.map((entry) => (
      entry.id === selectedEntryId
        ? { ...entry, [fieldName]: value }
        : entry
    )));
  }

  async function handleCreateEntry() {
    const trimmedTitle = newEntryDraft.title.trim();
    const trimmedAuthor = newEntryDraft.author.trim();

    if (!trimmedTitle || !trimmedAuthor) {
      setWorkspaceError('Title and author are required.');
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');

    try {
      const tags = newEntryDraft.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = await createAdminBookshelfEntry(adminKeyword, {
        title: trimmedTitle,
        author: trimmedAuthor,
        status: newEntryDraft.status,
        isOnline: newEntryDraft.isOnline,
        url: newEntryDraft.url.trim() || null,
        tags,
      });

      await loadEntries(adminKeyword, payload.entry.id);
      setNewEntryDraft(getDefaultNewEntryDraft());
      setStatusMessage('Book added.');
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function handleSaveEntry() {
    if (!selectedEntry) {
      return;
    }

    const trimmedTitle = String(selectedEntry.title || '').trim();
    const trimmedAuthor = String(selectedEntry.author || '').trim();

    if (!trimmedTitle || !trimmedAuthor) {
      setWorkspaceError('Title and author are required.');
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');

    try {
      const tagsValue = typeof selectedEntry.tags === 'string'
        ? selectedEntry.tags
        : (selectedEntry.tags || []).join(', ');
      const tags = tagsValue
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = await updateAdminBookshelfEntry(adminKeyword, selectedEntry.id, {
        title: trimmedTitle,
        author: trimmedAuthor,
        status: selectedEntry.status,
        isOnline: selectedEntry.isOnline,
        url: String(selectedEntry.url || '').trim() || null,
        sortOrder: selectedEntry.sortOrder,
        tags,
      });

      await loadEntries(adminKeyword, payload.entry.id);
      setStatusMessage('Book saved.');
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function handleInlineStatusChange(entryId, newStatus) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry || entry.status === newStatus) return;

    setEntries((current) => current.map((e) =>
      e.id === entryId ? { ...e, status: newStatus } : e
    ));

    try {
      const tagsValue = Array.isArray(entry.tags) ? entry.tags : [];
      await updateAdminBookshelfEntry(adminKeyword, entryId, {
        title: entry.title,
        author: entry.author,
        status: newStatus,
        isOnline: entry.isOnline,
        url: entry.url || null,
        sortOrder: entry.sortOrder,
        tags: tagsValue,
      });
      await loadEntries(adminKeyword, selectedEntryId);
    } catch (error) {
      setWorkspaceError(error.message);
      await loadEntries(adminKeyword, selectedEntryId);
    }
  }

  async function handleInlineDelete(entry) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${entry.title}"?`)) {
      return;
    }

    try {
      await deleteAdminBookshelfEntry(adminKeyword, entry.id);
      const nextPreferred = entry.id === selectedEntryId
        ? entries.filter((e) => e.id !== entry.id)[0]?.id || null
        : selectedEntryId;
      await loadEntries(adminKeyword, nextPreferred);
      setStatusMessage('Book deleted.');
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function handleDeleteEntry() {
    if (!selectedEntry) {
      return;
    }

    if (typeof window !== 'undefined' && !window.confirm(`Delete "${selectedEntry.title}"?`)) {
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');

    try {
      await deleteAdminBookshelfEntry(adminKeyword, selectedEntry.id);
      const remainingIds = entries.filter((e) => e.id !== selectedEntry.id).map((e) => e.id);
      await loadEntries(adminKeyword, remainingIds[0] || null);
      setStatusMessage('Book deleted.');
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div>
            <p className="admin-sidebar-label">Admin</p>
            <h1>Bookshelf</h1>
          </div>
          <button
            className="admin-ghost-button"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>

        <WorkspaceSwitch
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={onWorkspaceChange}
        />

        <section className="admin-sidebar-panel">
          <div>
            <p className="admin-sidebar-label">Add book</p>
            <p className="admin-side-note">Add a book to your shelf, then edit details on the right.</p>
          </div>

          <div className="admin-field-grid">
            <label className="admin-field">
              <span>Title</span>
              <input
                type="text"
                value={newEntryDraft.title}
                onChange={(e) => setNewEntryDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Book title"
              />
            </label>

            <label className="admin-field">
              <span>Author</span>
              <input
                type="text"
                value={newEntryDraft.author}
                onChange={(e) => setNewEntryDraft((d) => ({ ...d, author: e.target.value }))}
                placeholder="Author name"
              />
            </label>

            <label className="admin-field admin-field-compact">
              <span>Status</span>
              <select
                value={newEntryDraft.status}
                onChange={(e) => setNewEntryDraft((d) => ({ ...d, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="admin-field admin-field-compact">
              <span>Online</span>
              <input
                type="checkbox"
                checked={newEntryDraft.isOnline}
                onChange={(e) => setNewEntryDraft((d) => ({ ...d, isOnline: e.target.checked }))}
              />
            </label>

            <label className="admin-field">
              <span>URL</span>
              <input
                type="text"
                value={newEntryDraft.url}
                onChange={(e) => setNewEntryDraft((d) => ({ ...d, url: e.target.value }))}
                placeholder="https://..."
              />
            </label>

            <label className="admin-field">
              <span>Tags (comma-separated)</span>
              <input
                type="text"
                value={newEntryDraft.tags}
                onChange={(e) => setNewEntryDraft((d) => ({ ...d, tags: e.target.value }))}
                placeholder="fiction, philosophy"
              />
            </label>
          </div>

          <button
            className="admin-solid-button"
            type="button"
            onClick={handleCreateEntry}
          >
            Add
          </button>
        </section>

      </aside>

      <main className="admin-workspace">
        <div className="admin-workspace-header">
          <div>
            <p className="admin-sidebar-label">Selected book</p>
            <h2>{selectedEntry ? selectedEntry.title : 'Select a book'}</h2>
            {selectedEntry && (
              <p className="admin-side-note">{formatEntryMeta(selectedEntry)}</p>
            )}
          </div>
          <div className="admin-top-actions">
            <button
              className="admin-ghost-button"
              type="button"
              onClick={() => loadEntries(adminKeyword, selectedEntryId)}
            >
              Refresh
            </button>
            {selectedEntry && (
              <>
                <button
                  className="admin-ghost-button"
                  type="button"
                  onClick={handleDeleteEntry}
                >
                  Delete
                </button>
                <button
                  className="admin-solid-button"
                  type="button"
                  onClick={handleSaveEntry}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {(workspaceError || statusMessage) && (
          <div className="admin-feedback">
            {workspaceError && <p className="admin-feedback-error">{workspaceError}</p>}
            {!workspaceError && statusMessage && <p className="admin-feedback-success">{statusMessage}</p>}
          </div>
        )}

        {!selectedEntry && (
          <section className="admin-empty-state">
            <p>Select a book on the left or add a new one.</p>
          </section>
        )}

        {selectedEntry && (
          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-header">
              <div>
                <h3>Book details</h3>
                <p className="admin-side-note">Edit book properties below. Tags are comma-separated.</p>
              </div>
            </div>

            <div className="admin-note-grid">
              <div className="admin-note-editor-pane">
                <label className="admin-field">
                  <span>Title</span>
                  <input
                    type="text"
                    value={selectedEntry.title || ''}
                    onChange={(e) => handleEntryFieldChange('title', e.target.value)}
                  />
                </label>

                <label className="admin-field">
                  <span>Author</span>
                  <input
                    type="text"
                    value={selectedEntry.author || ''}
                    onChange={(e) => handleEntryFieldChange('author', e.target.value)}
                  />
                </label>

                <div className="admin-inline-fields">
                  <label className="admin-field admin-field-compact">
                    <span>Status</span>
                    <select
                      value={selectedEntry.status}
                      onChange={(e) => handleEntryFieldChange('status', e.target.value)}
                    >
                      {STATUS_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-field admin-field-compact">
                    <span>Sort order</span>
                    <input
                      type="number"
                      value={selectedEntry.sortOrder}
                      onChange={(e) => handleEntryFieldChange('sortOrder', e.target.value)}
                    />
                  </label>

                  <label className="admin-field admin-field-compact">
                    <span>Online</span>
                    <input
                      type="checkbox"
                      checked={selectedEntry.isOnline}
                      onChange={(e) => handleEntryFieldChange('isOnline', e.target.checked)}
                    />
                  </label>
                </div>

                <label className="admin-field">
                  <span>URL</span>
                  <input
                    type="text"
                    value={selectedEntry.url || ''}
                    onChange={(e) => handleEntryFieldChange('url', e.target.value)}
                    placeholder="https://..."
                  />
                </label>

                <label className="admin-field">
                  <span>Tags (comma-separated)</span>
                  <input
                    type="text"
                    value={
                      typeof selectedEntry.tags === 'string'
                        ? selectedEntry.tags
                        : (selectedEntry.tags || []).join(', ')
                    }
                    onChange={(e) => handleEntryFieldChange('tags', e.target.value)}
                    placeholder="fiction, philosophy"
                  />
                </label>
              </div>
            </div>
          </section>
        )}
      </main>

      <section className="admin-bottom-panel">
        <div className="admin-bottom-panel-header">
          <p className="admin-sidebar-label">Books</p>
          <div className="admin-sidebar-search">
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search books..."
            />
            {sidebarSearch && (
              <span className="admin-sidebar-search-count">
                {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="admin-bottom-panel-grid">
          {entriesByStatus.map(({ status, label, entries: statusEntries }) => (
            <section className="admin-reading-year-group" key={status}>
              <p className="admin-reading-year-heading">{label}</p>
              <div className="admin-question-list admin-question-list-compact">
                {statusEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`admin-question-item admin-bookshelf-row${entry.id === selectedEntryId ? ' is-active' : ''}`}
                    onClick={() => setSelectedEntryId(entry.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedEntryId(entry.id); }}
                  >
                    <span className="admin-question-row">
                      <span className="admin-question-title">{entry.title}</span>
                      <span className="admin-bookshelf-row-actions">
                        <select
                          className="admin-inline-status-select"
                          value={entry.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleInlineStatusChange(entry.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {STATUS_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <button
                          className="admin-inline-delete-button"
                          type="button"
                          title={`Delete "${entry.title}"`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInlineDelete(entry);
                          }}
                        >
                          ✕
                        </button>
                        {entry.id === selectedEntryId && (
                          <span className="admin-question-badge">Selected</span>
                        )}
                      </span>
                    </span>
                    <span className="admin-question-meta">{formatEntryMeta(entry)}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {isLoading && <p className="admin-side-note">Loading books...</p>}
          {!isLoading && entries.length === 0 && <p className="admin-side-note">No books yet.</p>}
        </div>
      </section>
    </div>
  );
}

export default BookshelfWorkspace;
