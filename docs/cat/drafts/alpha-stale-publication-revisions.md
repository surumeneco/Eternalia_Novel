---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.revision-conflict
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: 公開・可視性変更のrevision競合

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.publication | draft/public snapshotとrevision |
| eternalia.author | 模擬作者session・write-origin guard |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| publication.stale-publish | draft revision 2の後にexpectedRevision 1で公開要求するとき | HTTP 409で拒否し旧公開本文を維持する | SC-PUBLIC-REV-01 |
| publication.current-publish | draft revision 2にexpectedRevision 2で公開要求するとき | 承認本文を公開する | SC-PUBLIC-REV-02 |
| publication.stale-visibility | visibility変更に古いexpectedRevision 1が渡されたとき | HTTP 409で拒否し公開章の表示状態を保持する | SC-PUBLIC-REV-03 |
| publication.synthetic-scope | 模擬作者sessionでrevision検証するとき | 匿名・非本人拒否と実Discord OAuth2/PKCEを別受入として保持する | SC-PUBLIC-REV-04 |
| publication.future-revision | publishまたはvisibilityに未来のexpectedRevisionが渡されたとき | 古いrevisionと同様に409で拒否し公開snapshot/visibilityを変更しない | SC-PUBLIC-REV-05 |
| publication.mutation-origin | 認証済み作者のPATCH/DELETE変更要求を処理するとき | write-origin policyを要求する | SC-PUBLIC-REV-04 |
| publication.read-origin | GET/HEADの参照要求を処理するとき | write-origin policyを変更要求と同様には強制しない | SC-PUBLIC-REV-04 |

## 境界と状態

既存SC-PUBLIC-REV-01〜05と追加PATCH/DELETE guardを意味変更せず構造化したTASK-20261101-008のCAT Draft。HTTP/DBの模擬作者sessionによる検証は実Discord OAuth2/PKCE、非本人ブラウザ・公開UIの受入を代替しない。正式CAT Process/PI/TCE・機械Gateはnot-run。Confirmed・マージ・デプロイを意味しない。
