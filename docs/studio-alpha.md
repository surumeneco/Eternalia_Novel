# 作者Studioの実装と検証境界

`/studio` と `/studio/order`、`/studio/publication`、`/studio/memos` が作者管理UIの入口。**機能の実在は現在の `apps/web/app/pages/` と `apps/web/app/components/`、アクセス制御はNest/Nuxt API実装で確認する。**本書は実装説明であって仕様の採否・実機受入判定を行わない。

## 現行コードに対応する操作

- シリーズ→編→部→章、設定カテゴリ/Tip/TipSection、言語/単語/文法、年代区分/出来事を作者側で選択し、新規作成・編集・保存する。
- 下書き保存と明示公開版反映を別操作として扱い、改訂番号による競合を検出する。公開状態・公開開始日時の入力と、祖先による実効可視性の判定は分離する。
- カテゴリの項目プリセットは `CategoryPresetEditor.vue`、設定タグ・関連設定は `TipLinksEditor.vue`、単語の意味/品詞・意味別語源は `WordMeaningsEditor.vue`、言語構造は `LanguageStructureEditor.vue` が担当する。これらの**UIの存在は全入力経路の実機受入済みを意味しない**。
- 公開・並べ替え・メモはそれぞれ管理ページを持つ。章ページ配列、読者向け公開API、公開版スナップショットとの整合性は対応するテストとAC台帳で確認する。
- 作者APIはOAuth2で確認された主体に対するサーバー側の作者権限判定を要求する。合成セッション/Chromiumの認可試験は実Discordアカウント試験とは独立。

## 受入の所在

具体的な採用要件は [Driveの100_機能仕様.md](https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view)、公開・データの設計はDriveの300/310が正本。自動テスト・未検証条件は [AC台帳](alpha-ac-traceability.md)、実Discord・日本語IME・実端末・旧画面比較は [MAN台帳](alpha-manual-acceptance.md) を参照する。既存部品があることを理由に未確認の仕様をpassとせず、旧版の実装候補を自動的に未実装Workとして復活させない。
