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

test('studio editing and publication fixed messages have Japanese fallback keys', () => {
  const messages = {
    studioUnsavedDiscard: '未保存の変更があります。破棄して移動しますか？',
    studioNewItemDiscard: '未保存の新規項目を破棄しますか？',
    studioRubyInvalid: 'ルビ記号または改行を含む選択範囲にはルビを付けられません。',
    studioBodyTooLong: '本文の文字数上限を超えています。',
    studioLibraryLoadError: 'ライブラリを取得できませんでした。認証・DB設定を確認してください。',
    studioPostUpdateRefreshError: '更新の送信後に最新の状態を取得できませんでした。再読込して内容を確認してください。',
    studioSaveError: '保存に失敗しました。再読込して競合状態を確認してください。',
    studioCreateTitleRequired: 'タイトルを入力してください。',
    studioCreated: '項目を作成しました。',
    studioDraftSaved: '下書きを保存しました。公開版は変更されていません。',
    studioPublishConfirm: '保存済みの下書きを公開版へ反映します。未保存の変更は含みません。続行しますか？',
    studioPublished: '公開スナップショットを更新しました。',
    studioVisibilityChanged: '公開条件を変更しました。',
    studioInvalidDate: '日時が不正です。',
    studioLoggedOut: 'ログアウトしました。',
    studioManuscriptToolbar: '本文の記法を挿入',
    studioRubyButton: '選択文字にルビを付ける',
    studioPageButton: 'ページ区切りを挿入',
  };
  for (const [key, expected] of Object.entries(messages)) {
    assert.equal(translateUiMessage(key, 'ja'), expected, key);
    assert.equal(translateUiMessage(key, 'unknown'), expected, key + ' fallback');
  }
});
