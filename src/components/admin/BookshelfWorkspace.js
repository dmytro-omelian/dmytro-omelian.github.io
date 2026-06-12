import React, { useEffect, useMemo, useState } from 'react';
import {
  autoTagBookshelfEntry,
  createAdminBookshelfEntry,
  deleteAdminBookshelfEntry,
  getAdminBookshelf,
  updateAdminBookshelfEntry,
} from '../../api/siteData';
import {
  AdminCommandPalette,
  AdminMcpConfigButton,
  AdminWorkspaceSwitch,
  createSearchText,
  createTagSearchParts,
  matchesSearchQuery,
  useAdminKeyboardShortcuts,
} from './adminControls';

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

const QUICK_STATUS_ACTION_LABELS = {
  active: 'Set Active',
  want_to_read: 'Move to Want to Read',
  backlog: 'Move to Backlog',
};

function getEmptyBookDraft() {
  return {
    title: '',
    author: '',
    status: 'backlog',
    isOnline: false,
    url: '',
    sortOrder: 0,
    tags: '',
    internalNotes: '',
  };
}

function getDraftFromEntry(entry) {
  if (!entry) return getEmptyBookDraft();

  return {
    title: entry.title || '',
    author: entry.author || '',
    status: entry.status || 'backlog',
    isOnline: Boolean(entry.isOnline),
    url: entry.url || '',
    sortOrder: entry.sortOrder ?? 0,
    tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : String(entry.tags || ''),
    internalNotes: entry.internalNotes || '',
  };
}

function parseTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getPayloadFromDraft(draft) {
  return {
    title: draft.title.trim(),
    author: draft.author.trim(),
    status: draft.status,
    isOnline: Boolean(draft.isOnline),
    url: draft.url.trim() || null,
    sortOrder: draft.sortOrder,
    tags: parseTags(draft.tags),
    internalNotes: draft.internalNotes.trim(),
  };
}

function formatEntryMeta(entry) {
  const parts = [STATUS_LABELS[entry.status] || entry.status];

  if (entry.isOnline) {
    parts.push('online');
  }

  if (entry.tags && entry.tags.length > 0) {
    parts.push(entry.tags.map((tag) => `#${tag}`).join(' '));
  }

  parts.push(`order:${entry.sortOrder}`);
  return parts.join(' | ');
}

function truncateText(value, maxLength = 160) {
  const normalizedValue = String(value || '').replace(/\s+/g, ' ').trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 3)}...`;
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

function BookshelfWorkspace({
  adminKeyword,
  activeWorkspace,
  onLogout,
  onWorkspaceChange,
}) {
  const [entries, setEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [drawerMode, setDrawerMode] = useState(null);
  const [draft, setDraft] = useState(getEmptyBookDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [openActionMenuEntryId, setOpenActionMenuEntryId] = useState(null);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) || null,
    [entries, selectedEntryId],
  );

  const filteredEntries = useMemo(() => {
    if (!sidebarSearch.trim()) return entries;

    return entries.filter((entry) => matchesSearchQuery(createSearchText([
      entry.title,
      entry.author,
      entry.status,
      STATUS_LABELS[entry.status],
      entry.isOnline ? 'online' : '',
      entry.url,
      entry.sortOrder,
      entry.internalNotes,
      createTagSearchParts(entry.tags),
    ]), sidebarSearch));
  }, [entries, sidebarSearch]);

  const entriesByStatus = useMemo(() => groupByStatus(filteredEntries), [filteredEntries]);
  const isDrawerOpen = drawerMode === 'create' || drawerMode === 'edit';

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

        if (candidateId && nextEntries.some((entry) => entry.id === candidateId)) {
          return candidateId;
        }

        return null;
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
    loadEntries(adminKeyword, selectedEntryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKeyword]);

  useEffect(() => {
    if (openActionMenuEntryId === null || typeof window === 'undefined') {
      return undefined;
    }

    function closeActionMenu() {
      setOpenActionMenuEntryId(null);
    }

    window.addEventListener('click', closeActionMenu);

    return () => {
      window.removeEventListener('click', closeActionMenu);
    };
  }, [openActionMenuEntryId]);

  useAdminKeyboardShortcuts({
    isCommandPaletteOpen,
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onCloseCommandPalette: () => setIsCommandPaletteOpen(false),
    onSave: () => {
      if (isDrawerOpen) {
        handleSaveDraft();
      }
    },
    onClose: () => {
      if (openActionMenuEntryId !== null) {
        setOpenActionMenuEntryId(null);
        return true;
      }

      if (isDrawerOpen) {
        closeDrawer();
        return true;
      }

      if (sidebarSearch) {
        setSidebarSearch('');
        return true;
      }

      return false;
    },
  });

  const commandPaletteCommands = [
    {
      id: 'save-bookshelf-book',
      label: 'Save book',
      detail: isDrawerOpen ? draft.title || 'Untitled book' : 'No editor open',
      shortcut: '⌘↵',
      disabled: !isDrawerOpen,
      action: handleSaveDraft,
    },
    {
      id: 'close-bookshelf-editor',
      label: 'Close editor',
      detail: isDrawerOpen ? 'Close the bookshelf sidepanel' : 'Editor is closed',
      shortcut: 'Esc',
      disabled: !isDrawerOpen,
      action: closeDrawer,
    },
    {
      id: 'add-bookshelf-book',
      label: 'Add book',
      detail: 'Open a new bookshelf editor',
      action: openCreateDrawer,
    },
    {
      id: 'auto-tag-bookshelf-book',
      label: 'Auto Tag',
      detail: selectedEntry ? selectedEntry.title : 'Select a saved book first',
      disabled: drawerMode !== 'edit' || !selectedEntry,
      action: handleAutoTagEntry,
    },
    {
      id: 'refresh-bookshelf',
      label: 'Refresh bookshelf',
      detail: 'Reload books from the server',
      action: () => loadEntries(adminKeyword, selectedEntryId),
    },
    {
      id: 'clear-bookshelf-search',
      label: 'Clear search',
      detail: sidebarSearch ? sidebarSearch : 'Search is empty',
      shortcut: 'Esc',
      disabled: !sidebarSearch,
      action: () => setSidebarSearch(''),
    },
    {
      id: 'open-reading-list',
      label: 'Open Reading list',
      detail: 'Switch admin workspace',
      action: () => onWorkspaceChange('readingList'),
    },
    {
      id: 'logout-admin',
      label: 'Logout',
      detail: 'End the admin session',
      action: onLogout,
    },
  ];

  function openCreateDrawer() {
    setWorkspaceError('');
    setStatusMessage('');
    setSelectedEntryId(null);
    setDraft(getEmptyBookDraft());
    setDrawerMode('create');
  }

  function openEditDrawer(entry) {
    setWorkspaceError('');
    setStatusMessage('');
    setOpenActionMenuEntryId(null);
    setSelectedEntryId(entry.id);
    setDraft(getDraftFromEntry(entry));
    setDrawerMode('edit');
  }

  function closeDrawer() {
    setDrawerMode(null);
  }

  function toggleActionMenu(event, entryId) {
    event.stopPropagation();
    setOpenActionMenuEntryId((currentEntryId) => (currentEntryId === entryId ? null : entryId));
  }

  function updateDraft(fieldName, value) {
    setDraft((currentDraft) => ({ ...currentDraft, [fieldName]: value }));
  }

  async function handleSaveDraft(options = {}) {
    const payload = getPayloadFromDraft(draft);

    if (!payload.title || !payload.author) {
      setWorkspaceError('Title and author are required.');
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');

    try {
      if (drawerMode === 'create') {
        const result = await createAdminBookshelfEntry(adminKeyword, {
          ...payload,
          autoTag: options.autoTag || false,
        });

        setSelectedEntryId(result.entry.id);
        setDraft(getDraftFromEntry(result.entry));
        setDrawerMode('edit');
        await loadEntries(adminKeyword, result.entry.id);

        if (result.autoTagged && result.suggestedTags) {
          setStatusMessage(`Book added with auto-tags: ${result.suggestedTags.join(', ')}`);
        } else {
          setStatusMessage('Book added.');
        }
        return;
      }

      if (!selectedEntry) {
        return;
      }

      const result = await updateAdminBookshelfEntry(adminKeyword, selectedEntry.id, payload);
      setDraft(getDraftFromEntry(result.entry));
      await loadEntries(adminKeyword, result.entry.id);
      setStatusMessage('Book saved.');
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function handleAutoTagEntry() {
    if (!selectedEntry) return;

    setWorkspaceError('');
    setStatusMessage('');

    try {
      const result = await autoTagBookshelfEntry(adminKeyword, selectedEntry.id, true);
      if (result.entry) {
        setDraft(getDraftFromEntry(result.entry));
      }
      await loadEntries(adminKeyword, selectedEntry.id);
      setStatusMessage(`Auto-tagged: ${result.suggestedTags.join(', ')}`);
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function handleQuickStatusChange(event, entry, nextStatus) {
    event.stopPropagation();

    if (entry.status === nextStatus) {
      setOpenActionMenuEntryId(null);
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');

    try {
      const result = await updateAdminBookshelfEntry(adminKeyword, entry.id, {
        title: String(entry.title || '').trim(),
        author: String(entry.author || '').trim(),
        status: nextStatus,
        isOnline: Boolean(entry.isOnline),
        url: String(entry.url || '').trim() || null,
        sortOrder: entry.sortOrder,
        tags: parseTags(entry.tags),
        internalNotes: String(entry.internalNotes || '').trim(),
      });

      if (selectedEntryId === entry.id && result.entry) {
        setDraft(getDraftFromEntry(result.entry));
      }

      setOpenActionMenuEntryId(null);
      await loadEntries(adminKeyword, entry.id);
      setStatusMessage(`Moved "${entry.title}" to ${STATUS_LABELS[nextStatus]}.`);
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
      setSelectedEntryId(null);
      setDraft(getEmptyBookDraft());
      setDrawerMode(null);
      await loadEntries(adminKeyword, null);
      setStatusMessage('Book deleted.');
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  return (
    <div className={`admin-shell admin-bookshelf-shell${isDrawerOpen ? ' has-sidepanel' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div>
            <p className="admin-sidebar-label">Admin</p>
            <h1>Bookshelf</h1>
          </div>
          <div className="admin-top-actions">
            <button
              className="admin-command-trigger"
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              aria-label="Open admin search"
            >
              ⌘K
            </button>
            <AdminMcpConfigButton adminKeyword={adminKeyword} />
            <button
              className="admin-ghost-button"
              type="button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <AdminWorkspaceSwitch
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={onWorkspaceChange}
        />

        <section className="admin-sidebar-panel admin-bookshelf-sidebar-panel">
          <div>
            <p className="admin-sidebar-label">bookshelf.md</p>
            <div className="admin-bookshelf-counts" aria-label="Bookshelf counts">
              <span>{entries.length} books</span>
              <span>{entries.filter((entry) => entry.internalNotes).length} notes</span>
            </div>
          </div>

          <div className="admin-sidebar-search">
            <input
              type="text"
              value={sidebarSearch}
              onChange={(event) => setSidebarSearch(event.target.value)}
              placeholder="Search words or tags..."
              aria-label="Search bookshelf"
            />
            {sidebarSearch && (
              <span className="admin-sidebar-search-count">
                {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="admin-top-actions admin-bookshelf-sidebar-actions">
            <button
              className="admin-solid-button"
              type="button"
              onClick={openCreateDrawer}
            >
              Add book
            </button>
            <button
              className="admin-ghost-button"
              type="button"
              onClick={() => loadEntries(adminKeyword, selectedEntryId)}
            >
              Refresh
            </button>
          </div>
        </section>
      </aside>

      <main className="admin-workspace admin-bookshelf-workspace">
        <div className="admin-workspace-header admin-bookshelf-workspace-header">
          <div>
            <p className="admin-sidebar-label">Books</p>
            <h2>bookshelf.md</h2>
            <p className="admin-side-note">{filteredEntries.length} of {entries.length} visible</p>
          </div>
          <div className="admin-top-actions">
            <button
              className="admin-ghost-button"
              type="button"
              onClick={() => loadEntries(adminKeyword, selectedEntryId)}
            >
              Refresh
            </button>
            <button
              className="admin-solid-button"
              type="button"
              onClick={openCreateDrawer}
            >
              Add book
            </button>
          </div>
        </div>

        {(workspaceError || statusMessage) && (
          <div className="admin-feedback">
            {workspaceError && <p className="admin-feedback-error">{workspaceError}</p>}
            {!workspaceError && statusMessage && <p className="admin-feedback-success">{statusMessage}</p>}
          </div>
        )}

        <section className="admin-bookshelf-md" aria-label="Bookshelf markdown list">
          {isLoading && <p className="admin-side-note">Loading books...</p>}
          {!isLoading && entriesByStatus.length === 0 && (
            <p className="admin-side-note">No books found.</p>
          )}

          {entriesByStatus.map(({ status, label, entries: statusEntries }) => (
            <section className="admin-bookshelf-md-section" key={status}>
              <h3>## {label}</h3>
              <div className="admin-bookshelf-md-list">
                {statusEntries.map((entry) => (
                  <div
                    className={`admin-bookshelf-md-row${entry.id === selectedEntryId ? ' is-active' : ''}`}
                    key={entry.id}
                  >
                    <button
                      className="admin-bookshelf-md-line"
                      type="button"
                      onClick={() => openEditDrawer(entry)}
                    >
                      <span className="admin-bookshelf-md-book">
                        <span className="admin-bookshelf-md-prefix">-</span>
                        <span className="admin-bookshelf-md-title">{entry.title}</span>
                        {entry.internalNotes && (
                          <span
                            className="admin-bookshelf-md-note-icon"
                            title={truncateText(entry.internalNotes, 240)}
                            aria-hidden="true"
                          >
                            <svg viewBox="0 0 24 24" focusable="false">
                              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 17 0Z" />
                            </svg>
                          </span>
                        )}
                        <span className="admin-bookshelf-md-author">by {entry.author}</span>
                      </span>
                      <span className="admin-bookshelf-md-tags" aria-label="Book tags">
                        {entry.isOnline && <code className="admin-bookshelf-md-tag">online</code>}
                        {(entry.tags || []).map((tag) => (
                          <code className="admin-bookshelf-md-tag" key={tag}>{tag}</code>
                        ))}
                      </span>
                    </button>
                    <span className="admin-bookshelf-md-actions" onClick={(event) => event.stopPropagation()}>
                      <button
                        className="admin-bookshelf-md-action-trigger"
                        type="button"
                        aria-label={`Quick actions for ${entry.title}`}
                        aria-expanded={openActionMenuEntryId === entry.id}
                        onClick={(event) => toggleActionMenu(event, entry.id)}
                      >
                        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                          <circle cx="5" cy="12" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="19" cy="12" r="1.8" />
                        </svg>
                      </button>

                      {openActionMenuEntryId === entry.id && (
                        <div className="admin-bookshelf-md-action-menu" role="menu">
                          {STATUS_OPTIONS.map(({ value }) => (
                            <button
                              className="admin-bookshelf-md-action-menu-item"
                              disabled={entry.status === value}
                              key={value}
                              type="button"
                              role="menuitem"
                              onClick={(event) => handleQuickStatusChange(event, entry, value)}
                            >
                              {entry.status === value ? `Current: ${STATUS_LABELS[value]}` : QUICK_STATUS_ACTION_LABELS[value]}
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </section>
      </main>

      {isDrawerOpen && (
        <>
          <button
            className="admin-sidepanel-backdrop"
            type="button"
            aria-label="Close bookshelf editor"
            onClick={closeDrawer}
          />
          <aside className="admin-sidepanel" aria-label="Bookshelf editor">
            <div className="admin-sidepanel-header">
              <div>
                <p className="admin-sidebar-label">{drawerMode === 'create' ? 'New book' : 'Edit book'}</p>
                <h2>{drawerMode === 'create' ? 'Add book' : (selectedEntry?.title || 'Book')}</h2>
                {drawerMode === 'edit' && selectedEntry && (
                  <p className="admin-side-note">{formatEntryMeta(selectedEntry)}</p>
                )}
              </div>
              <button
                className="admin-ghost-button"
                type="button"
                onClick={closeDrawer}
              >
                Close
              </button>
            </div>

            <form
              className="admin-sidepanel-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveDraft();
              }}
            >
              <label className="admin-field">
                <span>Title</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => updateDraft('title', event.target.value)}
                  placeholder="Book title"
                />
              </label>

              <label className="admin-field">
                <span>Author</span>
                <input
                  type="text"
                  value={draft.author}
                  onChange={(event) => updateDraft('author', event.target.value)}
                  placeholder="Author name"
                />
              </label>

              <div className="admin-inline-fields">
                <label className="admin-field admin-field-compact">
                  <span>Status</span>
                  <select
                    value={draft.status}
                    onChange={(event) => updateDraft('status', event.target.value)}
                  >
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>

                <label className="admin-field admin-field-compact">
                  <span>Sort</span>
                  <input
                    type="number"
                    value={draft.sortOrder}
                    onChange={(event) => updateDraft('sortOrder', event.target.value)}
                  />
                </label>

                <label className="admin-field admin-field-compact admin-checkbox-field">
                  <span>Online</span>
                  <input
                    type="checkbox"
                    checked={draft.isOnline}
                    onChange={(event) => updateDraft('isOnline', event.target.checked)}
                  />
                </label>
              </div>

              <label className="admin-field">
                <span>URL</span>
                <input
                  type="text"
                  value={draft.url}
                  onChange={(event) => updateDraft('url', event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="admin-field">
                <span>Tags</span>
                <input
                  type="text"
                  value={draft.tags}
                  onChange={(event) => updateDraft('tags', event.target.value)}
                  placeholder="fiction, philosophy"
                />
              </label>

              <label className="admin-field">
                <span>Internal notes</span>
                <textarea
                  className="admin-code-output admin-bookshelf-notes-input"
                  value={draft.internalNotes}
                  onChange={(event) => updateDraft('internalNotes', event.target.value)}
                  placeholder="Private admin notes"
                  rows={8}
                />
              </label>

              <div className="admin-sidepanel-actions">
                {drawerMode === 'edit' && (
                  <>
                    <button
                      className="admin-ghost-button"
                      type="button"
                      onClick={handleDeleteEntry}
                    >
                      Delete
                    </button>
                    <button
                      className="admin-ghost-button"
                      type="button"
                      onClick={handleAutoTagEntry}
                    >
                      Auto Tag
                    </button>
                  </>
                )}
                {drawerMode === 'create' && (
                  <button
                    className="admin-ghost-button"
                    type="button"
                    onClick={() => handleSaveDraft({ autoTag: true })}
                  >
                    Add + Auto Tag
                  </button>
                )}
                <button className="admin-solid-button" type="submit">
                  {drawerMode === 'create' ? 'Add' : 'Save'}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      <AdminCommandPalette
        commands={commandPaletteCommands}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSearchChange={setSidebarSearch}
        searchPlaceholder="Search books, tags, or run a command..."
        searchResultLabel={`${filteredEntries.length} matching book${filteredEntries.length !== 1 ? 's' : ''}`}
        searchValue={sidebarSearch}
      />
    </div>
  );
}

export default BookshelfWorkspace;
