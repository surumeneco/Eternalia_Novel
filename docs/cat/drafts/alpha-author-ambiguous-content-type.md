---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.media-type
status: draft
process: eternalia.author
source_refs:
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: author mutation Content-Type ambiguity

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author.write | 作者による変更HTTP要求のmedia typeとOrigin |
| eternalia.author.proxy | proxyによる複合Content-Type表現 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| media.single | Content-Typeにcommaが含まれるとき | media typeを曖昧として拒否する。先頭のapplication/jsonだけを切り出して許可しない | AUTH-MEDIA-09, AUTH-MEDIA-10 |
| media.json | Content-Typeがapplication/json、または単一のapplication/json; charset=utf-8であるとき | 別途Originと作者認証が適合する場合にのみ変更を許可する | AUTH-MEDIA-11 |
| media.origin | Content-Typeが正しくてもOriginが不一致のとき | 変更を拒否する | AUTH-MEDIA-12 |
| media.other | 単一media typeがJSON以外、または不正形式のとき | 変更を拒否する | existing author write contract |

## 検証境界

`application/json; charset=utf-8, text/plain` と `application/json; charset=utf-8, application/x-www-form-urlencoded` は無効。 `application/json; charset=utf-8` はOriginと認証が有効な場合に限り許可する。

本書はCAT **Draft**。正式なCAT機械Gate、Discord OAuth2/PKCE実認証、ブラウザcookie、proxy構成の受入はnot-run。実装済み局所guardのCI成功を規範Confirmedと混同しない。
