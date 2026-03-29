import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { handleWebApiRequest } = require('../server/api-handler');

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const route = String(requestUrl.searchParams.get('route') || '').trim();

    if (route) {
      requestUrl.searchParams.delete('route');

      const normalizedRoute = route.replace(/^\/+/, '');
      const rewrittenUrl = new URL(
        `/api/${normalizedRoute}${requestUrl.search}`,
        requestUrl.origin,
      );
      const rewrittenRequest = new Request(rewrittenUrl, request);
      return handleWebApiRequest(rewrittenRequest);
    }

    return handleWebApiRequest(request);
  },
};
