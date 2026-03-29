import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const BLANK_LINE_SPACER_HTML = '<div class="markdown-spacer" aria-hidden="true"></div>\n';

function createBlankLineSpacerToken() {
  return {
    type: 'html',
    block: true,
    raw: BLANK_LINE_SPACER_HTML,
    pre: false,
    text: BLANK_LINE_SPACER_HTML,
  };
}

function preserveExtraBlankLines(tokens) {
  const nextTokens = [];

  for (const token of tokens) {
    if (token.type === 'space') {
      const normalizedRaw = String(token.raw || '').replace(/\r\n?/g, '\n');
      const newlineCount = (normalizedRaw.match(/\n/g) || []).length;

      if (newlineCount > 2) {
        nextTokens.push({ type: 'space', raw: '\n\n' });

        for (let index = 0; index < newlineCount - 2; index += 1) {
          nextTokens.push(createBlankLineSpacerToken());
        }

        continue;
      }
    }

    nextTokens.push(token);
  }

  nextTokens.links = tokens.links;
  return nextTokens;
}

export function renderMarkdownToHtml(markdown = '') {
  const sourceMarkdown = String(markdown || '');
  const tokens = marked.lexer(sourceMarkdown);

  return marked.Parser.parse(preserveExtraBlankLines(tokens));
}
