export function normalizeBookYear(value) {
  const year = Number(value);
  return Number.isFinite(year) ? year : 0;
}

export function normalizeBookSortOrder(value) {
  const sortOrder = Number(value);
  return Number.isFinite(sortOrder) ? sortOrder : 0;
}

export function slugifyReadingListValue(input) {
  return String(input ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sortReadingListEntries(entries = []) {
  return [...entries].sort((leftBook, rightBook) => (
    normalizeBookYear(rightBook.year) - normalizeBookYear(leftBook.year)
    || String(getBookFinishedOn(rightBook) || '').localeCompare(String(getBookFinishedOn(leftBook) || ''))
    || normalizeBookSortOrder(rightBook.sortOrder) - normalizeBookSortOrder(leftBook.sortOrder)
    || String(leftBook.title || '').localeCompare(String(rightBook.title || ''))
    || Number(leftBook.id || 0) - Number(rightBook.id || 0)
  ));
}

export function groupBooksByYear(entries = []) {
  const groupedBooks = new Map();

  sortReadingListEntries(entries).forEach((book) => {
    const year = normalizeBookYear(book.year);

    if (!groupedBooks.has(year)) {
      groupedBooks.set(year, []);
    }

    groupedBooks.get(year).push(book);
  });

  return Array.from(groupedBooks.entries()).map(([year, books]) => ({
    year,
    books,
  }));
}

export function getBookSummary(book) {
  return String(book?.summaryMarkdown || book?.summary || '').trim();
}

export function hasBookSummary(book) {
  return Boolean(getBookSummary(book));
}

export function getBookFinishedOn(book) {
  const value = String(book?.finishedOn || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function getBookScore(book) {
  const rawScore = book?.score;

  if (rawScore === undefined || rawScore === null || rawScore === '') {
    return null;
  }

  const numericScore = Number(rawScore);
  return Number.isFinite(numericScore) ? numericScore : null;
}
