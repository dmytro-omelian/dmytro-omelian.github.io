import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BooksYearSection from './BooksYearSection';

describe('BooksYearSection', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/books');
  });

  test('shows the number of books next to the year', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BooksYearSection
          year="2026"
          books={[{ id: 1, title: 'Only Book', author: 'Author' }]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('2026 · 1 book');
  });

  test('opens a summary from the hash and clears the hash when closing', async () => {
    window.history.replaceState(null, '', '/books#book-hash-book');

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BooksYearSection
          year="2026"
          books={[
            {
              id: 1,
              title: 'Hash Book',
              author: 'Author',
              slug: 'hash-book',
              summaryMarkdown: 'Summary copy',
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.location.hash).toBe('');
    });
  });

  test('opens a summary without setting a hash when the book has no slug', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BooksYearSection
          year="2026"
          books={[
            {
              id: 1,
              title: 'Summary Only',
              author: 'Author',
              summaryMarkdown: 'A note',
            },
          ]}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Summary Only' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
    expect(screen.queryByText(/Score:/i)).not.toBeInTheDocument();
  });

  test('renders score and finished date when they are available', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BooksYearSection
          year="2026"
          books={[
            {
              id: 1,
              title: 'Rated Book',
              author: 'Author',
              slug: 'rated-book',
              summaryMarkdown: 'A note',
              score: 4.5,
              finishedOn: '2026-04-04',
            },
          ]}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Rated Book' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rated Book' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Finished: 04/04/2026 · Score: 4.5/5')).toBeInTheDocument();
  });

  test('does not create a book-note trigger when only date and score exist', () => {
    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BooksYearSection
          year="2026"
          books={[
            {
              id: 1,
              title: 'Meta Only',
              author: 'Author',
              slug: 'meta-only',
              score: 3.5,
              finishedOn: '2026-04-04',
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Meta Only' })).not.toBeInTheDocument();
    expect(screen.getByText('Meta Only')).toBeInTheDocument();
    expect(container.querySelector('#book-meta-only')?.getAttribute('data-book-meta')).toBe('04/04/2026 · 3.5/5');
  });

  test('renders an internal blog slug as an app blog link', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BooksYearSection
          year="2026"
          books={[
            {
              id: 1,
              title: 'Internal Blog',
              author: 'Author',
              relatedPostSlug: 'about-nvidia-way',
            },
          ]}
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Internal Blog' });
    expect(link).toHaveAttribute('href', '/blog/about-nvidia-way');
    expect(link).not.toHaveAttribute('target');
  });

  test('renders an external blog URL as a new-tab link', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BooksYearSection
          year="2026"
          books={[
            {
              id: 1,
              title: 'External Blog',
              author: 'Author',
              relatedPostSlug: 'https://domelian.substack.com/p/read-this-before-your-next-long-project',
            },
          ]}
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'External Blog' });
    expect(link).toHaveAttribute('href', 'https://domelian.substack.com/p/read-this-before-your-next-long-project');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  test('opens a summary from an encoded hash for a unicode slug', async () => {
    window.history.replaceState(null, '', `/books#book-${encodeURIComponent('квіти-для-елджернона')}`);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BooksYearSection
          year="2023"
          books={[
            {
              id: 1,
              title: 'Квіти для Елджернона',
              author: 'Деніел Кіз',
              slug: 'квіти-для-елджернона',
              summaryMarkdown: 'Summary copy',
            },
          ]}
        />
      </MemoryRouter>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Квіти для Елджернона' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Summary copy')).toBeInTheDocument();
  });
});
