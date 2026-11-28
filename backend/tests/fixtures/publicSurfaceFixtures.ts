/**
 * US-5 public-surface test data (spec fixture plan): generated values only,
 * single source of truth — tests import these, never retype literals.
 * Origins sit on RFC 2606 documentation domains; IPs on RFC 5737 ranges.
 * No real hostname, account name, token, cookie or marker text.
 */

export const ORIGIN_ALLOWED_A = 'https://portfolio.example.com'; // on the allowlist (AC-2)
export const ORIGIN_ALLOWED_B = 'https://api.example.com'; // on the allowlist (AC-2)
export const ORIGIN_DENIED = 'https://notallowed.example.com'; // never on the allowlist

export const CLIENT_IP_A = '203.0.113.7'; // RFC 5737 documentation range
export const CLIENT_IP_B = '203.0.113.8'; // RFC 5737
export const PROXY_IP = '198.51.100.9'; // RFC 5737 (two-hop XFF chain tail)

export const TUNNEL_HOST_PLACEHOLDER = 'activity.example.com'; // RFC 2606, docs only

export const ALLOWED_ORIGINS_ENV_VALUE = `${ORIGIN_ALLOWED_A},${ORIGIN_ALLOWED_B}`;
