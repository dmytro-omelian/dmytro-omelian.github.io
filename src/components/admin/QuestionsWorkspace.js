import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdminQuestion,
  createAdminQuestionLog,
  deleteAdminComment,
  deleteAdminQuestionLog,
  getAdminComments,
  getAdminQuestionLogs,
  getAdminQuestions,
  updateAdminQuestion,
  updateAdminQuestionLog,
} from '../../api/siteData';
import { renderMarkdownToHtml } from '../../utils/markdown';

const adminLogDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const adminCommentDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const QUESTION_PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'No priority' },
];
const QUESTION_PRIORITY_RANKS = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function sortQuestions(questions) {
  function getPriorityRank(question) {
    return QUESTION_PRIORITY_RANKS[normalizeQuestionPriority(question.priority)];
  }

  return [...questions].sort((leftQuestion, rightQuestion) => (
    Number(Boolean(leftQuestion.isArchived)) - Number(Boolean(rightQuestion.isArchived))
    || Number(Boolean(leftQuestion.isHidden)) - Number(Boolean(rightQuestion.isHidden))
    || getPriorityRank(leftQuestion) - getPriorityRank(rightQuestion)
    || Number(leftQuestion.sortOrder || 0) - Number(rightQuestion.sortOrder || 0)
    || leftQuestion.title.localeCompare(rightQuestion.title)
  ));
}

function normalizeQuestionPriority(priority) {
  const normalizedValue = String(priority || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(QUESTION_PRIORITY_RANKS, normalizedValue)
    ? normalizedValue
    : 'none';
}

function formatQuestionPriority(priority) {
  const normalizedPriority = normalizeQuestionPriority(priority);
  return QUESTION_PRIORITY_OPTIONS.find((option) => option.value === normalizedPriority)?.label || 'No priority';
}

function formatQuestionMeta(question, { includeLogFallback = false } = {}) {
  const parts = [question.isArchived ? 'Archived' : 'Open'];

  if (question.isHidden) {
    parts.push('Hidden');
  }

  if (normalizeQuestionPriority(question.priority) !== 'none') {
    parts.push(`${formatQuestionPriority(question.priority)} priority`);
  }

  if (question.logCount) {
    parts.push(`${question.logCount} logs`);
  } else if (includeLogFallback) {
    parts.push('No logs yet');
  }

  return parts.join(' · ');
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

function formatAdminCommentDate(dateValue) {
  if (!dateValue) {
    return 'Date unavailable';
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return adminCommentDateFormatter.format(parsedDate);
}

function WorkspaceSwitch({ activeWorkspace, onWorkspaceChange }) {
  return (
    <div className="admin-workspace-switch" role="tablist" aria-label="Admin workspaces">
      <button
        className={`admin-workspace-switch-button${activeWorkspace === 'readingList' ? '' : ' is-active'}`}
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
    </div>
  );
}

function QuestionsWorkspace({
  adminKeyword,
  activeWorkspace,
  onLogout,
  onWorkspaceChange,
}) {
  const [questions, setQuestions] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [logsByQuestionId, setLogsByQuestionId] = useState({});
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [noteDraft, setNoteDraft] = useState({
    loggedAt: getTodayDate(),
    noteMarkdown: '',
  });
  const [editingLogId, setEditingLogId] = useState(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) || null,
    [questions, selectedQuestionId],
  );

  const selectedQuestionLogs = selectedQuestionId ? (logsByQuestionId[selectedQuestionId] || []) : [];
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

  async function loadComments(keyword = adminKeyword) {
    if (!keyword) {
      return false;
    }

    setIsLoadingComments(true);
    setWorkspaceError('');

    try {
      const nextComments = await getAdminComments(keyword);
      setComments(nextComments);
      return true;
    } catch (error) {
      setWorkspaceError(error.message);
      return false;
    } finally {
      setIsLoadingComments(false);
    }
  }

  useEffect(() => {
    if (!adminKeyword) {
      return;
    }

    loadQuestions(adminKeyword);
    loadComments(adminKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKeyword]);

  useEffect(() => {
    if (!adminKeyword || !selectedQuestionId || logsByQuestionId[selectedQuestionId]) {
      return;
    }

    loadLogs(selectedQuestionId, adminKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKeyword, selectedQuestionId, logsByQuestionId]);

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
        isHidden: false,
        priority: 'none',
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
        isHidden: selectedQuestion.isHidden,
        priority: normalizeQuestionPriority(selectedQuestion.priority),
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

  async function handleDeleteComment(commentId) {
    setWorkspaceError('');
    setStatusMessage('');

    try {
      await deleteAdminComment(adminKeyword, commentId);
      setComments((currentComments) => currentComments.filter((comment) => comment.id !== commentId));
      setStatusMessage('Comment deleted.');
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
            <h1>Questions</h1>
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
                {formatQuestionMeta(question)}
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
                <p className="admin-side-note">{formatQuestionMeta(selectedQuestion, { includeLogFallback: true })}</p>
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
              <label className="admin-field admin-field-compact">
                <span>Priority</span>
                <select
                  value={normalizeQuestionPriority(selectedQuestion.priority)}
                  onChange={(event) => handleQuestionFieldChange('priority', event.target.value)}
                >
                  {QUESTION_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-inline-fields">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={selectedQuestion.isArchived}
                  onChange={(event) => handleQuestionFieldChange('isArchived', event.target.checked)}
                />
                <span>Archived</span>
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(selectedQuestion.isHidden)}
                  onChange={(event) => handleQuestionFieldChange('isHidden', event.target.checked)}
                />
                <span>Hidden from public</span>
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
                {formatQuestionMeta(selectedQuestion, { includeLogFallback: true })}
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

        <div className="admin-workspace-stack">
          {!selectedQuestion && (
            <section className="admin-empty-state">
              <p>Select a question on the left or create a new one.</p>
            </section>
          )}

          {selectedQuestion && (
            <>
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
            </>
          )}

          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-header">
              <div>
                <h3>Blog comments</h3>
                <p className="admin-side-note">
                  {comments.length} loaded · delete here to remove them from the database
                </p>
              </div>
              <button
                className="admin-ghost-button"
                type="button"
                onClick={() => loadComments(adminKeyword)}
              >
                Refresh comments
              </button>
            </div>

            <div className="admin-comment-list">
              {comments.map((comment) => (
                <article className="admin-comment-item" key={comment.id}>
                  <div className="admin-comment-item-header">
                    <div>
                      <p className="admin-log-label">
                        <a
                          className="admin-comment-slug-link"
                          href={`/blog/${comment.postSlug}#discussion`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          /blog/{comment.postSlug}
                        </a>
                      </p>
                      <p className="admin-comment-meta">
                        {comment.displayName} · {formatAdminCommentDate(comment.createdAt)}
                      </p>
                      <p className="admin-comment-email">
                        {comment.authorEmail ? `Email: ${comment.authorEmail}` : 'Email not provided'}
                      </p>
                    </div>
                    <button
                      className="admin-ghost-button"
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  </div>

                  <p className="admin-comment-body">{comment.body}</p>
                </article>
              ))}

              {!isLoadingComments && comments.length === 0 && (
                <p className="admin-side-note">No blog comments yet.</p>
              )}
              {isLoadingComments && <p className="admin-side-note">Loading comments...</p>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default QuestionsWorkspace;
