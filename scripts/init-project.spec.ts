/**
 * Run with: `bun test scripts/` (the root has no Jest project; these helpers are
 * pure, and getting them wrong would corrupt every file in the repo).
 */
import { describe, expect, it } from 'bun:test';
import { parseArgs, rename, titleCase, validateSlug } from './init-project';

describe('validateSlug', () => {
  it.each(['portal-desa', 'jdih', 'simpeg-v2'])('accepts %s', (slug) => {
    expect(validateSlug(slug)).toBe(slug);
  });

  it.each([
    ['Portal-Desa', 'uppercase is illegal in a Docker/npm name'],
    ['2fast', 'must start with a letter'],
    ['portal_desa', 'underscores are illegal in an S3 bucket name'],
    ['a', 'too short'],
    ['portal-', 'trailing dash'],
    ['portal--desa', 'doubled dash'],
  ])('rejects %s (%s)', (slug) => {
    expect(() => validateSlug(slug)).toThrow();
  });
});

describe('titleCase', () => {
  it('builds a display name from the slug', () => {
    expect(titleCase('portal-desa')).toBe('Portal Desa');
    expect(titleCase('jdih')).toBe('Jdih');
  });
});

describe('rename', () => {
  it('rewrites the package scope, the slug and the display name', () => {
    const before = [
      '"@starterkit/api": "workspace:*"',
      'container_name: starterkit-postgres',
      'POSTGRES_DB=starterkit',
      "APP_NAME = 'Starter Kit'",
      'https://api.starterkit-dev.orb.local',
    ].join('\n');

    expect(rename(before, 'portal-desa', 'Portal Desa')).toBe(
      [
        '"@portal-desa/api": "workspace:*"',
        'container_name: portal-desa-postgres',
        'POSTGRES_DB=portal-desa',
        "APP_NAME = 'Portal Desa'",
        'https://api.portal-desa-dev.orb.local',
      ].join('\n'),
    );
  });

  it('leaves unrelated text alone', () => {
    expect(rename('const start = kit;', 'portal-desa', 'Portal Desa')).toBe('const start = kit;');
  });

  it('is idempotent — re-running finds nothing left to rename', () => {
    const once = rename('@starterkit/api starterkit Starter Kit', 'portal-desa', 'Portal Desa');
    expect(rename(once, 'portal-desa', 'Portal Desa')).toBe(once);
  });
});

describe('parseArgs', () => {
  it('defaults to a safe interactive run', () => {
    expect(parseArgs([])).toEqual({ yes: false, dryRun: false, resetGit: false, force: false });
  });

  it('reads --name/--display in both forms', () => {
    expect(parseArgs(['--name', 'jdih']).name).toBe('jdih');
    expect(parseArgs(['--display=JDIH Tabalong']).display).toBe('JDIH Tabalong');
  });

  it('reads the boolean flags and rejects unknown options', () => {
    expect(parseArgs(['-y', '--dry-run', '--reset-git', '--force'])).toMatchObject({
      yes: true,
      dryRun: true,
      resetGit: true,
      force: true,
    });
    expect(() => parseArgs(['--nope'])).toThrow('Unknown option: --nope');
  });
});
