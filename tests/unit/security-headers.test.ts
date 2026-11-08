import { describe, expect, it } from 'vitest';
import { CSP_DIRECTIVES, buildCsp, securityHeaders } from '@/lib/security-headers';

const get = (headers: { key: string; value: string }[], key: string) => headers.find((h) => h.key === key)?.value;

describe('buildCsp', () => {
  const csp = buildCsp();
  const directive = (name: string) => csp.split('; ').find((d) => d.startsWith(`${name} `))?.slice(name.length + 1);

  it('locks everything to the site itself by default', () => {
    expect(directive('default-src')).toBe("'self'");
  });

  it('allows the Google Maps embed as a frame and nothing else as a frame', () => {
    expect(directive('frame-src')).toBe('https://www.google.com');
  });

  it('allows Vercel analytics but no other third-party scripts', () => {
    expect(directive('script-src')).toContain('https://va.vercel-scripts.com');
    const hosts = (directive('script-src') ?? '').split(' ').filter((s) => s.startsWith('http'));
    expect(hosts).toEqual(['https://va.vercel-scripts.com']);
    expect(directive('script-src')).not.toContain('unsafe-eval');
  });

  it('allows own images plus data:/blob: (inline icons, image previews) and fonts only from the site', () => {
    expect(directive('img-src')).toBe("'self' data: blob:");
    expect(directive('font-src')).toBe("'self'");
  });

  it('blocks plugins, base-tag hijacking, framing by other sites and off-site form posts', () => {
    expect(directive('object-src')).toBe("'none'");
    expect(directive('base-uri')).toBe("'self'");
    expect(directive('frame-ancestors')).toBe("'self'");
    expect(directive('form-action')).toBe("'self'");
  });

  it('upgrades insecure requests', () => {
    expect(csp.split('; ')).toContain('upgrade-insecure-requests');
  });

  it('never uses wildcards', () => {
    for (const values of Object.values(CSP_DIRECTIVES)) expect(values).not.toContain('*');
    expect(csp).not.toMatch(/\s\*(\s|;|$)/);
  });
});

describe('securityHeaders', () => {
  it('always sends the basic protections', () => {
    for (const production of [true, false]) {
      const h = securityHeaders({ production });
      expect(get(h, 'X-Content-Type-Options')).toBe('nosniff');
      expect(get(h, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(get(h, 'X-Frame-Options')).toBe('SAMEORIGIN');
      expect(get(h, 'Permissions-Policy')).toContain('camera=()');
      expect(get(h, 'Permissions-Policy')).toContain('geolocation=()');
      expect(get(h, 'Strict-Transport-Security')).toMatch(/max-age=\d+/);
    }
  });

  it('sends the CSP in production only (dev needs eval + websockets for hot reload)', () => {
    expect(get(securityHeaders({ production: true }), 'Content-Security-Policy')).toBeTruthy();
    expect(get(securityHeaders({ production: false }), 'Content-Security-Policy')).toBeUndefined();
  });
});
