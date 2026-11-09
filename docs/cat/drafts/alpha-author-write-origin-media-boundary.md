---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.author-write-origin-media-boundary
status: draft
process: eternalia.auth
source_refs:
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 作者の変更要求におけるOrigin・media type境界（CAT Draft）

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.auth | `AuthorGuard` の操作別の認可および変更要求の入力検査 |
| eternalia.publication | 拒否後の公開投影・作者管理データの不変性 |

## 決定境界

採用済みの「Discordで本人認証された作者のみが変更できる」「クライアントの自己申告を信頼しない」要件と、現行の `AuthorGuard` / `DiscordAuthService.assertWriteOrigin` を照合する探索的なHTTP受入試験。TaskQueue `TASK-20261101-008` の部分作業である。

具体的なOrigin/Content-Typeの許可規則、エラーコード、CSRFトークン導入の是非は詳細設計では未決であり、本Draftは新しい規範仕様のConfirmed昇格を意味しない。以下は既存のα版実装の境界を回帰検証する観測用の条件である。

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| AUTH-WRITE-ORIGIN-01 | 登録済み作者のセッションでも、変更要求のOriginが欠落 | 403、状態変更なし | 実HTTPと状態比較 |
| AUTH-WRITE-ORIGIN-02 | 登録済み作者のセッションでも、Originが他サイトまたは`null` | 403、状態変更なし | 実HTTPと状態比較 |
| AUTH-WRITE-MIME-03 | 登録済み作者のセッションでも、変更要求のContent-Typeが欠落・`text/plain` | 403、状態変更なし | 実HTTPと状態比較 |
| AUTH-WRITE-CONTROL-04 | 登録済み作者のセッションのGET管理情報取得 | 既存の作者読取境界を維持する | GET受入 |
| AUTH-WRITE-STATE-05 | 拒否要求の前後で管理データ・公開投影を比較 | 既存レコード・revision・公開版に差分がない | 前後スナップショット比較 |

対象HTTP面はNest直結とNuxt proxyの両方。変更操作にはノード作成・編集・公開・可視性変更・順序変更・メモ作成を含む。テスト用の作者セッションは使い捨てPostgreSQLに投入した合成セッションであり、Discord実OAuth2やブラウザCSRFの証明にはならない。

## Gateと実施境界

`issue-work` の探索的検証として扱う。これは非規範Draftであり、正式な`spec-test-sync`用のConfirmed仕様ではない。正規Process Closure、TestModel、Model Conformance、vectors、Queue、Implementation Conformanceの通過を宣言しない。実HTTPテスト、CI、成果物・対象コミットは別々に実測する。
