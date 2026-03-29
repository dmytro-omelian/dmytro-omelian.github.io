import React, { useEffect, useState } from 'react';
import { createPublicComment, getPublicComments } from '../../api/siteData';
import './PostComments.css';

const commentDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const DEFAULT_VISIBLE_COMMENTS = 5;

export function DiscussionIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.36 0-2.65-.32-3.79-.88L3 21l1.96-5.18A8.46 8.46 0 0 1 3.5 11.5 8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

export function formatDiscussionLabel(commentCount) {
  const safeCommentCount = Number.isFinite(commentCount) && commentCount >= 0
    ? Math.floor(commentCount)
    : 0;
  const suffix = safeCommentCount === 1 ? 'comment' : 'comments';
  return `${safeCommentCount} ${suffix}`;
}

function formatCommentDate(createdAt) {
  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Recently';
  }

  return commentDateFormatter.format(parsedDate);
}

function CommentsEmptyState() {
  return (
    <div className="discussion-empty-state">
      <p>No comments yet.</p>
    </div>
  );
}

function CommentList({ comments, isExpanded, onShowMore }) {
  if (comments.length === 0) {
    return <CommentsEmptyState />;
  }

  const visibleComments = isExpanded
    ? comments
    : comments.slice(0, DEFAULT_VISIBLE_COMMENTS);
  const shouldShowMoreButton = !isExpanded && comments.length > DEFAULT_VISIBLE_COMMENTS;

  return (
    <div className="discussion-list-wrap">
      <div className="discussion-list">
        {visibleComments.map((comment) => (
          <article className="discussion-item" key={comment.id}>
            <div className="discussion-item-header">
              <p className="discussion-item-author">{comment.displayName || 'Anonymous'}</p>
              <p className="discussion-item-date">{formatCommentDate(comment.createdAt)}</p>
            </div>
            <p className="discussion-item-body">{comment.body}</p>
          </article>
        ))}
      </div>

      {shouldShowMoreButton && (
        <button
          className="discussion-show-more"
          type="button"
          onClick={onShowMore}
        >
          Show more
        </button>
      )}
    </div>
  );
}

function CommentForm({
  formState,
  isSubmitting,
  isShowingEmailField,
  onFieldChange,
  onSubmit,
  onToggleEmailField,
  errorMessage,
  successMessage,
}) {
  return (
    <form className="discussion-form" onSubmit={onSubmit}>
      <div className="discussion-form-header">
        <button
          className="discussion-email-toggle"
          type="button"
          onClick={onToggleEmailField}
        >
          {isShowingEmailField ? 'Hide email' : 'Add email'}
        </button>
      </div>

      <div className="discussion-form-grid">
        <input
          className="discussion-input"
          type="text"
          value={formState.authorName}
          maxLength={80}
          onChange={(event) => onFieldChange('authorName', event.target.value)}
          placeholder="Name"
          aria-label="Name"
        />

        {isShowingEmailField && (
          <input
            className="discussion-input"
            type="email"
            value={formState.authorEmail}
            maxLength={254}
            onChange={(event) => onFieldChange('authorEmail', event.target.value)}
            placeholder="Email"
            aria-label="Email"
          />
        )}
      </div>

      <textarea
        className="discussion-textarea"
        rows="5"
        value={formState.body}
        maxLength={5000}
        onChange={(event) => onFieldChange('body', event.target.value)}
        placeholder="Comment"
        aria-label="Comment"
        required
      />

      {errorMessage && <p className="discussion-feedback discussion-feedback-error">{errorMessage}</p>}
      {!errorMessage && successMessage && (
        <p className="discussion-feedback discussion-feedback-success">{successMessage}</p>
      )}

      <div className="discussion-submit-row">
        <button className="discussion-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post comment'}
        </button>
      </div>
    </form>
  );
}

function PostComments({ postSlug, postTitle, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShowingEmailField, setIsShowingEmailField] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formState, setFormState] = useState({
    authorName: '',
    authorEmail: '',
    body: '',
  });

  useEffect(() => {
    let isActive = true;

    setIsLoadingComments(true);
    setIsExpanded(false);
    setErrorMessage('');
    setSuccessMessage('');

    getPublicComments(postSlug)
      .then((nextComments) => {
        if (!isActive) {
          return;
        }

        setComments(nextComments);
        if (typeof onCountChange === 'function') {
          onCountChange(nextComments.length);
        }
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || 'Failed to load comments.');
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingComments(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [onCountChange, postSlug]);

  function handleFieldChange(fieldName, value) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [fieldName]: value,
    }));
  }

  function handleToggleEmailField() {
    setSuccessMessage('');
    setErrorMessage('');
    setIsShowingEmailField((currentValue) => {
      if (currentValue) {
        setFormState((currentFormState) => ({
          ...currentFormState,
          authorEmail: '',
        }));
      }

      return !currentValue;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = await createPublicComment(postSlug, {
        postTitle,
        authorName: formState.authorName,
        authorEmail: isShowingEmailField ? formState.authorEmail : '',
        body: formState.body,
      });

      const nextComments = [payload.comment, ...comments];
      setComments(nextComments);
      setFormState({
        authorName: '',
        authorEmail: '',
        body: '',
      });
      setIsShowingEmailField(false);
      setSuccessMessage('Comment posted.');

      if (typeof onCountChange === 'function') {
        onCountChange(nextComments.length);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="discussion-section" id="discussion">
      <div className="discussion-header">
        <div className="discussion-title-wrap">
          <span className="discussion-icon-chip" aria-hidden="true">
            <DiscussionIcon className="discussion-title-icon" />
          </span>
          <h2>{formatDiscussionLabel(comments.length)}</h2>
        </div>
        {isLoadingComments && <span className="discussion-loading-copy">Loading...</span>}
      </div>

      {!isLoadingComments && (
        <CommentList
          comments={comments}
          isExpanded={isExpanded}
          onShowMore={() => setIsExpanded(true)}
        />
      )}

      <CommentForm
        formState={formState}
        isSubmitting={isSubmitting}
        isShowingEmailField={isShowingEmailField}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        onToggleEmailField={handleToggleEmailField}
        errorMessage={errorMessage}
        successMessage={successMessage}
      />
    </section>
  );
}

export default PostComments;
