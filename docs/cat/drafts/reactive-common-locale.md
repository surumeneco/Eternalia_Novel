---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.reactive-common-locale
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://drive.google.com/file/d/1DkwRXiAkwtBY2x4TC7lLt-U7pxt4cAgR/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 固定UIラベルの反応的なja/en表示（Draft）

## 観測事実と規範境界

CM-08 / CM-09 / AC-59・66・75は、ホーム・辞書・検索・書斎で日本語/英語の固定UI表示を要求する。作者作成の本文・タイトルは翻訳しない。現行書斎`studio.vue`は`kinds`と`filters`をsetup時に固定文字列で構築しており、既存のグローバル言語切替時に表示ラベルが残留する。辞書の公開一覧ページ`dictionaries.vue`には日本語固定のタイトル/説明がある。新着/検索の公開日表示にも`ja-JP`で固定された日時がある。修正には既存の共通`useUiLocale`と採用済みのJST表示関数を使用する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.studio-labels | 書斎ライブラリ種類名と領域フィルタ表示を現在の言語に連動させる |
| eternalia.ui.dictionary-index | 辞書公開一覧の見出しと案内を共通翻訳カタログから取得 |
| eternalia.ui.public-date | ホーム新着と検索の公開更新日時をja/enとJSTに従って表示 |
| eternalia.ui.authored-content | 言語切替で入力フォームの値や作品テキストを変更しない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| LABEL-01 | 作者が書斎でja→en→jaを切替 | ノード種類名・領域フィルタ名はページ再読み込みせず表示言語へ追従 | LABEL-01 |
| LABEL-02 | 作者が編集中にUI言語を切替 | 選択ノード、下書きフォーム、未保存本文は維持 | LABEL-02 |
| LABEL-03 | 読者が辞書公開一覧で言語を切替 | 見出し・説明は翻訳され、作者作成のシリーズ名は変化しない | LABEL-03 |
| LABEL-04 | ホーム新着と公開検索でja/enを切替 | 更新日表示は端末TZに依存せずJSTで、選択した言語に追従 | LABEL-04 |
| LABEL-05 | 匿名読者が作者専用機能に遭遇 | 言語切替に関わらず作者編集APIを使用できない | LABEL-05 |

## CAT境界

このDomainSpecは採用済み要件の現行実装へのDraft投影であり、Confirmedへの自動昇格・規範Gate合格を意味しない。探索的Node/Chromium/CIと実機/実Discord手動受入を区別する。
