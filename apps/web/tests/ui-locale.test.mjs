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

test('publication management fixed text uses typed Japanese fallback keys', () => {
  const labels = {
    "pubNoSnapshot": "公開版なし",
    "pubSelfPrivate": "自身が非公開",
    "pubDateUnset": "公開日時未設定",
    "pubPending": "公開待ち",
    "pubAncestorPrivate": "親による非公開",
    "pubVisible": "閲覧可能",
    "pubLoadError": "公開管理データを取得できません。",
    "pubDateRequired": "公開開始日時を入力してください。",
    "pubDateSaved": "公開開始日時を更新しました。",
    "pubDateSaveFailed": "日時の変更に失敗しました。競合の可能性があるため再読込してください。",
    "pubPublishConfirm": "保存済みの下書きを公開版に反映し、公開設定を有効にします。よろしいですか？",
    "pubPublishFirst": "公開版がない項目は、先に公開版を作成してください。",
    "pubUpdated": "公開設定を更新しました。",
    "pubUpdateFailed": "更新に失敗しました。再読込して改訂番号を確認してください。",
    "pubBackToEdit": "執筆・編集へ戻る",
    "pubAuthNotConfigured": "作者認証が設定されていません。",
    "pubLoginRequired": "公開管理には作者としてのログインが必要です。",
    "pubSectionLabel": "領域",
    "pubStories": "ストーリー",
    "pubVisibilityLabel": "公開状態",
    "pubHidden": "閲覧不可",
    "pubSearchLabel": "名称を検索",
    "pubSearchPlaceholder": "シリーズ・項目名",
    "pubResultsLabel": "表示",
    "pubResultsUnit": "件",
    "pubLoading": "公開状態を読み込んでいます。",
    "pubEmpty": "該当する項目はありません。",
    "pubSelfLabel": "自身：",
    "pubPublic": "公開",
    "pubPrivate": "非公開",
    "pubSnapshotLabel": "公開版：",
    "pubYes": "あり",
    "pubNo": "なし",
    "pubDateLabel": "公開日時：",
    "pubUnset": "未設定",
    "pubUpdateSnapshot": "公開版を更新",
    "pubMakePublic": "公開にする",
    "pubSaveDate": "日時を保存",
    "pubEdit": "編集"
};
  for (const [key, expected] of Object.entries(labels)) {
    assert.equal(translateUiMessage(key, 'ja'), expected, key);
    assert.equal(translateUiMessage(key, 'unknown'), expected, key + ' fallback');
  }
});

test('author memo UI fixed text uses typed Japanese fallback keys', () => {
  const labels = {
    "memoDiscardConfirm": "未保存のメモがあります。破棄しますか？",
    "memoLoadError": "メモを取得できませんでした。",
    "memoSaved": "メモを保存しました。",
    "memoSaveFailed": "保存に失敗しました。改訂番号の競合を確認してください。",
    "memoAuthChecking": "認証を確認しています。",
    "memoLoginRequired": "作者としてログインするとメモを編集できます。",
    "memoNew": "新規メモ",
    "memoSearch": "メモを検索",
    "memoSearchPlaceholder": "タイトル・本文・タグ",
    "memoEmpty": "該当するメモはありません。",
    "memoEdit": "メモを編集",
    "memoBody": "本文",
    "memoTags": "タグ（カンマ区切り）",
    "memoTagsPlaceholder": "人物, 調査",
    "memoRevision": "改訂",
    "memoSave": "保存",
    "memoChoose": "左の一覧からメモを選ぶか、新しく作成してください。"
};
  for (const [key, expected] of Object.entries(labels)) {
    assert.equal(translateUiMessage(key, 'ja'), expected, key);
    assert.equal(translateUiMessage(key, 'unknown'), expected, key + ' fallback');
  }
});

test('author ordering UI fixed text uses typed Japanese fallback keys', () => {
  const labels = {
    "orderAllSeries": "全シリーズ",
    "orderAll": "全体",
    "orderLoadError": "項目を取得できませんでした。",
    "orderConfirm": "この操作は公開中の項目の表示順にも反映されます。並べ替えますか？",
    "orderSaved": "順序を反映しました。",
    "orderReloadFailed": "順序変更の送信後、最新状態を取得できませんでした。再読込して確認してください。",
    "orderSaveFailed": "並べ替えに失敗しました。競合の可能性があります。再読込してください。",
    "orderDiscard": "未反映の並べ替えを破棄しますか？",
    "orderDescription": "同じ親・同じ種類の項目を並べ替えます。反映すると公開中の表示順も変更されます。",
    "orderAuthNotConfigured": "作者認証が設定されていません。",
    "orderLoginRequired": "作者としてログインしてください。",
    "orderParentLabel": "親となる項目",
    "orderKindLabel": "項目の種類",
    "orderLoading": "項目を取得しています。",
    "orderEmpty": "この階層に項目はありません。",
    "orderMoveUpSuffix": "を上へ移動",
    "orderMoveDownSuffix": "を下へ移動",
    "orderUp": "上へ",
    "orderDown": "下へ",
    "orderUndo": "変更を取り消す",
    "orderReload": "サーバーから再読込",
    "orderApply": "表示順を反映",
    "orderBack": "執筆・編集に戻る"
};
  for (const [key, expected] of Object.entries(labels)) {
    assert.equal(translateUiMessage(key, 'ja'), expected, key);
    assert.equal(translateUiMessage(key, 'unknown'), expected, key + ' fallback');
  }
});

test('structured author editors use typed Japanese fallback labels', () => {
  const labels = {
    "wordMeaningsLegend": "単語の意味と語源",
    "wordMeaningsNote": "意味は品詞が同じでも別々に保持します。語源は意味ごとに登録できます。",
    "wordMeaningParseError": "意味データを読み込めません。元データの確認が必要です。",
    "wordMeaningTitle": "意味",
    "wordMeaningDelete": "意味を削除",
    "wordPartOfSpeech": "品詞",
    "wordUnspecified": "未指定",
    "wordLegacy": "旧値",
    "wordPartOfSpeechPlaceholder": "名詞・動詞など",
    "wordDefinition": "意味・説明",
    "wordEtymologies": "この意味の語源",
    "wordReferenceLanguage": "参照する言語",
    "wordNoReference": "参照なし",
    "wordReferenceWord": "参照する単語",
    "wordOriginNote": "語源の説明",
    "wordOriginDelete": "語源を削除",
    "wordOriginAdd": "語源を追加",
    "wordMeaningAdd": "意味を追加",
    "presetLegend": "設定項目のプリセット",
    "presetNote": "新しく作る設定にのみ、この時点の項目名・順序・本文を複製します。既存の設定は変更されません。",
    "presetParseError": "プリセットのデータ形式が正しくありません。JSONを修正してください。",
    "presetName": "項目名",
    "presetBody": "テンプレート本文",
    "presetDelete": "削除",
    "tipLinksAria": "設定のタグと関連",
    "tipTags": "タグ",
    "tipTagName": "タグ名（カンマ区切り）",
    "tipTagPlaceholder": "人物, 地名",
    "tipTagNote": "カテゴリとは独立した分類です。入力を確定してから下書きを保存してください。",
    "tipRelated": "関連する設定",
    "tipSameSeries": "同じシリーズの設定",
    "tipSelect": "選択してください",
    "tipAddRelated": "関連に追加",
    "tipNoRelated": "関連設定はありません。",
    "tipUpSuffix": "を上へ",
    "tipDownSuffix": "を下へ",
    "tipRemoveSuffix": "を削除",
    "tipRemove": "解除",
    "tipPrivacyNote": "関連先の公開可否を確認し、読者には実効公開中の設定だけ表示します。",
    "langCharactersLegend": "文字と発音",
    "langCharactersNote": "各文字の発音、語頭・語末での許容、および後ろに置ける文字を登録します。",
    "langCharacterParseError": "文字データを解析できません。保存前に元データを確認してください。",
    "langCharacterTitle": "文字",
    "langCharacterDelete": "文字を削除",
    "langGlyph": "文字・表記",
    "langPronunciation": "発音",
    "langCanStart": "語頭に置ける",
    "langCanEnd": "語末に置ける",
    "langFollowing": "この文字の後に置ける文字",
    "langEmptyGlyph": "未入力の文字",
    "langAddCharacter": "文字を追加",
    "langWordClassMaster": "品詞マスタ",
    "langWordClassParseError": "品詞データを解析できません。",
    "langWordClassTitle": "品詞",
    "langWordClassDelete": "品詞を削除",
    "langWordClassName": "品詞名",
    "langDescription": "説明",
    "langAddClass": "品詞を追加"
};
  for (const [key, expected] of Object.entries(labels)) {
    assert.equal(translateUiMessage(key, 'ja'), expected, key);
    assert.equal(translateUiMessage(key, 'unknown'), expected, key + ' fallback');
  }
});

test('shared shell accessibility and navigation labels use Japanese fallback', () => {
  const labels = {
    "shellSearch": "検索",
    "shellGlobalNav": "グローバルナビゲーション",
    "shellAside": "補助情報",
    "shellResourceTypes": "資料の種類",
    "shellFooterDescription": "ストーリー・設定集・辞書・年表"
};
  for (const [key, expected] of Object.entries(labels)) {
    assert.equal(translateUiMessage(key, 'ja'), expected, key);
    assert.equal(translateUiMessage(key, 'unknown'), expected, key + ' fallback');
  }
});

test('public search UI fixed text uses typed Japanese fallback keys', () => {
  const labels = {
    "searchTitle": "公開資料を検索",
    "searchIntro": "公開中のシリーズを選び、ストーリー・設定集・辞書・年表から探します。",
    "searchSelectSeries": "シリーズを選択",
    "searchQueryLabel": "検索語",
    "searchPlaceholder": "名称・本文・タグ・語義",
    "searchSortLabel": "並び順",
    "searchRecent": "公開版の更新が新しい順",
    "searchTitleSort": "名称順",
    "searchManual": "設定された順序",
    "searchChooseSeries": "検索対象のシリーズを選択してください。",
    "searchLoading": "公開資料を読み込んでいます。",
    "searchLoadError": "公開資料を取得できませんでした。シリーズの公開状態を確認してください。",
    "searchResultsUnit": "件の公開資料",
    "searchPublishedUpdated": "公開版更新：",
    "searchEmpty": "条件に一致する公開資料はありません。"
};
  for (const [key, expected] of Object.entries(labels)) {
    assert.equal(translateUiMessage(key, 'ja'), expected, key);
    assert.equal(translateUiMessage(key, 'unknown'), expected, key + ' fallback');
  }
});
