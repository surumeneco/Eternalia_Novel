---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.author-session-cookie-ambiguity
status: draft
process: eternalia.auth
source_refs:
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# Alpha: ambiguous author-session cookie rejection (CAT Draft)

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.auth | `DiscordAuthService.isAuthor` が読む作者セッションcookieの一意性 |
| eternalia.author | 重複したcookie headerから編集権限を推定しない認可境界 |

OAuth state-cookieの重複拒否（PR #8）とは別に、ログイン後の `eternalia_author` session-cookieの重複を検証する。現行 `cookieValue` は最初の一致を採用するため、同名cookieが二つある場合はheader順序に依存して認可が成立し得る。異なるPathを持つcookieがブラウザから送られる場合もあるため、重複拒否はcookie移行/cleanupを含む規範判断が必要。これは認証設計のDraftであり、現行実装の正当な変更許可ではない。

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| auth.session.duplicate-conflict | 異なる値の有効形式 `eternalia_author` cookieが2つある | 認可を拒否し、DB照会前にfalseとする | AC-SESSION-COOKIE-01 |
| auth.session.duplicate-identical | 同一値の `eternalia_author` cookieが2つある | 重複を一意のセッション証拠とみなさず、DB照会前にfalseとする | AC-SESSION-COOKIE-02 |
| auth.session.single | 有効形式のcookieが1つだけある | 既存のdigest照会を1回行い、登録済み作者の結果を返す | AC-SESSION-COOKIE-03 |

## Test model / TCE

- AC-SESSION-COOKIE-01 (Red): 64文字の異なる2つのsession tokenで `isAuthor` はfalse、DB照会0件。
- AC-SESSION-COOKIE-02 (Red): 64文字の同じsession tokenを2回提示してもfalse、DB照会0件。
- AC-SESSION-COOKIE-03 (Green): 1つの登録済みtokenではtrue、DB照会1件。

## 検証・Gate

PR #8の重複OAuth state-cookie testとは独立の、session authorization boundaryに対する合成Nodeテスト。実Discord OAuth2/PKCE、cookie path collision、HTTPブラウザ、PostgreSQL実データは検証対象外。

**Draft / not Confirmed.** 規範Process/PI/TCEの確認、process-closure、TestModel、model-conformance、vectors、Queue、current-item、implementation-conformanceおよび実機HTTP/ブラウザ受入は not-run。意図的Redを認可実装の変更許可とみなさない。
