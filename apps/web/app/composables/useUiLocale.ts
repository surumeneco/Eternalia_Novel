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
    retry: '再試行',
    menu: 'メニュー',
    close: '閉じる',
    browse: '閲覧する',
    backToTop: 'ページ先頭へ戻る',
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
