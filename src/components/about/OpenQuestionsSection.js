import React, { useEffect, useState } from 'react';
import './OpenQuestionsSection.css';
import { getPublicQuestionLogs, getPublicQuestions } from '../../api/siteData';
import TallyEmbed, { COLLABORATE_FORM_URL } from '../forms/TallyEmbed';
import { renderMarkdownToHtml } from '../../utils/markdown';

const logDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

function parseLogDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }

  const rawValue = String(dateValue).trim();

  if (!rawValue) {
    return null;
  }

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? new Date(`${rawValue}T00:00:00`)
    : new Date(rawValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatLogDate(dateValue) {
  const parsedDate = parseLogDate(dateValue);
  return parsedDate ? logDateFormatter.format(parsedDate) : 'Date unavailable';
}

function OpenQuestionsSection() {
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [archivedQuestions, setArchivedQuestions] = useState([]);
  const [questionsError, setQuestionsError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionLogs, setQuestionLogs] = useState([]);
  const [logsError, setLogsError] = useState('');
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isCollaborateOpen, setIsCollaborateOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      getPublicQuestions(false),
      getPublicQuestions(true),
    ])
      .then(([nextActiveQuestions, nextArchivedQuestions]) => {
        if (!isActive) {
          return;
        }

        setActiveQuestions(nextActiveQuestions);
        setArchivedQuestions(nextArchivedQuestions);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setQuestionsError(error.message);
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleQuestionClick(question) {
    setSelectedQuestion(question);
    setQuestionLogs([]);
    setLogsError('');
    setIsLogsLoading(true);

    try {
      const payload = await getPublicQuestionLogs(question.id);
      setQuestionLogs(payload.logs || []);
    } catch (error) {
      setLogsError(error.message);
    } finally {
      setIsLogsLoading(false);
    }
  }

  function closeLogsModal() {
    setSelectedQuestion(null);
    setQuestionLogs([]);
    setLogsError('');
    setIsLogsLoading(false);
  }

  const currentQuestions = showArchived ? archivedQuestions : activeQuestions;

  return (
    <>
      <section className="questions-panel">
        <div className="questions-panel-header">
          <div className="questions-heading-block">
            <div className="questions-heading-nav" role="tablist" aria-label="Question collections">
              <button
                className={`questions-heading-link${showArchived ? '' : ' is-active'}`}
                type="button"
                onClick={() => setShowArchived(false)}
              >
                Open questions
              </button>
              <span className="questions-heading-separator" aria-hidden="true">|</span>
              <button
                className={`questions-heading-link${showArchived ? ' is-active' : ''}`}
                type="button"
                onClick={() => setShowArchived(true)}
              >
                Archive
              </button>
            </div>
          </div>
        </div>

        {questionsError && <p className="questions-error">{questionsError}</p>}

        <ul className="questions-list">
          {currentQuestions.map((question) => (
            <li className="question-item" key={question.id}>
              <button
                className="question-trigger"
                type="button"
                onClick={() => handleQuestionClick(question)}
              >
                {question.title}
              </button>
            </li>
          ))}
        </ul>

        {!questionsError && currentQuestions.length === 0 && (
          <p className="questions-empty">
            {showArchived ? 'Nothing archived yet.' : 'No public questions yet.'}
          </p>
        )}

        {!showArchived && (
          <div className="questions-footer">
            <button
              className="questions-collaborate-link"
              type="button"
              onClick={() => setIsCollaborateOpen(true)}
            >
              Collaborate
            </button>
          </div>
        )}
      </section>

      {selectedQuestion && (
        <div
          className="questions-modal-backdrop"
          role="presentation"
          onClick={closeLogsModal}
        >
          <div
            className="questions-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-log-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="questions-modal-header">
              <div>
                <p className="questions-eyebrow">Question log</p>
                <h3 id="question-log-title">{selectedQuestion.title}</h3>
              </div>
              <button
                className="questions-close-button"
                type="button"
                onClick={closeLogsModal}
              >
                Close
              </button>
            </div>

            {isLogsLoading && <p className="questions-empty">Loading logs...</p>}
            {logsError && <p className="questions-error">{logsError}</p>}

            {!isLogsLoading && !logsError && questionLogs.length === 0 && (
              <p className="questions-empty">No logs yet for this question.</p>
            )}

            <div className="questions-log-list">
              {questionLogs.map((log) => (
                <article className="questions-log-card" key={log.id}>
                  <p className="questions-log-date">{formatLogDate(log.loggedAt)}</p>
                  <div
                    className="questions-log-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(log.noteMarkdown) }}
                  />
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCollaborateOpen && (
        <div
          className="questions-modal-backdrop"
          role="presentation"
          onClick={() => setIsCollaborateOpen(false)}
        >
          <div
            className="questions-modal questions-modal-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collaborate-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="questions-modal-header">
              <div>
                <p className="questions-eyebrow">Collaborate</p>
                <h3 id="collaborate-title">Let&apos;s work on one of these together</h3>
              </div>
              <button
                className="questions-close-button"
                type="button"
                onClick={() => setIsCollaborateOpen(false)}
              >
                Close
              </button>
            </div>

            <TallyEmbed
              className="questions-collaborate-embed"
              formUrl={COLLABORATE_FORM_URL}
              height={420}
              title="Collaborate"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default OpenQuestionsSection;
