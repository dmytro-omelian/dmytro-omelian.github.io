import React, { useState } from 'react';
import './Admin.css';
import { getAdminReadingList } from '../../api/siteData';
import BookshelfWorkspace from './BookshelfWorkspace';
import ReadingListWorkspace from './ReadingListWorkspace';

const ADMIN_SESSION_KEY = 'site_admin_keyword_v2';
const DEFAULT_ADMIN_WORKSPACE = 'readingList';

function getStoredKeyword() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
}

function clearStoredKeyword() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function storeKeyword(keyword) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ADMIN_SESSION_KEY, keyword);
}

function Admin() {
  const [keywordInput, setKeywordInput] = useState('');
  const [adminKeyword, setAdminKeyword] = useState(getStoredKeyword);
  const [activeWorkspace, setActiveWorkspace] = useState(DEFAULT_ADMIN_WORKSPACE);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const hasAuthenticatedSession = Boolean(adminKeyword);

  async function handleLoginSubmit(event) {
    event.preventDefault();

    const trimmedKeyword = keywordInput.trim();

    if (!trimmedKeyword) {
      setAuthError('Enter the keyword.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');

    try {
      await getAdminReadingList(trimmedKeyword);
      storeKeyword(trimmedKeyword);
      setAdminKeyword(trimmedKeyword);
      setKeywordInput('');
      setActiveWorkspace(DEFAULT_ADMIN_WORKSPACE);
    } catch (error) {
      clearStoredKeyword();
      setAuthError('Keyword is invalid.');
    } finally {
      setIsAuthenticating(false);
    }
  }

  function handleLogout() {
    clearStoredKeyword();
    setAdminKeyword('');
    setActiveWorkspace(DEFAULT_ADMIN_WORKSPACE);
    setAuthError('');
  }

  if (!hasAuthenticatedSession) {
    return (
      <div className="admin-auth-screen">
        <form className="admin-login-card" onSubmit={handleLoginSubmit}>
          <p className="admin-login-label">Admin</p>
          <h1>Enter keyword</h1>
          <p className="admin-login-copy">
            Private access for editing reading list entries and bookshelf notes.
          </p>

          <label className="admin-input-group">
            <span>Keyword</span>
            <input
              type="password"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="Enter keyword"
              autoFocus
            />
          </label>

          {authError && <p className="admin-auth-error">{authError}</p>}

          <button
            className="admin-login-button"
            type="submit"
            disabled={isAuthenticating}
          >
            {isAuthenticating ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    );
  }

  if (activeWorkspace === 'bookshelf') {
    return (
      <BookshelfWorkspace
        adminKeyword={adminKeyword}
        activeWorkspace={activeWorkspace}
        onLogout={handleLogout}
        onWorkspaceChange={setActiveWorkspace}
      />
    );
  }

  return (
    <ReadingListWorkspace
      adminKeyword={adminKeyword}
      activeWorkspace={activeWorkspace}
      onLogout={handleLogout}
      onWorkspaceChange={setActiveWorkspace}
    />
  );
}

export default Admin;
