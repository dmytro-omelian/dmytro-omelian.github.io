import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { handleWebApiRequest } = require('../server/api-handler');

export default {
  async fetch(request) {
    return handleWebApiRequest(request);
  },
};
