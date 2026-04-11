import React, { useState } from 'react';
import { loginAdminTwitterUser } from '../../api/siteData';

const DEFAULT_FORM_STATE = {
  userName: '',
  email: '',
  password: '',
  proxy: '',
  totpSecret: '',
};

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
        className={`admin-workspace-switch-button${activeWorkspace === 'twitter' ? ' is-active' : ''}`}
        type="button"
        onClick={() => onWorkspaceChange('twitter')}
      >
        Twitter
      </button>
    </div>
  );
}

function TwitterWorkspace({
  adminKeyword,
  activeWorkspace,
  onLogout,
  onWorkspaceChange,
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loginResponse, setLoginResponse] = useState(null);

  function handleFieldChange(fieldName, value) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [fieldName]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const userName = String(formState.userName || '').trim();
    const email = String(formState.email || '').trim();
    const password = String(formState.password || '');
    const proxy = String(formState.proxy || '').trim();
    const totpSecret = String(formState.totpSecret || '').trim();

    if (!userName || !email || !password.trim() || !proxy) {
      setWorkspaceError('Username, email, password, and proxy are required.');
      return;
    }

    setWorkspaceError('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      const response = await loginAdminTwitterUser(adminKeyword, {
        userName,
        email,
        password,
        proxy,
        ...(totpSecret ? { totpSecret } : {}),
      });

      setLoginResponse(response);
      setStatusMessage(
        String(response?.status || '').trim().toLowerCase() === 'success'
          ? 'Twitter login succeeded.'
          : 'Twitter login request completed.',
      );
      setFormState((currentFormState) => ({
        ...currentFormState,
        password: '',
      }));
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div>
            <p className="admin-sidebar-label">Admin</p>
            <h1>Twitter</h1>
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
          <p className="admin-side-note">
            This tool calls `POST /twitter/user_login_v2` through your server and returns `login_cookie`,
            `status`, and `msg`.
          </p>
          <p className="admin-side-note">
            `totp_secret` is optional in the form, but recommended for more stable logins and lower ban risk.
          </p>
        </section>
      </aside>

      <section className="admin-workspace">
        <header className="admin-workspace-header">
          <div>
            <p className="admin-sidebar-label">Twitter API</p>
            <h2>Log in v2</h2>
          </div>
        </header>

        <div className="admin-workspace-stack">
          <form className="admin-panel" onSubmit={handleSubmit}>
            <h3>Credentials</h3>
            <div className="admin-field-grid">
              <label className="admin-field">
                <span>Username (`user_name`)</span>
                <input
                  type="text"
                  value={formState.userName}
                  onChange={(event) => handleFieldChange('userName', event.target.value)}
                  placeholder="twitter_username"
                  autoComplete="off"
                />
              </label>

              <label className="admin-field">
                <span>Email</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => handleFieldChange('email', event.target.value)}
                  placeholder="user@example.com"
                  autoComplete="off"
                />
              </label>

              <label className="admin-field">
                <span>Password</span>
                <input
                  type="password"
                  value={formState.password}
                  onChange={(event) => handleFieldChange('password', event.target.value)}
                  placeholder="Account password"
                  autoComplete="off"
                />
              </label>

              <label className="admin-field">
                <span>Proxy</span>
                <input
                  type="text"
                  value={formState.proxy}
                  onChange={(event) => handleFieldChange('proxy', event.target.value)}
                  placeholder="http://username:password@ip:port"
                  autoComplete="off"
                />
              </label>

              <label className="admin-field">
                <span>TOTP Secret (`totp_secret`)</span>
                <input
                  type="text"
                  value={formState.totpSecret}
                  onChange={(event) => handleFieldChange('totpSecret', event.target.value)}
                  placeholder="Optional 2FA secret key"
                  autoComplete="off"
                />
                <p className="admin-field-hint">
                  This is your Twitter/X 2FA secret key. In Twitter/X, enable 2FA, choose
                  &quot;can&apos;t scan the QR code&quot;, then copy the 10+ character key shown there.
                  Providing it makes login more reliable.
                </p>
              </label>
            </div>

            {workspaceError && <p className="admin-feedback-error">{workspaceError}</p>}
            {statusMessage && <p className="admin-feedback-success">{statusMessage}</p>}

            <div className="admin-panel-actions">
              <button
                className="admin-solid-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Log in to Twitter'}
              </button>
            </div>
          </form>

          {loginResponse && (
            <section className="admin-panel">
              <h3>Login response</h3>
              <p className="admin-side-note">
                Status: {loginResponse.status || 'unknown'}
              </p>
              <p className="admin-side-note">
                Message: {loginResponse.msg || 'No message'}
              </p>
              <label className="admin-field">
                <span>Login cookie</span>
                <textarea
                  className="admin-code-output"
                  value={loginResponse.loginCookie || ''}
                  readOnly
                />
              </label>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

export default TwitterWorkspace;
