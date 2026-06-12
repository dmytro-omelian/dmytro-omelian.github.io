import {
  buildMcpConfig,
  createSearchText,
  createTagSearchParts,
  getSearchTokens,
  matchesSearchQuery,
} from './adminControls';

describe('admin search controls', () => {
  test('normalizes search tokens from words and tags', () => {
    expect(getSearchTokens('  AI #Research, François  ')).toEqual([
      'ai',
      'research',
      'francois',
    ]);
  });

  test('matches every entered word across combined searchable fields', () => {
    const searchText = createSearchText([
      'On the Measure of Intelligence',
      'Francois Chollet',
      'Private notes about benchmark design',
      createTagSearchParts(['AI Research', 'Computer Science']),
    ]);

    expect(matchesSearchQuery(searchText, 'measure research')).toBe(true);
    expect(matchesSearchQuery(searchText, '#ai chollet')).toBe(true);
    expect(matchesSearchQuery(searchText, 'benchmark philosophy')).toBe(false);
  });

  test('builds MCP config with admin key headers', () => {
    expect(buildMcpConfig('secret-key')).toEqual({
      mcpServers: {
        dmytro_website: {
          type: 'streamable-http',
          url: `${window.location.origin}/mcp`,
          headers: {
            'x-admin-key': 'secret-key',
            Authorization: 'Bearer secret-key',
          },
        },
      },
    });
  });
});
