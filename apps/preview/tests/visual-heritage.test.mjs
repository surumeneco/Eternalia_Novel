/**
 * Exploratory static guard, NOT CAT-TDD process-closure or visual screenshot approval.
 * Traceability: Drive 220_ビジュアルデザイン / 400_受入検証計画 AC-60..63.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
function source(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

test('old v0.3 visual token sources are preserved separately from roles', () => {
  const palette = source('apps/web/app/assets/legacy/variables/_pallet.scss');
  const roles = source('apps/web/app/assets/legacy/variables/_color.scss');
  assert.match(palette, /"sky":\s*\([\s\S]*?"origin":\s*#00bfff/);
  assert.match(palette, /"grass":\s*\([\s\S]*?"origin":\s*#00ff55/);
  assert.match(roles, /"page-bottom":\s*map\.get\(\$eternalia-pallet,\s*"grass",\s*"dark",\s*"50"\)/);
  assert.match(roles, /"base":\s*map\.get\(\$eternalia-pallet,\s*"void",\s*"30"\)/);
});

test('both Nuxt UI and runnable alpha use inherited sky/grass/stone roles', () => {
  const nuxtCss = source('apps/web/app/assets/css/eternalia.css');
  const previewCss = source('apps/preview/public/style.css');
  assert.match(nuxtCss, /--palette-sky-origin:\s*#00bfff/);
  assert.match(nuxtCss, /--palette-grass-origin:\s*#00ff55/);
  assert.match(nuxtCss, /--color-background-base:\s*var\(--palette-void-30\)/);
  assert.match(nuxtCss, /linear-gradient\(to bottom,\s*var\(--color-background-page\),\s*var\(--color-background-page-bottom\)\)/);
  assert.match(previewCss, /--sky-origin:\s*#00bfff/);
  assert.match(previewCss, /--grass-origin:\s*#00ff55/);
  assert.match(previewCss, /--surface:\s*var\(--void-30\)/);
  assert.match(previewCss, /linear-gradient\(to bottom,\s*var\(--sky-moss-100\),\s*var\(--grass-dark-50\)\)/);
  assert.doesNotMatch(previewCss, /#f7f5f0|#c59758/i, 'obsolete beige/gold palette may not become the canonical preview theme');
});

test('reader structure retains header/navigation/sidebar/main/footer and domain routes', () => {
  const layout = source('apps/web/app/layouts/default.vue');
  for (const fragment of ['<header', '<nav', '<aside', '<main', '<footer', 'TopicPath']) {
    if (fragment === 'TopicPath') continue; // TopicPath is instantiated on pages, not shell.
    assert.ok(layout.includes(fragment), fragment);
  }
  assert.match(layout, /\/stories/);
  assert.match(layout, /\/tips/);
  assert.match(layout, /\/dictionaries/);
  assert.match(layout, /\/timeline/);
  assert.match(source('apps/preview/public/index.html'), /class="container site-structure"/);
  assert.match(source('apps/web/app/pages/series/[id].vue'), /<TopicPath/);
});
