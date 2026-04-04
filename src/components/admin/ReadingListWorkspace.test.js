import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import ReadingListWorkspace from './ReadingListWorkspace';
import {
  createAdminReadingListEntry,
  deleteAdminReadingListEntry,
  getAdminReadingList,
  updateAdminReadingListEntry,
} from '../../api/siteData';

jest.mock('../../api/siteData', () => ({
  createAdminReadingListEntry: jest.fn(),
  deleteAdminReadingListEntry: jest.fn(),
  getAdminReadingList: jest.fn(),
  updateAdminReadingListEntry: jest.fn(),
}));

const baseBooks = [
  {
    id: 1,
    year: 2026,
    title: 'One',
    author: 'Author One',
    slug: 'one',
    sortOrder: 0,
    summaryMarkdown: 'Summary one',
    relatedPostSlug: null,
    relatedPostLabel: null,
  },
  {
    id: 2,
    year: 2026,
    title: 'Two',
    author: 'Author Two',
    slug: 'two',
    sortOrder: 1,
    summaryMarkdown: null,
    relatedPostSlug: null,
    relatedPostLabel: null,
  },
];

function renderWorkspace() {
  return render(
    <ReadingListWorkspace
      adminKeyword="secret"
      activeWorkspace="readingList"
      onLogout={jest.fn()}
      onWorkspaceChange={jest.fn()}
    />,
  );
}

describe('ReadingListWorkspace', () => {
  beforeEach(() => {
    getAdminReadingList.mockResolvedValue(baseBooks);
    createAdminReadingListEntry.mockResolvedValue({
      book: {
        id: 3,
        year: 2026,
        title: 'Three',
        author: 'Author Three',
        sortOrder: 0,
        slug: 'three',
        summaryMarkdown: null,
        relatedPostSlug: null,
        relatedPostLabel: null,
      },
    });
    updateAdminReadingListEntry.mockResolvedValue({
      book: {
        ...baseBooks[0],
        title: 'One updated',
      },
    });
    deleteAdminReadingListEntry.mockResolvedValue({ deleted: true });
    window.confirm = jest.fn(() => true);
  });

  test('loads books and supports create, save, and delete actions', async () => {
    renderWorkspace();

    expect(await screen.findByDisplayValue('One')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('The Art of Learning'), 'Three');
    await userEvent.type(screen.getByPlaceholderText('Josh Waitzkin'), 'Author Three');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(createAdminReadingListEntry).toHaveBeenCalledWith('secret', {
      year: '2026',
      title: 'Three',
      author: 'Author Three',
      slug: 'three',
    });

    await waitFor(() => expect(getAdminReadingList).toHaveBeenCalledTimes(2));

    const editorTitleInput = screen.getByDisplayValue('One');
    await userEvent.clear(editorTitleInput);
    await userEvent.type(editorTitleInput, 'One updated');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateAdminReadingListEntry).toHaveBeenCalledWith('secret', 1, expect.objectContaining({
      title: 'One updated',
      year: 2026,
      author: 'Author One',
      slug: 'one-updated',
      sortOrder: 0,
    }));

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteAdminReadingListEntry).toHaveBeenCalledWith('secret', 1);
  });

  test('does not save when slug is cleared manually', async () => {
    renderWorkspace();

    expect(await screen.findByDisplayValue('one')).toBeInTheDocument();

    const slugInput = screen.getByDisplayValue('one');
    await userEvent.clear(slugInput);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateAdminReadingListEntry).not.toHaveBeenCalled();
    expect(screen.getByText('Year, title, author, and slug are required.')).toBeInTheDocument();
  });
});
