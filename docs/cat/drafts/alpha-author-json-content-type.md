---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.json-media-type
status: draft
process: eternalia.author
source_refs:
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: 作者変更要求のJSON media type

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author | 認証済み作者のstate-changing HTTP要求 |
| eternalia.http | same-originとContent-Type guard |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| author.json.prefix | Content-Typeがapplication/jsonpまたはapplication/json-malformed等のprefix類似値のとき | 変更要求を拒否する | AUTHOR-JSON-01 |
| author.json.exact | Content-Typeがapplication/jsonまたは通常のcharset等のsemicolon parameterを持つとき | JSON media typeとして受理する | AUTHOR-JSON-02 |
| author.json.missing | Content-Typeが欠損・空・非JSONのとき | 変更要求を拒否する | AUTHOR-JSON-03 |
| author.json.independent | state-changing author requestを受けるとき | 同一originと作者認証をContent-Typeとは独立して要求する | AUTHOR-JSON-04 |
| author.json.no-prefix | Nest body parserがJSONとして処理し得る場合でも | Content-Typeのprefix一致だけでwrite-origin guardを通さない | AUTHOR-JSON-01 |

## 境界と状態

既存AUTHOR-JSON-01〜04を意味変更せず構造化したTASK-20261101-008のCAT Draft。通常のsemicolon parameterを許すが、パラメータ構文の完全なHTTP parser適合性や実Discord OAuth2/PKCEは別途検証する。正式CAT Process/PI/TCE・機械Gate、実アカウント試験はnot-run。Confirmed・マージ・デプロイを意味しない。
