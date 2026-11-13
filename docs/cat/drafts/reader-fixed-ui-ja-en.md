---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.reader-fixed-ja-en
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開閲覧画面の固定文言のja/en切替（Draft）

## 採用意味論

2026-11-12採用のCM-08、AC-59/75。日本語・英語の対象は固定UI・エラー・操作表示。作品のタイトル・小説本文・世界設定・辞書本文・創作言語文字列は翻訳しない。既存のuseUiLocaleと英語カタログを再利用し、独立した言語状態や新しい自動翻訳サービスを作らない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.reader | 公開シリーズ、本文、設定、辞書、年表のナビゲーション・入力・空/エラー状態 |
| eternalia.ui.reader-label | 型名・タグ・語義・文字・前後ナビ等の読者に見える固定表示 |
| eternalia.ui.reader-state | CookieとSSR/CSRの切替および作者作成コンテンツの不変性 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| READER-01 | 言語がjaまたはen | 公開画面の固定見出し・検索条件・案内・日時ラベルを表示言語に切り替える。既存ja表示を壊さない | READER-01 |
| READER-02 | 項目タイトル、説明、本文等に日本語・創作語が含まれる | 言語を変更しても作者の文字列を変更せず、匿名可視性を維持する | READER-02 |
| READER-03 | シリーズ内の領域表示とパンくず | ページ遷移せずに言語切替した直後も全ての固定文言を更新する。セットアップ時の単発t()値に閉じ込めない | READER-03 |
| READER-04 | エラー・ロード中・公開中の項目なし | 固定メッセージをja/enで表示。公開済み・下書き非公開の境界を変更しない | READER-04 |
| READER-05 | 不明な言語名 | 既定jaフォールバックで固定表示を継続する | READER-05 |

## 検証範囲

公開シリーズ画面・物語目次・章の前後リンク・項目詳細・辞書/設定/年表の検索・フィルタ・表示状態。既存の作者向け固定UI翻訳、Chrome 390pxの操作と設定保持、匿名APIの公開境界を回帰対象とする。

## Gate境界

本DomainSpecはDraftであり、AI生成案をConfirmedと見なさない。既存カタログの翻訳済みキーやCIグリーンはCAT Process Closure、Model Conformance、Implementation Conformanceの機械検証を代替しない。
