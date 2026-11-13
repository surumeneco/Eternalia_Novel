---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.http-cross-domain-privacy
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# PB-05 / AC-45・54・55・70: 予約公開の匿名HTTP横断受入 Draft

## 既存決定

公開日時のUIはJST、保存と比較はUTC epoch milliseconds。自身と全祖先の「公開稿あり」「isPublic」「publicSince <= now」の全条件で匿名閲覧可。設定、辞書、年表、本文の4領域に共通。公開開始時刻そのものは等号を含める。下書きは公開版へ明示反映しない限り漏出しない。

## 観測済み自動証拠との違い

PR #55 は端末TZから独立したJST入力、4領域の純粋ドメイン時刻境界、Chromium上の作者日付入力を検証。残る「実PostgreSQL/Nest/Nuxtで4領域の公開日時変更→匿名直URL/ツリー/新着/祖先ブロック→回復」を独立してテストする。将来時刻は固定の長期日付を使用し、外部実時刻を偽装した境界試験ではない。

## 受入モデル

| ID | 操作 | 期待結果 |
| --- | --- | --- |
| HTTP-SCHEDULE-01 | 作者が4領域の要素を公開稿反映後、未来時刻へ予約 | 作者APIはUTC epochを保持、匿名Nuxt/Nest両HTTP直取得404、ツリー・新着には項目が出ない |
| HTTP-SCHEDULE-02 | 予約日時をクリアして即時公開 | 同じ公開稿が匿名HTTP 200で取得できる。名称/本文とIDは保持 |
| HTTP-SCHEDULE-03 | 公開子孫を残したまま親シリーズを未来時刻へ予約 | シリーズ一覧・直取得・子孫ツリー/新着から全4領域が隠れ、公開可能時刻へ戻すと内容が復帰 |
| HTTP-SCHEDULE-04 | 作者以外の書込み | 既存ガードが拒否し、公開稿・日時を書き換えない |

## Gate境界

本ArtifactはCAT Draft。既存の利用者採用仕様からの探索的受入追加であって、規範Confirmed・正規CAT spec-test-sync/Process Closure/Model Conformance/Queue成功は宣言しない。
