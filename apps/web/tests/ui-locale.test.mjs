import test from 'node:test';
import assert from 'node:assert/strict';
import { translateUiMessage, uiMessages } from '../app/composables/useUiLocale.ts';

test('fixed UI falls back to Japanese until a translation is explicitly available', () => {
  assert.equal(translateUiMessage('home', 'ja'), 'ホーム');
  assert.equal(translateUiMessage('home', 'xx'), 'ホーム');
  assert.equal(translateUiMessage('studio', '__proto__'), '作者の書斎');
});

test('additional reviewed catalogs can be selected without changing authored content', () => {
  const translated = Object.fromEntries(
    Object.entries(uiMessages.ja).map(([key, value]) => [key, 'EN:' + value]),
  );
  assert.equal(translateUiMessage('home', 'en', { en: translated }), 'EN:ホーム');
  assert.equal(translateUiMessage('tips', 'ja', { en: translated }), '設定集');
  assert.equal(translateUiMessage('timeline', 'de', { en: translated }), '年表');
});
