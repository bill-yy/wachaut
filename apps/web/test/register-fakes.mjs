/**
 * Module stand-ins for `npm test` (loaded with --import, before any test).
 *
 * The SFU client imports four things that only exist inside a browser bundle
 * or pull Svelte's compiler in (the error reporter -> the analytics tracker,
 * whose runes plain Node cannot run). Each is swapped for a fake under
 * test/fakes so the client's connect/reconnect lifecycle can be unit-tested
 * exactly as it ships — no test seams in src/lib/sfu-client.ts.
 */
import { registerHooks } from 'node:module';

const fake = (name) => new URL(`./fakes/${name}`, import.meta.url).href;
const pick = (url, standIns) => standIns.find(([pattern]) => pattern.test(url))?.[1];

// Matched on the RESOLVED url: by the time a specifier reaches this hook it
// has already been rewritten by an earlier hook (tsx: "./error-report" arrives
// as "./error-report.ts").
const EVERYWHERE = [
  [/\/node_modules\/socket\.io-client\//, fake('socket-io-client.mjs')],
  [/\/node_modules\/mediasoup-client\//, fake('mediasoup-client.mjs')],
];
// Only for the SFU client, the module under test.
const SFU_CLIENT_ONLY = [
  [/\/src\/lib\/error-report\.ts$/, fake('error-report.mjs')],
  [/\/src\/lib\/utils\/devlog\.ts$/, fake('devlog.mjs')],
];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const resolved = nextResolve(specifier, context);
    const fromClient = context.parentURL?.endsWith('/lib/sfu-client.ts');
    const url =
      pick(resolved.url, EVERYWHERE) ??
      (fromClient ? pick(resolved.url, SFU_CLIENT_ONLY) : undefined);
    return url ? { ...resolved, url } : resolved;
  },
});
