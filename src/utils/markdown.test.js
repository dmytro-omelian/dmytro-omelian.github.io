import { renderMarkdownToHtml } from './markdown';

describe('renderMarkdownToHtml', () => {
  test('preserves extra blank lines between paragraphs', () => {
    const html = renderMarkdownToHtml('First paragraph\n\n\n\nSecond paragraph');
    const spacerMatches = html.match(/markdown-spacer/g) || [];

    expect(html).toContain('<p>First paragraph</p>');
    expect(html).toContain('<p>Second paragraph</p>');
    expect(spacerMatches).toHaveLength(2);
  });

  test('does not add spacer blocks for a normal paragraph break', () => {
    const html = renderMarkdownToHtml('First paragraph\n\nSecond paragraph');

    expect(html).not.toContain('markdown-spacer');
  });

  test('keeps blank lines inside fenced code blocks untouched', () => {
    const html = renderMarkdownToHtml('```js\nconst first = 1;\n\n\nconst second = 2;\n```');

    expect(html).not.toContain('markdown-spacer');
    expect(html).toContain('const first = 1;');
    expect(html).toContain('const second = 2;');
  });
});
