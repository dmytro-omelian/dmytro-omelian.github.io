const mockGetReadingListEntries = jest.fn();
const mockDeleteReadingListEntry = jest.fn();

jest.mock('./db', () => ({
  createReadingListEntry: jest.fn(),
  createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  },
  deleteReadingListEntry: mockDeleteReadingListEntry,
  getAllPostViews: jest.fn(),
  getBookshelfEntries: jest.fn(),
  getBlogCommentCounts: jest.fn(),
  getReadingListEntries: mockGetReadingListEntries,
}));

const { handleMcpRequest } = require('./mcp-handler');

const ADMIN_KEY = 'test-admin-key';
const REQUEST_URL = new URL('https://example.test/mcp');

function getBook(overrides = {}) {
  return {
    id: 42,
    year: 2026,
    title: 'The Example Book',
    author: 'Example Author',
    slug: 'the-example-book',
    ...overrides,
  };
}

async function callTool(name, args, headers = { 'x-admin-key': ADMIN_KEY }) {
  const response = await handleMcpRequest({
    method: 'POST',
    requestUrl: REQUEST_URL,
    headers,
    readJsonBody: async () => ({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    }),
  });

  return JSON.parse(response.body).result;
}

describe('delete_reading_list_books', () => {
  beforeEach(() => {
    process.env.ADMIN_API_KEY = ADMIN_KEY;
    mockGetReadingListEntries.mockReset();
    mockDeleteReadingListEntry.mockReset();
  });

  test('is advertised with a safe dry-run default and a 1-50 item input', async () => {
    const response = await handleMcpRequest({
      method: 'POST',
      requestUrl: REQUEST_URL,
      headers: {},
      readJsonBody: async () => ({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      }),
    });
    const payload = JSON.parse(response.body);
    const tool = payload.result.tools.find((candidate) => candidate.name === 'delete_reading_list_books');

    expect(tool.inputSchema.properties.books.minItems).toBe(1);
    expect(tool.inputSchema.properties.books.maxItems).toBe(50);
    expect(tool.inputSchema.properties.dryRun.default).toBe(true);
  });

  test('requires the existing admin key', async () => {
    const result = await callTool('delete_reading_list_books', {
      books: [{ title: 'The Example Book', author: 'Example Author' }],
    }, {});

    expect(result.isError).toBe(true);
    expect(result.structuredContent.error).toMatch(/admin API key/i);
    expect(mockGetReadingListEntries).not.toHaveBeenCalled();
    expect(mockDeleteReadingListEntry).not.toHaveBeenCalled();
  });

  test('defaults to dry-run and matches only the normalized duplicate key', async () => {
    mockGetReadingListEntries.mockResolvedValue([getBook()]);

    const result = await callTool('delete_reading_list_books', {
      books: [{ title: '  THE   EXAMPLE BOOK ', author: ' example author ' }],
    });
    const content = result.structuredContent;

    expect(content.dryRun).toBe(true);
    expect(content.wouldDelete).toHaveLength(1);
    expect(content.wouldDelete[0]).toMatchObject({
      matchReason: 'title_author_match',
      matchedRecord: { id: 42, slug: 'the-example-book' },
    });
    expect(content.deleted).toEqual([]);
    expect(mockDeleteReadingListEntry).not.toHaveBeenCalled();
  });

  test('uses an exact canonical slug fallback and never a fuzzy title match', async () => {
    mockGetReadingListEntries.mockResolvedValue([getBook()]);

    const result = await callTool('delete_reading_list_books', {
      books: [
        { title: 'Different title', author: 'Different author', slug: 'The Example Book' },
        { title: 'Example Book', author: 'Example Author' },
      ],
    });
    const content = result.structuredContent;

    expect(content.wouldDelete).toHaveLength(1);
    expect(content.wouldDelete[0]).toMatchObject({
      matchReason: 'slug_match',
      matchedRecord: { id: 42, slug: 'the-example-book' },
    });
    expect(content.skipped).toEqual([
      expect.objectContaining({
        index: 1,
        reason: 'not_found',
        matchedRecord: null,
      }),
    ]);
  });

  test('deletes once and reports an identical repeated call as skipped', async () => {
    let books = [getBook()];
    mockGetReadingListEntries.mockImplementation(async () => books);
    mockDeleteReadingListEntry.mockImplementation(async (id) => {
      const originalLength = books.length;
      books = books.filter((book) => book.id !== id);
      return books.length < originalLength;
    });
    const args = {
      books: [{ title: 'The Example Book', author: 'Example Author' }],
      dryRun: false,
    };

    const firstResult = await callTool('delete_reading_list_books', args);
    const secondResult = await callTool('delete_reading_list_books', args);

    expect(firstResult.structuredContent.deleted).toEqual([
      expect.objectContaining({ matchedRecord: expect.objectContaining({ id: 42, slug: 'the-example-book' }) }),
    ]);
    expect(secondResult.structuredContent.deleted).toEqual([]);
    expect(secondResult.structuredContent.failed).toEqual([]);
    expect(secondResult.structuredContent.skipped).toEqual([
      expect.objectContaining({ reason: 'not_found', matchedRecord: null }),
    ]);
  });

  test('treats a concurrent prior deletion as skipped with the matched record', async () => {
    mockGetReadingListEntries.mockResolvedValue([getBook()]);
    mockDeleteReadingListEntry.mockResolvedValue(false);

    const result = await callTool('delete_reading_list_books', {
      books: [{ title: 'The Example Book', author: 'Example Author' }],
      dryRun: false,
    });

    expect(result.structuredContent.deleted).toEqual([]);
    expect(result.structuredContent.failed).toEqual([]);
    expect(result.structuredContent.skipped).toEqual([
      expect.objectContaining({
        reason: 'already_deleted',
        matchedRecord: expect.objectContaining({ id: 42, slug: 'the-example-book' }),
      }),
    ]);
  });
});
