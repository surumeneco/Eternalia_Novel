---
cat_version: '0.3'
kind: domain-spec
id: eternalia.reader.compound-search-isolation
status: draft
process: eternalia.reader
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/b3e95aa93fc418166cd4949ca0985d10320c6c6f/apps/web/app/pages/search.vue
refs: []
semantic_contract: markdown-v2
language: ja
---

# 匿名読者の複合検索・並べ替えと祖先遮断の観測（Draft）

## 根拠と範囲

現行機能仕様のST-09は設定の名称・タグ・カテゴリによる検索・絞り込み・並べ替えをv0.3から継承し、詳細操作は未決である。LG-07はスペル/意味検索・品詞による絞り込みを継承する。PB-10は非公開祖先の配下が検索に露出しないことを採用済みとする。現行Nuxtの`/search`は、**シリーズ選択**、ドメイン（all/tips/dictionaries等）、入力文字列、表示順（recent/title/manual）の組合せを実装している。既存試験は系列越境・タグ/意味・祖先の個別負例を実証済みだが、同じ画面状態に複数条件を重ねる組合せと表示順の干渉は未測定だった。

本Artifactは検索UIの現状の組合せを探索的に検査し、未決の高度検索仕様や全面的な性能保証を新たに採用しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.reader.compound-scope | 同一検索語を持つタグ付き設定と辞書意味をシリーズ単位で分離し、ドメイン指定をAND条件として適用する |
| eternalia.reader.sorting | 現行UIのタイトル昇順/手動順がそれぞれ個別の並べ替え条件に従い、検索対象集合を増減させない |
| eternalia.reader.compound-ancestor | 祖先が未来公開へ移動するとその子の旧検索結果と直接URLが消え、他ドメインの公開結果は保持される |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| SEARCH-COMPOUND-01 | 複数シリーズA/Bに同じタグ語、シリーズAの辞書意味にも同じ語がある | 選択シリーズAの`tips`ではA設定のみ、`dictionaries`ではA単語のみ、`all`では両方。Bの項目は混入しない | PostgreSQL＋匿名Chromium |
| SEARCH-COMPOUND-02 | 同一カテゴリの設定Z→Aを作り公開し、同じ検索語で`tips`に絞る | `manual`順は作成時の同胞順、`title`順はタイトル順。変更は他ドメインの結果を追加しない | PostgreSQL＋匿名Chromium |
| SEARCH-COMPOUND-03 | シリーズAの設定カテゴリを未来公開へ更新する | A設定が検索から消え、単語の公開検索は維持される。設定の匿名直URLは404、Bの独立系列は影響されない | PostgreSQL＋匿名Chromium |
| SEARCH-COMPOUND-04 | 一連のテストがGreen | 現行UI仕様と合成ブラウザによる探索的な部分証拠として記録し、正式CAT Gateや実機・大規模性能の合格を主張しない | 受入台帳 |

## 権威・非対象

認証には使い捨てPostgreSQLの合成作者を用い、閲覧は匿名Chromiumで行う。検索結果の独立性・公開境界以外の未決の詳細検索文法、タイトルの国際化照合規則、ユーザー指定の高度フィルタ、実OS BFCache/CDN/同時更新の即時反映、性能基準はこのWorkの新しい要求にしない。正式CAT Process/PI/TCEのConfirm/Conformanceは未実行のままとする。
