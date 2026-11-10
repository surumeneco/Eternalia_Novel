---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.anonymous-route-protection
status: draft
process: eternalia.author
source_refs:
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: Anonymous browser author-route protection (CAT Draft)

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author | /studio以下の作者専用UIと保護API |
| eternalia.public | 匿名読者の公開4領域の参照境界 |
| eternalia.browser | 実Nuxt/Nest/PostgreSQLに対する未認証ブラウザ検証 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| author.anon.studio | 未認証ブラウザが/studio、/studio/memos、/studio/order、/studio/publicationを開くとき | 作者の非公開本文・メモ・操作可能な編集UIを露出させず、ログイン案内のみを許す | ANON-AUTH-01, ANON-AUTH-02 |
| author.anon.api | 未認証のリクエストが保護管理APIを呼ぶとき | HTTP 401で拒否し、書込・公開状態・作者メモを変更しない | ANON-AUTH-03 |
| author.anon.public | 未認証ブラウザが公開物語・設定・辞書・年代記を読むとき | 公開済みの読者用情報をログインなしで参照可能とする | ANON-AUTH-04 |
| author.anon.evidence | 匿名ブラウザ受入を検証するとき | 実ビルドのNuxt/Nest/PostgreSQLと未認証Playwright contextで検証し、合成作者sessionの成功を匿名の証拠に流用しない | ANON-AUTH-01, ANON-AUTH-03, ANON-AUTH-04 |

## 受入ベクトル（Draft、未実行）

- ANON-AUTH-01: 未ログインcontextで四つの/studio系routeを順に訪れ、非公開本文・メモ・編集操作がDOMに出現しない。
- ANON-AUTH-02: 作者routeがログイン案内を表示しても、作者データを事前取得・埋込HTML・初期状態として渡さない。
- ANON-AUTH-03: Cookieなしで保護APIを呼び、401とDB非変更を照合する。
- ANON-AUTH-04: 同じ未認証contextで公開四領域を参照でき、非公開祖先の情報は公開結果へ混入しない。

## 出典・Gate境界

既存のAU-01〜04、PB-03/04、AC-19/20/21/23/70の受入意図を再編したDraft。現行の100_機能仕様.mdと400_受入検証計画.mdの採用済み要件を変更しない。正式CAT Process/PI/TCE・semantic machine Gates、実Discord OAuth2/PKCE、非本人ブラウザ検証は**not-run**。本書はConfirmed、実機合格、merge/deployの根拠ではない。
