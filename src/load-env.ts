// Loads the server-root .env regardless of the spawn working directory.
//
// MCP hosts (e.g. OpenClaw's bundle-mcp) spawn this server from arbitrary
// cwds, but the app config (MS365_MCP_CLIENT_ID / MS365_MCP_CLIENT_SECRET /
// MS365_MCP_TENANT_ID) is provisioned into <server root>/.env. The bare
// `import 'dotenv/config'` resolves .env from process.cwd(), so the server
// started fine from its own directory but exited ("requires
// MS365_MCP_CLIENT_SECRET") when spawned from anywhere else.
//
// tsup bundles to dist/index.js, so at runtime import.meta.url points into
// dist/ and the server root is one level up. `quiet` keeps dotenv from
// writing its banner to stdout, which would corrupt the MCP stdio handshake.
//
// This module must stay the FIRST import of the entrypoint: downstream
// modules read process.env at module-load time.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'),
  quiet: true,
});
