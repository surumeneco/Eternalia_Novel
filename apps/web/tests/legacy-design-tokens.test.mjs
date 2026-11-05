import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const assets = new URL('../app/assets/', import.meta.url);
const [paletteScss, colorScss, currentCss] = await Promise.all([
  readFile(new URL('legacy/variables/_pallet.scss', assets), 'utf8'),
  readFile(new URL('legacy/variables/_color.scss', assets), 'utf8'),
  readFile(new URL('css/eternalia.css', assets), 'utf8'),
]);
const [fontScss, marginScss, radiusScss] = await Promise.all([
  readFile(new URL('legacy/variables/_font-size.scss', assets), 'utf8'),
  readFile(new URL('legacy/variables/_margin.scss', assets), 'utf8'),
  readFile(new URL('legacy/variables/_radius.scss', assets), 'utf8'),
]);

function parseLegacyPalette(source) {
  const entries = new Map();
  const groups = [];
  for (const line of source.split(/\r?\n/)) {
    const indent = (line.match(/^ */) ?? [''])[0].length;
    const group = line.match(/^\s*"([^"]+)":\s*\($/);
    const value = line.match(/^\s*"([^"]+)":\s*(#[0-9a-f]{6}),?$/i);
    if (!group && !value) continue;
    while (groups.length && groups.at(-1).indent >= indent) groups.pop();
    if (group) groups.push({ indent, name: group[1] });
    if (value) {
      const key = [...groups.map(item => item.name), value[1]].join('-');
      entries.set(key, value[2].toLowerCase());
    }
  }
  return entries;
}

function parseLegacyColorRoles(source) {
  const entries = new Map();
  let category = null;
  for (const line of source.split(/\r?\n/)) {
    const group = line.match(/^  "([^"]+)":\s*\($/);
    if (group) { category = group[1]; continue; }
    const role = line.match(/^    "([^"]+)":\s*map\.get\(\$eternalia-pallet,\s*(.*?)\),?$/);
    if (!role || !category) continue;
    const palettePath = [...role[2].matchAll(/"([^"]+)"/g)].map(match => match[1]).join('-');
    entries.set(category + '-' + role[1], palettePath);
  }
  return entries;
}

test('active palette values match their v0.3 legacy SCSS source paths', () => {
  const legacy = parseLegacyPalette(paletteScss);
  const active = [...currentCss.matchAll(/--palette-([\w-]+):\s*(#[0-9a-f]{6});/gi)];
  assert.ok(active.length >= 12, 'active palette must expose the adopted role palette');
  for (const match of active) {
    assert.equal(legacy.get(match[1]), match[2].toLowerCase(),
      '--palette-' + match[1] + ' must match the imported v0.3 SCSS value');
  }
});

test('active semantic color aliases preserve the v0.3 category/role mapping', () => {
  const legacy = parseLegacyColorRoles(colorScss);
  const active = [...currentCss.matchAll(/--color-([\w-]+):\s*var\(--palette-([\w-]+)\);/g)];
  assert.ok(active.length >= 12, 'active CSS must expose semantic color aliases');
  for (const match of active) {
    assert.equal(legacy.get(match[1]), match[2],
      '--color-' + match[1] + ' must resolve to its legacy SCSS palette path');
  }
});

test('active font, radius and spacing tokens retain their v0.3 values', () => {
  const cssValue = name => {
    const match = currentCss.match(new RegExp('--' + name + ':\\s*([^;]+);'));
    assert.ok(match, 'missing CSS token --' + name);
    return match[1].trim();
  };
  for (const match of fontScss.matchAll(/"(xs|s|m|l|xl|xxl)":\s*(\d+px),/g)) {
    assert.equal(cssValue('font-size-' + match[1]), match[2], 'legacy font size ' + match[1]);
  }
  for (const match of radiusScss.matchAll(/"(panel|input|button)":\s*(\d+px),/g)) {
    assert.equal(cssValue('radius-' + match[1]), match[2], 'legacy radius ' + match[1]);
  }
  const legacyValue = (section, key) => {
    const group = marginScss.match(new RegExp('\\$eternalia-' + section + ':\\s*\\(([\\s\\S]*?)\\);'));
    assert.ok(group, 'missing legacy spacing section ' + section);
    const value = group[1].match(new RegExp('"' + key + '":\\s*([^,]+),'));
    assert.ok(value, 'missing legacy spacing key ' + key);
    return value[1].trim();
  };
  assert.equal(cssValue('space-panel-margin'), legacyValue('margin', 'content'));
  assert.equal(cssValue('space-panel-padding'), legacyValue('padding', 'content'));
  assert.equal(cssValue('space-menu-item-padding'), legacyValue('padding', 'menu-item'));
});
