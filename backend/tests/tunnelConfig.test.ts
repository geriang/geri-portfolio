import fs from 'fs';
import path from 'path';
import { TUNNEL_HOST_PLACEHOLDER } from './fixtures/publicSurfaceFixtures';

/**
 * AC-6 automated assist: scan the two committed tunnel artifacts. The filled
 * copy never enters this repository, so anything committed here must be
 * placeholder-only: /activity as the single forwarded path, an http_status:404
 * catch-all, ${ENV_NAME} placeholders and RFC 2606/localhost URLs only, and no
 * credential-shaped material or env assignment anywhere. The reviewer reads
 * the artifacts themselves on top of this test.
 */

const artifactDir = path.join(__dirname, '../../deploy/cloudflared');
const yml = fs.readFileSync(path.join(artifactDir, 'activity-tunnel.example.yml'), 'utf8');
const readme = fs.readFileSync(path.join(artifactDir, 'README.md'), 'utf8');

/** hostnames the scan accepts, beyond ${...} placeholders and loopback */
const DOC_DOMAINS = ['example.com', 'example.org', 'example.net', 'invalid'];

function assertPlaceholderOnlyUrl(token: string, label: string): void {
  const host = token
    .replace(/^https?:\/\//, '')
    .split(/[/?#\s]/)[0]
    .replace(/:\d+$/, '');
  const ok =
    host.includes('${') ||
    host === '127.0.0.1' ||
    host === 'localhost' ||
    host.startsWith('127.0.0.1:') ||
    host.startsWith('localhost:') ||
    DOC_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  expect({ label, token, ok }).toEqual({ label, token, ok: true });
}

describe('tunnel artifact: activity-tunnel.example.yml (AC-6)', () => {
  it('names /activity as the ONLY forwarded service path, exactly once', () => {
    expect(yml.match(/service:\s*http:\/\/(127\.0\.0\.1|localhost):8080\/activity/g)?.length).toBe(
      1,
    );
    for (const other of ['entity', 'chat', 'health']) {
      expect(yml).not.toContain(other);
    }
  });

  it('carries the http_status:404 catch-all so nothing else reaches the backend', () => {
    expect(yml).toContain('http_status:404');
  });

  it('uses only ${...} placeholders, loopback or RFC 2606 hostnames in every URL and hostname token', () => {
    const urlTokens = yml.match(/https?:\/\/[^\s#]+/g) ?? [];
    expect(urlTokens.length).toBeGreaterThan(0);
    for (const token of urlTokens) {
      assertPlaceholderOnlyUrl(token, 'yml:url');
    }
    const hostnameTokens = [...yml.matchAll(/hostname:\s*(\S+)/g)].map((m) => m[1]);
    expect(hostnameTokens.length).toBe(1);
    for (const token of hostnameTokens) {
      assertPlaceholderOnlyUrl(`https://${token}`, 'yml:hostname');
    }
  });

  it('keeps the credentials-file value a pure placeholder', () => {
    const match = yml.match(/credentials-file:\s*(\S+)/);
    expect(match?.[1]).toBe('${ACTIVITY_TUNNEL_CREDENTIALS_FILE}');
  });
});

describe('tunnel artifacts: secret and privacy scans of both files (AC-6)', () => {
  const files: Array<[string, string]> = [
    ['activity-tunnel.example.yml', yml],
    ['README.md', readme],
  ];

  it.each(files)(
    '%s assigns no value to the documented hardening env vars',
    (_name, text) => {
      expect(text).not.toMatch(
        /(ACTIVITY_ALLOWED_ORIGINS|ACTIVITY_RATE_LIMIT_PER_MINUTE)\s*=\s*\S/,
      );
    },
  );

  it.each(files)('%s contains nothing credential-shaped', (_name, text) => {
    expect(
      /\b(token|secret|passwor[dt]|api[_-]?key|bearer)\b\s*[:=]\s*[^\s$]/i.test(text),
    ).toBe(false);
    expect(/BEGIN [A-Z ]*PRIVATE KEY/.test(text)).toBe(false);
    expect(/[A-Za-z0-9+/]{40,}={0,2}/.test(text)).toBe(false);
  });

  it.each(files)('%s keeps URLs placeholder-only too', (_name, text) => {
    for (const token of text.match(/https?:\/\/[^\s`'"]+/g) ?? []) {
      assertPlaceholderOnlyUrl(token, _name);
    }
  });

  it('README documents the five hardening env-var names (names, not values)', () => {
    for (const name of [
      'ACTIVITY_ALLOWED_ORIGINS',
      'ACTIVITY_RATE_LIMIT_PER_MINUTE',
      'ACTIVITY_TUNNEL_NAME',
      'ACTIVITY_TUNNEL_HOSTNAME',
      'ACTIVITY_TUNNEL_CREDENTIALS_FILE',
    ]) {
      expect(readme).toContain(name);
    }
  });

  it('README stays aligned with the fixture placeholder hostname vocabulary', () => {
    expect(TUNNEL_HOST_PLACEHOLDER).toBe('activity.example.com');
    expect(readme).toContain('activity.example.com');
  });
});
