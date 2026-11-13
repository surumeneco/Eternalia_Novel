---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.reader-jst-display
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 読者の章・詳細画面での公開日時JST固定表示（Draft）

## 既定仕様と観測した残差

PB-05では公開日時を日本時間で入力・表示し、UTC epoch millisecondsで保存・比較する。CM-08/AC-59では日本語と英語の固定UIを切替えるが、作者の作品タイトル・本文を自動翻訳しない。ホーム・検索・作者の公開管理は既存 `formatJstDisplay` を利用する。

現在の `read/[id].vue` は `toLocaleDateString(language)`、`items/[id].vue` は `toLocaleString(language)` を使用し、ブラウザOSのタイムゾーンに依存するため、同一公開瞬間でも閲覧環境によって表示日付や時刻が変わる。新しい時刻基準や翻訳仕様を採用せず、既存の共有JST表示関数を使用する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.publication.reader.chapter-time | 公開章の表示日時をJSTに固定し、ブラウザTZで変化させない |
| eternalia.publication.reader.item-time | 設定・単語等の公開項目詳細も同じ表示規則を使う |
| eternalia.publication.reader.locale-time | ja/en切替でも保存済み瞬間・作者テキストを不変にする |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| READER-JST-01 | 同一公開章をAmerica/Los_AngelesとUTC端末で閲覧 | `<time datetime>`は同じUTC ISO瞬間を指し、画面の表示日時はJSTの同一日時になる | READER-JST-01 |
| READER-JST-02 | 同一公開設定をAmerica/Los_AngelesとUTC端末で閲覧 | 詳細画面の公開日時は端末TZによらずJSTの同一日時になる | READER-JST-02 |
| READER-JST-03 | 読者がja/enを切替 | 表示日時のみ言語に従い再描画され、ISO瞬間・公開稿のタイトル/本文は変化しない | READER-JST-03 |

## CAT境界

このDomainSpecは既に採用済みの公開日時・固定UI要件の現行実装へのDraft投影であり、Confirmedへの自己昇格や規範Process Closure/Model Conformance/Queue成功を意味しない。追加のChromium/JUnitは探索的な実ブラウザ証拠であり、実機確認と正式Gateとは分離する。
