---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.app-origin
status: draft
process: eternalia.author
source_refs:
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: author APP_ORIGIN canonical configuration

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author.oauth | OAuth2 redirectの基点とブラウザOrigin |
| eternalia.author.config | 不完全設定時の認証境界 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| origin.exact | APP_ORIGINが設定されたとき | HTTP(S) URLとしてparseでき、入力文字列がcanonical URL.originと完全一致し、userinfoがない場合だけ有効 | AUTH-ORIGIN-01 |
| origin.query | queryまたはfragmentを含むとき | 認証構成を無効とし、部分的に有効なOriginとして扱わない | AUTH-ORIGIN-02 |
| origin.userinfo | usernameまたはpasswordを含むとき | 認証構成を無効とする | AUTH-ORIGIN-02 |
| origin.path | slashで終わるものを含むpathを持つとき | 入力をtrim/正規化して黙認せず、canonical originとの不一致として拒否する | AUTH-ORIGIN-03 |
| origin.incomplete | Originが有効でも他の必須作者認証設定が欠けるとき | 作者認証は利用不能のまま | AUTH-ORIGIN-04 |

## 検証境界

有効例: `https://example.test`, `http://127.0.0.1:3000`。無効例: `https://example.test?next=evil`, `https://example.test#fragment`, `https://user@example.test`, `https://example.test/path`, `https://example.test/`。

本書はCAT **Draft**。既存Node/CIテストは実装証拠であり、正式CAT規範確認・process-closure・model-conformance・vectors・Queueの合格証拠ではない。Discord OAuth2/PKCE実認証、ブラウザcookie、reverse proxy headerの実機受入は未検証である。
