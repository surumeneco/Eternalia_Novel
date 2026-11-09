---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.browser-csrf-oauth-boundary
status: draft
process: eternalia.author
source_refs:
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 作者認証の実ブラウザ Origin/CSRF と OAuth 開始・戻り境界（CAT Draft）

## 対象

採用済みの「本人のみ編集・公開」とDiscord OAuth2認証を対象とする。現行α実装でのHTTP Origin検査・Cookie属性・PKCE・state検証を、実ChromiumとNest/Nuxt HTTPで探索的に確認する。OAuthプロバイダ実認証やトークン交換を模擬合格とせず、作者IDと機密データの漏出・権限昇格を防ぐ境界に限定する。

| Ref | Aspect |
| --- | --- |
| eternalia.author | 有効な作者Cookieがあっても別Originからの変更要求は拒否 |
| eternalia.oauth | ログイン開始時のstate/PKCE、戻り時の不正stateの拒否 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| AUTH-BROWSER-01 | Chromiumで作者セッションを保持したまま、異なるポートの攻撃ページからHTML form POSTをNest/Nuxtへ送信 | Cookieが実際に添付された変更要求でもHTTP 403、作者管理情報・メモ・公開稿は変化しない | 実Chromium、HTTP、PostgreSQL |
| AUTH-BROWSER-02 | 同じ攻撃ページからログアウト用form POSTをNest/Nuxtへ送信 | HTTP 403、正規作者セッションは失効しない | 実Chromium、HTTP、PostgreSQL |
| AUTH-OAUTH-01 | GET /api/auth/discord でOAuth開始 | 302/303でDiscord認可へ、state/PKCE S256/redirect先とHttpOnly/SameSite cookieを確認 | 実HTTP+PostgreSQL |
| AUTH-OAUTH-02 | callbackへの不一致state、Cookie不足、issuer不一致等の入力 | 401、作者セッションが新規発行されず、Discordトークン交換に到達しない | 実HTTP+PostgreSQL |
| AUTH-OAUTH-03 | Discord APIを局所的に模擬し、返却Discord IDを作者ID／非作者IDに切り替える | PKCE verifier照合、state一回限り使用、本人だけにランダムなアプリ側セッションを発行し、logout後に失効すること。非作者は拒否 | 模擬Discordフェッチ + 実PostgreSQL |

規範上、具体的なCookie仕様・HTTPパス・コードやエラー契約は詳細未決である。これらのassertは現行α実装の観測用Oracleであり、新規の確定仕様・正式TestModel・正規Gateではない。

## 未検証境界

- Discord実OAuth2認可コード/トークン交換、本人アカウント確認は対象外。
- 第三者ドメインでの本番HTTPS/跨サイトCookie動作、実端末Chrome/Androidの確認は対象外。
- CAT Confirmed、Process Closure、Model Conformance、TDD Queue、Implementation Conformanceは未実施。
