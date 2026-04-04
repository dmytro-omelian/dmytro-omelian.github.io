import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Books from './Books';
import { getPublicReadingList } from '../../api/siteData';

jest.mock('../../api/siteData', () => ({
  getPublicReadingList: jest.fn(),
}));

describe('Books', () => {
  test('loads API books, sorts them, and groups them by year', async () => {
    getPublicReadingList.mockResolvedValue([
      { id: 4, year: 2025, title: 'Later book', author: 'Author 2', sortOrder: 2 },
      { id: 2, year: 2026, title: 'Second', author: 'Author 4', sortOrder: 1 },
      { id: 3, year: 2025, title: 'Earlier book', author: 'Author 1', sortOrder: 0 },
      {
        id: 1,
        year: 2026,
        title: 'First',
        author: 'Author 3',
        sortOrder: 0,
        relatedPostSlug: 'first-post',
      },
    ]);

    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Books />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading reading list...')).toBeInTheDocument();

    await waitFor(() => expect(getPublicReadingList).toHaveBeenCalledTimes(1));

    const headings = (await screen.findAllByRole('heading', { level: 3 })).map((heading) => heading.textContent);
    expect(headings).toEqual(['2026', '2025']);

    const yearSections = container.querySelectorAll('.books-by-year');
    expect(within(yearSections[0]).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Second by Author 4',
      'First by Author 3 blog post',
    ]);
    expect(within(yearSections[1]).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Later book by Author 2',
      'Earlier book by Author 1',
    ]);
  });

  test('renders an error state when loading fails', async () => {
    getPublicReadingList.mockRejectedValue(new Error('Request failed.'));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Books />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Request failed.')).toBeInTheDocument();
  });
});
