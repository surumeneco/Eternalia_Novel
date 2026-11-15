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

## 観測と正式検証の境界

PR #55は端末タイムゾーンから独立したJST入力を、PR #56は4領域の予約公開と匿名投影を、PR #67は実PostgreSQL・Nest HTTPで時刻境界（T-1ms、等号、T+1ms）を探索的に検証した。これは独立した機能実装と部分自動証拠であり、正式CAT Gateの実行結果ではない。未来日時やテスト時計の注入は、外部実時刻や実OSブラウザ履歴を完全に代替しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.publication.scheduled | 4領域の公開稿と公開日時の保存・読み出し |
| eternalia.publication.reader | 匿名HTTP・ツリー・新着の公開投影 |
| eternalia.publication.ancestor | 親シリーズの予約公開による全子孫の遮断と復帰 |
| eternalia.publication.author | 作者以外の状態更新を拒否する認可境界 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| HTTP-SCHEDULE-01 | 作者が4領域の公開稿を作成後、公開日時を未来へ設定 | UTC epochを保持し、匿名Nuxt/Nest両HTTP直取得404、ツリー・新着から対象を除く | 探索的HTTP/PG、正式Gate未実施 |
| HTTP-SCHEDULE-02 | 未来予約の公開日時をクリアして即時公開へ変更 | 同一公開稿のID・名称・本文を保持して匿名HTTP 200へ復帰 | 探索的HTTP/PG、正式Gate未実施 |
| HTTP-SCHEDULE-03 | 公開子孫を持つ親シリーズを未来時刻へ予約 | シリーズ一覧・直取得・子孫ツリー/新着の4領域をすべて遮断し、公開可能時刻への復帰で内容を再提示 | 探索的HTTP/PG、正式Gate未実施 |
| HTTP-SCHEDULE-04 | 作者権限を持たない主体が予約日時や公開状態を書き換える | 既存認可ガードが拒否し、公開稿・日時を変更しない | 探索的HTTP/PG、実Discord未実施 |

## Gate境界

本ArtifactはCAT Draft。既存の利用者採用仕様からの探索的受入追加であって、規範Confirmed・正規CAT spec-test-sync/Process Closure/Model Conformance/Queue成功は宣言しない。
