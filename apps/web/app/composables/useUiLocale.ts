/** Localize fixed interface text without translating user-authored content.
 * Only Japanese messages are shipped. Additional locales require reviewed
 * translations and an explicit product decision.
 */
export const uiMessages = {
  ja: {
    home: 'ホーム',
    stories: 'ストーリー',
    tips: '設定集',
    dictionaries: '辞書',
    timeline: '年表',
    studio: '作者の書斎',
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
    retry: '再試行',
    menu: 'メニュー',
    close: '閉じる',
    browse: '閲覧する',
    backToTop: 'ページ先頭へ戻る',
    skipToContent: '本文へ移動',
    siteDescription: 'ストーリー、設定集、辞書、年表をシリーズごとに閲覧できます。',
    content: 'コンテンツ',
    publishedSeries: '公開シリーズ',
    recent: '新着・更新',
    loading: '読み込み中です。',
    seriesLoadError: '公開シリーズを取得できませんでした。',
    seriesEmpty: '現在、公開中のシリーズはありません。',
    recentLoadError: '更新情報を取得できませんでした。',
    recentEmpty: '公開された更新情報はありません。',
    storyDescription: '編・部・章と本文',
    tipsDescription: 'カテゴリ・設定・項目',
    dictionaryDescription: '言語・語彙・文法',
    timelineDescription: '年代区分と出来事',
    chapter: '章',
    tip: '設定',
    tipSection: '設定項目',
    word: '単語',
    grammar: '文法',
    event: '出来事',
    collectionLoading: '公開シリーズを読み込んでいます。',
    collectionEmpty: '現在閲覧できるシリーズはありません。',
    storiesCollectionDescription: 'シリーズごとの編・部・章・本文を閲覧します。',
    tipsCollectionDescription: 'シリーズに属するカテゴリ・設定・設定項目を閲覧します。',
    dictionaryCollectionDescription: 'シリーズの創作言語、単語、文法を閲覧します。',
    timelineCollectionDescription: 'シリーズの年代区分と出来事を閲覧します。',
  },
} as const;

export type UiMessageKey = keyof typeof uiMessages.ja;
export type UiMessageCatalog = Record<UiMessageKey, string>;

export function translateUiMessage(
  key: UiMessageKey,
  language: string,
  additionalCatalogs: Readonly<Record<string, UiMessageCatalog>> = {},
): string {
  if (language !== 'ja' && Object.prototype.hasOwnProperty.call(additionalCatalogs, language)) {
    return additionalCatalogs[language]![key];
  }
  return uiMessages.ja[key];
}

export function useUiLocale() {
  const language = useCookie<string>('eternalia-ui-language', {
    default: () => 'ja',
    sameSite: 'lax',
    path: '/',
  });
  const t = (key: UiMessageKey) => translateUiMessage(key, language.value);
  return { language, t };
}
