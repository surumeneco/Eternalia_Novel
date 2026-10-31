// Exploratory unit checks, not real Discord OAuth2 browser authorization.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { AuthorGuard } = require('../dist/author.guard.js');

function context(method,headers) {
  return { switchToHttp: () => ({ getRequest: () => ({method,headers}) }) };
}
test('anonymous author operations are always rejected', async () => {
  const auth = { isAuthor: async () => false, assertWriteOrigin: () => {} };
  const guard = new AuthorGuard(auth);
  await assert.rejects(guard.canActivate(context('GET',{})));
  await assert.rejects(guard.canActivate(context('POST',{})));
});
test('author mutations must be subject to the origin policy', async () => {
  let checked = 0;
  const auth = { isAuthor: async () => true, assertWriteOrigin: () => {checked++;} };
  const guard = new AuthorGuard(auth);
  await guard.canActivate(context('GET',{}));
  assert.equal(checked,0);
  await guard.canActivate(context('POST',{}));
  assert.equal(checked,1);
});
