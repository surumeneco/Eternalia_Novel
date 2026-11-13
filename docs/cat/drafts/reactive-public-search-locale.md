---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.reactive-public-search-locale
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開検索の固定分類ラベルを言語切替直後に更新（Draft）

## 根拠と境界
採用済CM-08/AC-59/75の基幹固定UI ja/en。ユーザーが検索語、言語、シリーズ、絞込順を操作している最中もページ再ロードなしに表示文言を更新する。作者が作成した作品タイトル・本文・カテゴリ名・語義は翻訳しない。既存のuseUiLocale()の共有反応状態を再利用する。

## 観測された不整合
apps/web/app/pages/search.vue の domains 配列と kindLabels マップが setup 中に t() を一度だけ実行し、公開検索画面でその後の言語切替では表示が更新されない。シリーズ・読者公開ページはPR #51でリアクティブ化済みであり、この画面は取り残し。

| ID | 条件 | 要求 |
| --- | --- | --- |
| SEARCH-01 | /search でja→enを切替 | 領域選択のすべての固定optionと検索結果の種類ラベルを英語へ即更新する |
| SEARCH-02 | 同画面でen→jaを切替 | ページを再読込せず日本語へ復帰する |
| SEARCH-03 | 切替前にシリーズ・検索語・領域絞込・順序を選択 | 編集状態と匿名表示項目ID・作者のタイトル/本文を変更しない |
| SEARCH-04 | 公開検索が匿名・非公開に遭遇 | 既存の公開ツリーAPIによる境界を維持、非公開の名前・本文・件数を追加で開示しない |

## Gate境界
本DomainSpecはDraft。正規CAT Gate/人間の実機受入と、探索的HTTP/Chromium実行成功を混同しない。
