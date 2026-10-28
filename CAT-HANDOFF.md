# CAT-TDD引継ぎ（草案／not-run）

このZIPは**実装ドラフト**であり、CAT-TDDの正規guardを経たproduction commitではありません。

## 正本と参照
- 現行要件: Google Drive `forGPT/Eternalia_Novel/`、特に `100_機能仕様.md`、`215_採用技術・原稿公開方式_20261028.md`
- 本コードが対象とした意味: `PB-03`, `PB-05`, `PB-10`〜`PB-12`、下書き保存と公開版更新の分離（`215`）
- 対象リポジトリ: `surumeneco/Eternalia_Novel`、確認済み `main@7d23cbf43b37bcafef29abacdb6802657ae16cdc`
- 開始フロー: `issue-work` → `specification`。実装Workは正規closure後の `spec-implementation` にhandoffする。

## 非実施／制約
- CAT-TDD正本のruntime/doctor、scope order、handoff guard、process-closure、TestModel/vectors、Queue生成、Red/Green、実装conformance：**not-run**。
- このZIP内の`exploratory/*.test.mjs`は、CAT生成テストの代用品ではない。正式テストのoracleやQueueへ転記してはならない。
- npm依存はネットワーク不能によりインストールしていないため、Nest/Nuxt起動、API-to-DB接続、OAuth、E2E/CIは未実証。
- PostgreSQLは開発用Compose定義のみ。スキーマとマイグレーションは未実装。

## 次の正規手順
1. CAT-TDD pinned/runtime（`routing.json`、`cat_flow.py`を含む）と対象repoをチェックアウトする。
2. `doctor`→issue-work／最深ready scope選定→spec closure→明示handoffを実行する。
3. CAT生成モデル・テストに従い、必要な変更を**正式な対象repo**で実装する。ドラフトを無条件の製品コードとしてコピーしない。
4. build、Red/Green、Gate、CI、実機・Discord認可・公開境界を独立して検証する。
