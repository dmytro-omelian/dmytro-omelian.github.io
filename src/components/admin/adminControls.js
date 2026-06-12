import React, { useEffect, useMemo, useRef, useState } from 'react';

export const ADMIN_WORKSPACES = [
  { value: 'readingList', label: 'Reading list' },
  { value: 'bookshelf', label: 'Bookshelf' },
];

export function AdminWorkspaceSwitch({ activeWorkspace, onWorkspaceChange }) {
  return (
    <div className="admin-workspace-switch" role="tablist" aria-label="Admin workspaces">
      {ADMIN_WORKSPACES.map((workspace) => (
        <button
          className={`admin-workspace-switch-button${activeWorkspace === workspace.value ? ' is-active' : ''}`}
          key={workspace.value}
          type="button"
          onClick={() => onWorkspaceChange(workspace.value)}
        >
          {workspace.label}
        </button>
      ))}
    </div>
  );
}

function getMcpEndpoint() {
  if (typeof window === 'undefined') {
    return '/mcp';
  }

  return `${window.location.origin}/mcp`;
}

export function buildMcpConfig(adminKeyword) {
  const trimmedKeyword = String(adminKeyword || '').trim();

  return {
    mcpServers: {
      dmytro_website: {
        type: 'streamable-http',
        url: getMcpEndpoint(),
        headers: {
          'x-admin-key': trimmedKeyword,
          Authorization: `Bearer ${trimmedKeyword}`,
        },
      },
    },
  };
}

async function copyTextToClipboard(text) {
  if (
    typeof navigator !== 'undefined'
    && navigator.clipboard
    && typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is unavailable.');
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();

  const didCopy = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!didCopy) {
    throw new Error('Clipboard copy failed.');
  }
}

export function AdminMcpConfigButton({ adminKeyword }) {
  const [copyState, setCopyState] = useState('idle');

  async function handleCopyConfig() {
    setCopyState('idle');

    try {
      await copyTextToClipboard(JSON.stringify(buildMcpConfig(adminKeyword), null, 2));
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1800);
    } catch (error) {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 2400);
    }
  }

  const label = copyState === 'copied'
    ? 'Copied'
    : copyState === 'failed'
      ? 'Copy failed'
      : 'Copy MCP';

  return (
    <button
      className="admin-ghost-button admin-mcp-copy-button"
      type="button"
      onClick={handleCopyConfig}
      title="Copy MCP config with the current admin API key"
    >
      {label}
    </button>
  );
}

function flattenSearchParts(parts) {
  return parts.flatMap((part) => {
    if (Array.isArray(part)) {
      return flattenSearchParts(part);
    }

    if (part === undefined || part === null || part === false) {
      return [];
    }

    return String(part);
  });
}

export function normalizeSearchValue(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getSearchTokens(query) {
  return normalizeSearchValue(query)
    .replace(/[#,;|/]+/g, ' ')
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

export function createSearchText(parts) {
  return normalizeSearchValue(flattenSearchParts(parts).join(' '));
}

export function createTagSearchParts(tags) {
  return Array.isArray(tags)
    ? tags.flatMap((tag) => [tag, `#${tag}`])
    : [];
}

export function matchesSearchQuery(searchText, query) {
  const tokens = getSearchTokens(query);

  if (tokens.length === 0) {
    return true;
  }

  const normalizedText = normalizeSearchValue(searchText);
  return tokens.every((token) => normalizedText.includes(token));
}

export function useAdminKeyboardShortcuts({
  isCommandPaletteOpen,
  onOpenCommandPalette,
  onCloseCommandPalette,
  onSave,
  onClose,
}) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    function handleKeyDown(event) {
      const isCommandKey = event.metaKey || event.ctrlKey;

      if (isCommandKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenCommandPalette?.();
        return;
      }

      if (isCommandKey && event.key === 'Enter') {
        event.preventDefault();

        if (!isCommandPaletteOpen) {
          onSave?.();
        }

        return;
      }

      if (event.key === 'Escape') {
        if (isCommandPaletteOpen) {
          event.preventDefault();
          onCloseCommandPalette?.();
          return;
        }

        const didHandleClose = onClose?.();

        if (didHandleClose) {
          event.preventDefault();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isCommandPaletteOpen,
    onClose,
    onCloseCommandPalette,
    onOpenCommandPalette,
    onSave,
  ]);
}

export function AdminCommandPalette({
  isOpen,
  onClose,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchResultLabel,
  commands,
}) {
  const inputRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const trimmedSearchValue = searchValue.trim();

  const visibleCommands = useMemo(() => {
    if (!trimmedSearchValue) {
      return commands;
    }

    return commands.filter((command) => matchesSearchQuery(
      createSearchText([command.label, command.detail, command.shortcut]),
      trimmedSearchValue,
    ));
  }, [commands, trimmedSearchValue]);

  const commandItems = useMemo(() => {
    const items = trimmedSearchValue
      ? [{
        id: 'admin-command-search',
        label: `Search "${trimmedSearchValue}"`,
        detail: searchResultLabel,
        shortcut: 'Enter',
        action: onClose,
      }]
      : [];

    return [...items, ...visibleCommands];
  }, [onClose, searchResultLabel, trimmedSearchValue, visibleCommands]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedIndex(0);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex((currentIndex) => Math.min(currentIndex, Math.max(commandItems.length - 1, 0)));
  }, [commandItems.length]);

  if (!isOpen) {
    return null;
  }

  function runCommand(command) {
    if (!command || command.disabled) {
      return;
    }

    command.action?.();
    onClose();
  }

  function handleInputKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((currentIndex) => (
        commandItems.length === 0 ? 0 : (currentIndex + 1) % commandItems.length
      ));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((currentIndex) => (
        commandItems.length === 0
          ? 0
          : (currentIndex - 1 + commandItems.length) % commandItems.length
      ));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(commandItems[selectedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div className="admin-command-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Admin command menu"
        aria-modal="true"
        className="admin-command-palette"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="admin-command-input"
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={searchPlaceholder}
          aria-label="Search admin"
        />

        <div className="admin-command-list" role="listbox" aria-label="Admin commands">
          {commandItems.map((command, index) => (
            <button
              className={`admin-command-item${index === selectedIndex ? ' is-active' : ''}`}
              disabled={command.disabled}
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => runCommand(command)}
            >
              <span className="admin-command-copy">
                <span className="admin-command-label">{command.label}</span>
                {command.detail && <span className="admin-command-detail">{command.detail}</span>}
              </span>
              {command.shortcut && <kbd>{command.shortcut}</kbd>}
            </button>
          ))}

          {commandItems.length === 0 && (
            <p className="admin-command-empty">No matching commands</p>
          )}
        </div>
      </section>
    </div>
  );
}
