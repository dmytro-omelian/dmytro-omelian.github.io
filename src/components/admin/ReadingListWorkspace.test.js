import React from 'react';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    jest.clearAllMocks();
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
    await userEvent.type(screen.getAllByPlaceholderText('about-nvidia-way or https://domelian.substack.com/p/...')[0], 'https://domelian.substack.com/p/read-this-before-your-next-long-project');
    await userEvent.type(screen.getAllByPlaceholderText('blog post')[0], 'book note');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(createAdminReadingListEntry).toHaveBeenCalledWith('secret', {
      year: '2026',
      title: 'Three',
      author: 'Author Three',
      slug: 'three',
      sortOrder: 2,
      relatedPostSlug: 'https://domelian.substack.com/p/read-this-before-your-next-long-project',
      relatedPostLabel: 'book note',
    });

    await waitFor(() => expect(getAdminReadingList).toHaveBeenCalledTimes(2));

    const editorTitleInput = screen.getByDisplayValue('One');
    await userEvent.clear(editorTitleInput);
    await userEvent.type(editorTitleInput, 'One updated');
    await userEvent.type(screen.getAllByPlaceholderText('about-nvidia-way or https://domelian.substack.com/p/...')[1], 'about-nvidia-way');
    await userEvent.type(screen.getAllByPlaceholderText('blog post')[1], 'writeup');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateAdminReadingListEntry).toHaveBeenCalledWith('secret', 1, expect.objectContaining({
      title: 'One updated',
      year: 2026,
      author: 'Author One',
      slug: 'one-updated',
      sortOrder: 0,
      relatedPostSlug: 'about-nvidia-way',
      relatedPostLabel: 'writeup',
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

  test('filters by all entered words across searchable book fields', async () => {
    renderWorkspace();

    expect(await screen.findByDisplayValue('One')).toBeInTheDocument();

    const searchInput = screen.getByLabelText('Search reading list');
    await userEvent.type(searchInput, 'summary one');

    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /One/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Two/ })).not.toBeInTheDocument();

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'author two');

    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Two/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /One/ })).not.toBeInTheDocument();
  });

  test('supports command palette, escape close, and command-enter save', async () => {
    renderWorkspace();

    expect(await screen.findByDisplayValue('One')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByRole('dialog', { name: 'Admin command menu' })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search admin'), 'summary one');
    expect(screen.getByText('1 matching book')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Admin command menu' })).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText('Search reading list')).toHaveValue('summary one');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByLabelText('Search reading list')).toHaveValue('');

    fireEvent.keyDown(window, { key: 'Enter', metaKey: true });

    await waitFor(() => {
      expect(updateAdminReadingListEntry).toHaveBeenCalledWith('secret', 1, expect.objectContaining({
        title: 'One',
        author: 'Author One',
        slug: 'one',
      }));
    });
  });
});
