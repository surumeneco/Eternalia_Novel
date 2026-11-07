---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.author-optimistic-concurrency-http
status: draft
process: eternalia.author
source_refs:
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 作者編集と公開版の改訂競合境界（CAT Draft）

## 対象

一人の作者でも複数タブ・再送により競合は起こる。Eternaliaの採用済みの「下書きと明示公開を分離する」条件、および更新競合を検出する設計案に対し、現行アルファ実装の実HTTP契約を探索的に検証する。HTTPコード、競合トークン、同時処理の細則は未決であり、ここに記載する観測用Oracleは新しいConfirmed仕様ではない。

| Ref | Aspect |
| --- | --- |
| eternalia.author | 対象版を指定した変更要求と同時更新の観測 |
| eternalia.publication | 下書き変更と公開済みスナップショットの分離 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| AUTH-CONFLICT-01 | 同一シリーズ/改訂1に対して、Nest直結とNuxt Proxy経由で同時PATCHを各1件 | 成功1件(200)、競合1件(409)。勝者だけがrev2として永続化される | 実HTTP + PostgreSQLで前後比較 |
| AUTH-CONFLICT-02 | 初回明示公開前に最新のrevを読者から直接GET | 404。編集保存だけで公開しない | 実HTTP + PostgreSQLで前後比較 |
| AUTH-CONFLICT-03 | 現在rev2に対して旧rev1で公開要求 | 409、匿名公開は依然404 | 実HTTP + PostgreSQLで前後比較 |
| AUTH-CONFLICT-04 | rev2で公開後、rev2の下書きを編集してrev3に進める | 公開版は以前の本文を保持 | 実HTTP + PostgreSQLで前後比較 |
| AUTH-CONFLICT-05 | rev3に対し古いrev2で可視性変更・公開要求 | 双方409、管理データも公開スナップショットも不変 | 実HTTP + PostgreSQLで前後比較 |

合成作者セッションは専用の使い捨てPostgreSQL DBで検証する。既存のHTTPルートを直接使い、実Discord OAuth2や実ユーザー、手動ブラウザ競合操作は検証しない。

## Gateの区別

この文書は`issue-work`の検証Draft。正規`spec-test-sync`に必要なConfirmed Process/PI/TCEやScript-owned closure/model-conformanceは存在を確認できていない。機械的構文検査と実HTTPテストの成功は正規Process Closure・Model Conformance・Implementation Conformanceを代替しない。
