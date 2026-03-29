import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdownToHtml(markdown = '') {
  return marked.parse(String(markdown || ''));
}
