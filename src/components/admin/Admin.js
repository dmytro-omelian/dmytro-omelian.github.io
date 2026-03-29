import React, { useEffect, useMemo, useState } from 'react';
import './Admin.css';
import {
  createAdminQuestion,
  createAdminQuestionLog,
  deleteAdminQuestionLog,
  getAdminQuestionLogs,
  getAdminQuestions,
  updateAdminQuestion,
  updateAdminQuestionLog,
} from '../../api/siteData';
import { renderMarkdownToHtml } from '../../utils/markdown';

const ADMIN_SESSION_KEY = 'site_admin_keyword_v2';
const adminLogDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

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

function sortQuestions(questions) {
  return [...questions].sort((leftQuestion, rightQuestion) => (
    Number(leftQuestion.isArchived) - Number(rightQuestion.isArchived)
    || leftQuestion.sortOrder - rightQuestion.sortOrder
    || leftQuestion.title.localeCompare(rightQuestion.title)
  ));
}

function formatAdminLogDate(dateValue) {
  if (!dateValue) {
    return 'Date unavailable';
  }

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(`${dateValue}T00:00:00`)
    : new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return adminLogDateFormatter.format(parsedDate);
}

function normalizeLogDateValue(dateValue) {
  if (!dateValue) {
    return '';
  }

  const rawValue = String(dateValue).trim();
  const leadingIsoDateMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);

  if (leadingIsoDateMatch) {
    return leadingIsoDateMatch[1];
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toISOString().slice(0, 10);
}

function normalizeLogForUi(log) {
  return {
    ...log,
    loggedAt: normalizeLogDateValue(log.loggedAt),
  };
}

function Admin() {
  const [keywordInput, setKeywordInput] = useState('');
  const [adminKeyword, setAdminKeyword] = useState(getStoredKeyword);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [logsByQuestionId, setLogsByQuestionId] = useState({});
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [noteDraft, setNoteDraft] = useState({
    loggedAt: getTodayDate(),
    noteMarkdown: '',
  });
  const [editingLogId, setEditingLogId] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [authError, setAuthError] = useState('');
  const [workspaceError, setWorkspaceError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) || null,
    [questions, selectedQuestionId],
  );

  const selectedQuestionLogs = selectedQuestionId ? (logsByQuestionId[selectedQuestionId] || []) : [];
  const hasAuthenticatedSession = Boolean(adminKeyword);
  const isEditingNote = editingLogId !== null;

  function resetNoteDraft() {
    setNoteDraft({
      loggedAt: getTodayDate(),
      noteMarkdown: '',
    });
    setEditingLogId(null);
  }

  async function loadQuestions(keyword = adminKeyword, preferredQuestionId = selectedQuestionId) {
    if (!keyword) {
      return false;
    }

    setIsLoadingQuestions(true);
    setWorkspaceError('');

    try {
      const nextQuestions = sortQuestions(await getAdminQuestions(keyword));
      setQuestions(nextQuestions);
      setSelectedQuestionId((currentQuestionId) => {
        const candidateId = preferredQuestionId || currentQuestionId;

        if (candidateId && nextQuestions.some((question) => question.id === candidateId)) {
          return candidateId;
        }

        return nextQuestions[0]?.id || null;
      });

      return true;
    } catch (error) {
      setWorkspaceError(error.message);
      return false;
    } finally {
      setIsLoadingQuestions(false);
    }
  }

  async function loadLogs(questionId, keyword = adminKeyword) {
    if (!keyword || !questionId) {
      return false;
    }

    setIsLoadingLogs(true);
    setWorkspaceError('');

    try {
      const payload = await getAdminQuestionLogs(keyword, questionId);
      setLogsByQuestionId((currentLogsByQuestionId) => ({
        ...currentLogsByQuestionId,
        [questionId]: (payload.logs || []).map(normalizeLogForUi),
      }));
      return true;
    } catch (error) {
      setWorkspaceError(error.message);
      return false;
    } finally {
      setIsLoadingLogs(false);
    }
  }

  useEffect(() => {
    if (!adminKeyword) {
      return;
    }

    loadQuestions(adminKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKeyword]);

  useEffect(() => {
    if (!adminKeyword || !selectedQuestionId || logsByQuestionId[selectedQuestionId]) {
      return;
    }

    loadLogs(selectedQuestionId, adminKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKeyword, selectedQuestionId]);

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
      const nextQuestions = sortQuestions(await getAdminQuestions(trimmedKeyword));
      storeKeyword(trimmedKeyword);
      setAdminKeyword(trimmedKeyword);
      setQuestions(nextQuestions);
      setSelectedQuestionId(nextQuestions[0]?.id || null);
      setLogsByQuestionId({});
      setKeywordInput('');
      resetNoteDraft();
      setWorkspaceError('');
      setStatusMessage('');
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
    setQuestions([]);
    setSelectedQuestionId(null);
    setLogsByQuestionId({});
    setNewQuestionTitle('');
    resetNoteDraft();
    setStatusMessage('');
    setWorkspaceError('');
    setAuthError('');
  }

  function handleQuestionFieldChange(fieldName, value) {
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      question.id === selectedQuestionId
        ? {
          ...question,
          [fieldName]: value,
        }
        : question
    )));
  }

  async function handleCreateQuestion() {
    const trimmedTitle = newQuestionTitle.trim();

    if (!trimmedTitle) {
      setWorkspaceError('Enter a question title first.');
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');

    const sortOrder = questions.length === 0
      ? 0
      : Math.max(...questions.map((question) => Number(question.sortOrder) || 0)) + 1;

    try {
      const payload = await createAdminQuestion(adminKeyword, {
        title: trimmedTitle,
        sortOrder,
      });

      const nextQuestion = payload.question;
      const nextQuestions = sortQuestions([...questions, nextQuestion]);

      setQuestions(nextQuestions);
      setSelectedQuestionId(nextQuestion.id);
      setLogsByQuestionId((currentLogsByQuestionId) => ({
        ...currentLogsByQuestionId,
        [nextQuestion.id]: [],
      }));
      setNewQuestionTitle('');
      setStatusMessage('Question added.');
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function handleSaveQuestion() {
    if (!selectedQuestion) {
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');

    try {
      const payload = await updateAdminQuestion(adminKeyword, selectedQuestion.id, {
        title: selectedQuestion.title,
        sortOrder: selectedQuestion.sortOrder,
        isArchived: selectedQuestion.isArchived,
      });

      const nextQuestion = payload.question;
      setQuestions((currentQuestions) => sortQuestions(currentQuestions.map((question) => (
        question.id === nextQuestion.id ? nextQuestion : question
      ))));
      setSelectedQuestionId(nextQuestion.id);
      setStatusMessage('Question saved.');
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function handleSelectQuestion(questionId) {
    setSelectedQuestionId(questionId);
    resetNoteDraft();

    if (logsByQuestionId[questionId]) {
      return;
    }

    await loadLogs(questionId, adminKeyword);
  }

  function handleEditLog(log) {
    setEditingLogId(log.id);
    setNoteDraft({
      loggedAt: log.loggedAt || getTodayDate(),
      noteMarkdown: log.noteMarkdown || '',
    });
    setWorkspaceError('');
    setStatusMessage('');
  }

  async function handleSaveNote() {
    if (!selectedQuestionId) {
      setWorkspaceError('Select a question first.');
      return;
    }

    if (!noteDraft.noteMarkdown.trim()) {
      setWorkspaceError('Write a note before saving it.');
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');

    try {
      if (isEditingNote) {
        const payload = await updateAdminQuestionLog(adminKeyword, editingLogId, noteDraft);
        const nextLog = normalizeLogForUi(payload.log);

        setLogsByQuestionId((currentLogsByQuestionId) => ({
          ...currentLogsByQuestionId,
          [selectedQuestionId]: (currentLogsByQuestionId[selectedQuestionId] || []).map((currentLog) => (
            currentLog.id === nextLog.id ? nextLog : currentLog
          )),
        }));
        setStatusMessage('Note updated.');
      } else {
        const payload = await createAdminQuestionLog(adminKeyword, selectedQuestionId, noteDraft);
        const nextLog = normalizeLogForUi(payload.log);

        setLogsByQuestionId((currentLogsByQuestionId) => ({
          ...currentLogsByQuestionId,
          [selectedQuestionId]: [nextLog, ...(currentLogsByQuestionId[selectedQuestionId] || [])],
        }));
        setStatusMessage('Note added.');
      }

      resetNoteDraft();
      loadQuestions(adminKeyword, selectedQuestionId);
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function handleDeleteLog(logId) {
    setWorkspaceError('');
    setStatusMessage('');

    try {
      await deleteAdminQuestionLog(adminKeyword, logId);
      setLogsByQuestionId((currentLogsByQuestionId) => ({
        ...currentLogsByQuestionId,
        [selectedQuestionId]: (currentLogsByQuestionId[selectedQuestionId] || []).filter((log) => log.id !== logId),
      }));
      if (editingLogId === logId) {
        resetNoteDraft();
      }
      setStatusMessage('Log deleted.');
      loadQuestions(adminKeyword, selectedQuestionId);
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  if (!hasAuthenticatedSession) {
    return (
      <div className="admin-auth-screen">
        <form className="admin-login-card" onSubmit={handleLoginSubmit}>
          <p className="admin-login-label">Admin</p>
          <h1>Enter keyword</h1>
          <p className="admin-login-copy">
            Private access for editing open questions and notes.
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

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div>
            <p className="admin-sidebar-label">Admin</p>
            <h1>Questions</h1>
          </div>
          <button
            className="admin-ghost-button"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="admin-create-question">
          <input
            type="text"
            value={newQuestionTitle}
            onChange={(event) => setNewQuestionTitle(event.target.value)}
            placeholder="New question"
          />
          <button
            className="admin-solid-button"
            type="button"
            onClick={handleCreateQuestion}
          >
            Add
          </button>
        </div>

        <div className="admin-question-list">
          {questions.map((question) => (
            <button
              key={question.id}
              className={`admin-question-item${question.id === selectedQuestionId ? ' is-active' : ''}`}
              type="button"
              onClick={() => handleSelectQuestion(question.id)}
            >
              <span className="admin-question-row">
                <span className="admin-question-title">{question.title}</span>
                {question.id === selectedQuestionId && (
                  <span className="admin-question-badge">Selected</span>
                )}
              </span>
              <span className="admin-question-meta">
                {question.isArchived ? 'Archived' : 'Open'}
                {question.logCount ? ` · ${question.logCount} logs` : ''}
              </span>
            </button>
          ))}

          {isLoadingQuestions && <p className="admin-side-note">Loading questions...</p>}
          {!isLoadingQuestions && questions.length === 0 && <p className="admin-side-note">No questions yet.</p>}
        </div>

        {selectedQuestion && (
          <section className="admin-sidebar-panel">
            <div className="admin-panel-header">
              <div>
                <p className="admin-sidebar-label">Selected question</p>
                <h2 className="admin-sidebar-panel-title">{selectedQuestion.title}</h2>
              </div>
              <button
                className="admin-solid-button"
                type="button"
                onClick={handleSaveQuestion}
              >
                Save
              </button>
            </div>

            <label className="admin-field">
              <span>Title</span>
              <input
                type="text"
                value={selectedQuestion.title}
                onChange={(event) => handleQuestionFieldChange('title', event.target.value)}
              />
            </label>

            <div className="admin-inline-fields">
              <label className="admin-field admin-field-compact">
                <span>Order</span>
                <input
                  type="number"
                  value={selectedQuestion.sortOrder}
                  onChange={(event) => handleQuestionFieldChange('sortOrder', event.target.value)}
                />
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={selectedQuestion.isArchived}
                  onChange={(event) => handleQuestionFieldChange('isArchived', event.target.checked)}
                />
                <span>Archived</span>
              </label>
            </div>
          </section>
        )}
      </aside>

      <main className="admin-workspace">
        <div className="admin-workspace-header">
          <div>
            <p className="admin-sidebar-label">Selected question</p>
            <h2>{selectedQuestion ? selectedQuestion.title : 'Select a question'}</h2>
            {selectedQuestion && (
              <p className="admin-side-note">
                {selectedQuestion.isArchived ? 'Archived' : 'Open'}
                {selectedQuestion.logCount ? ` · ${selectedQuestion.logCount} logs` : ' · No logs yet'}
              </p>
            )}
          </div>
          <div className="admin-top-actions">
            <button
              className="admin-ghost-button"
              type="button"
              onClick={() => loadQuestions(adminKeyword, selectedQuestionId)}
            >
              Refresh
            </button>
          </div>
        </div>

        {(workspaceError || statusMessage) && (
          <div className="admin-feedback">
            {workspaceError && <p className="admin-feedback-error">{workspaceError}</p>}
            {!workspaceError && statusMessage && <p className="admin-feedback-success">{statusMessage}</p>}
          </div>
        )}

        {!selectedQuestion && (
          <section className="admin-empty-state">
            <p>Select a question on the left or create a new one.</p>
          </section>
        )}

        {selectedQuestion && (
          <div className="admin-workspace-stack">
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>{isEditingNote ? 'Edit note' : 'New note'}</h3>
                  <p className="admin-side-note">Markdown works here, including images by URL.</p>
                </div>
                <div className="admin-panel-actions">
                  {isEditingNote && (
                    <button
                      className="admin-ghost-button"
                      type="button"
                      onClick={resetNoteDraft}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    className="admin-solid-button"
                    type="button"
                    onClick={handleSaveNote}
                  >
                    {isEditingNote ? 'Update note' : 'Save note'}
                  </button>
                </div>
              </div>

              <div className="admin-note-grid">
                <div className="admin-note-editor-pane">
                  <label className="admin-field admin-field-compact">
                    <span>Date</span>
                    <input
                      type="date"
                      value={noteDraft.loggedAt}
                      onChange={(event) => setNoteDraft((currentLog) => ({
                        ...currentLog,
                        loggedAt: event.target.value,
                      }))}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Markdown</span>
                    <textarea
                      rows="10"
                      value={noteDraft.noteMarkdown}
                      onChange={(event) => setNoteDraft((currentLog) => ({
                        ...currentLog,
                        noteMarkdown: event.target.value,
                      }))}
                      placeholder="Write a note. Use Markdown, including ![Alt text](https://example.com/image.jpg)."
                    />
                  </label>
                </div>

                <div className="admin-note-preview-pane">
                  <p className="admin-log-label">Preview</p>
                  <div
                    className="admin-preview admin-preview-note"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(noteDraft.noteMarkdown || 'Preview.') }}
                  />
                </div>
              </div>
            </section>

            <section className="admin-panel admin-panel-wide">
              <div className="admin-panel-header">
                <h3>Notes</h3>
                {isLoadingLogs && <span className="admin-side-note">Loading...</span>}
              </div>

              <div className="admin-log-list">
                {selectedQuestionLogs.map((log, index) => (
                  <article className="admin-log-item" key={log.id}>
                    <div className="admin-log-item-header">
                      <div>
                        <p className="admin-log-label">Note {selectedQuestionLogs.length - index}</p>
                        <p className="admin-log-display-date">{formatAdminLogDate(log.loggedAt)}</p>
                      </div>
                      <div className="admin-panel-actions">
                        <button
                          className="admin-ghost-button"
                          type="button"
                          onClick={() => handleEditLog(log)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-ghost-button"
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="admin-log-preview-wrap">
                      <div
                        className="admin-preview admin-preview-note admin-preview-note-compact"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(log.noteMarkdown) }}
                      />
                    </div>
                  </article>
                ))}

                {!isLoadingLogs && selectedQuestionLogs.length === 0 && (
                  <p className="admin-side-note">No notes yet for this question.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default Admin;
