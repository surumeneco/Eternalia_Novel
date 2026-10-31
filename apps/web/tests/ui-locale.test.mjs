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

test('remaining author studio labels have typed Japanese fallback entries', () => {
  const labels = {
    "studioKindSeries": "シリーズ",
    "studioKindVolume": "編",
    "studioKindPart": "部",
    "studioKindCategory": "カテゴリ",
    "studioKindLanguage": "言語",
    "studioKindPeriodization": "年代区分",
    "studioFilterAll": "すべて",
    "studioFilterStories": "執筆",
    "studioFilterTips": "設定",
    "studioFilterDictionaries": "辞書",
    "studioFilterTimeline": "年表",
    "studioPublicationManagement": "公開管理",
    "studioReorder": "並べ替え",
    "studioMemos": "メモ",
    "studioLogout": "ログアウト",
    "studioDraftVsPublication": "下書き保存と公開スナップショットの反映は別操作です。",
    "studioAuthChecking": "認証状態を確認しています。",
    "studioAuthNotConfigured": "作者認証が設定されていません。サーバー側でDiscord OAuth2とPostgreSQLを設定してください。",
    "studioAnonymousReadable": "匿名閲覧は認証なしで利用できます。",
    "studioLoginRequired": "編集するには、許可された作者のDiscordアカウントで認証してください。",
    "studioDiscordLogin": "Discordでログイン",
    "studioLibrary": "ライブラリ",
    "studioReload": "再読込",
    "studioMaterialType": "資料種別",
    "studioEmpty": "項目がありません。",
    "studioNewSeries": "新規シリーズ",
    "studioAddChild": "子項目を追加",
    "studioEditorForm": "編集フォーム",
    "studioAddItem": "項目を追加",
    "studioKindLabel": "種類",
    "studioTitleLabel": "タイトル",
    "studioCreate": "作成",
    "studioCancel": "キャンセル",
    "studioDraftRevision": "下書き改訂",
    "studioPublishedSnapshot": "公開スナップショットあり",
    "studioUnpublished": "未公開",
    "studioNameHeading": "名称・見出し",
    "studioSpellingWarnings": "綴りに関する警告",
    "studioBodyLabel": "本文・説明",
    "studioMarkupPlaceholder": "ページ区切り: [[page]] ／ ルビ: ｜漢字《かんじ》",
    "studioLegacyWordClass": "旧形式の品詞",
    "studioRelativeYear": "相対年",
    "studioSaveDraft": "下書きを保存",
    "studioPublicationSettings": "公開設定",
    "studioPublicationNote": "公開版を更新しても、祖先の非公開・予約公開条件を満たさない項目は読者から見えません。",
    "studioApplyPublishedDraft": "保存済み下書きを公開版へ反映",
    "studioHide": "非公開にする",
    "studioShow": "公開に戻す",
    "studioPublicStartDate": "公開開始日時",
    "studioSetDate": "日時を設定",
    "studioDraftPreview": "下書きプレビュー",
    "studioChooseItem": "編集する項目を選択してください",
    "studioChooseItemHint": "左のライブラリから選ぶか、新しくシリーズを作成してください。",
    "studioAuthorLibrary": "作者ライブラリ"
};
  for (const [key, expected] of Object.entries(labels)) {
    assert.equal(translateUiMessage(key, 'ja'), expected, key);
    assert.equal(translateUiMessage(key, 'unknown'), expected, key + ' fallback');
  }
});
