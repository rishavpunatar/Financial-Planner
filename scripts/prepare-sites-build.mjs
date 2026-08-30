import { mkdir, writeFile } from 'node:fs/promises';

const serverDirectory = new URL('../dist/server/', import.meta.url);

const worker = `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404 || request.method !== 'GET') {
      return response;
    }

    const accept = request.headers.get('accept') || '';
    if (!accept.includes('text/html')) {
      return response;
    }

    const indexUrl = new URL('/index.html', request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
`;

const wrangler = {
  name: 'clearplan-financial-planner',
  compatibility_date: '2026-08-30',
  compatibility_flags: ['nodejs_compat'],
  main: 'index.js',
  no_bundle: true,
  assets: { directory: '../client' },
  observability: { enabled: true },
  rules: [{ type: 'ESModule', globs: ['**/*.js', '**/*.mjs'] }],
};

await mkdir(serverDirectory, { recursive: true });
await writeFile(new URL('index.js', serverDirectory), worker);
await writeFile(
  new URL('wrangler.json', serverDirectory),
  `${JSON.stringify(wrangler)}\n`,
);
