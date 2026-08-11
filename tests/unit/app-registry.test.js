import test from 'node:test';
import assert from 'node:assert/strict';
import { getApp, getApps } from '../../scripts/apps/app-registry.js';

test('registers the five first-release applications in desktop order', () => {
  assert.deepEqual(getApps().map(({ id }) => id), [
    'projects', 'writing', 'about', 'contact', 'settings',
  ]);
});

test('returns one stable definition per application', () => {
  assert.equal(getApp('projects').titleKey, 'apps.projects');
  assert.equal(getApp('settings').renderer, 'settings');
  assert.equal(getApp('missing'), null);
});
