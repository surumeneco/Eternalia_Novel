---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.search-metadata-snapshot
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開検索での設定タグ・辞書意味の公開版隔離（Draft）

## 根拠

ST-04/ST-09は設定タグの検索、LG-07は辞書の意味検索を要求し、PB-10〜12は非公開・予約公開と下書き/公開版分離を検索を含む匿名閲覧に適用する。現行`search.vue`は公開シリーズツリーから`Tip.details.tags`と`Word.details.meanings[].definition`を読んで検索する。タイトル/本文以外の詳細フィールドについても下書きの変更や祖先の予約公開が漏洩しないことを実HTTP・Chromiumで検証する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.publication.search.metadata | 公開済み設定タグと辞書の意味説明は検索可能 |
| eternalia.publication.search.snapshot | 保存しただけの下書きメタデータは検索/公開APIに反映されず、明示公開操作で切り替わる |
| eternalia.publication.search.ancestors | 親カテゴリ・言語の予約公開開始時刻に達しない場合、公開済みの子の検索結果と直接参照を遮断 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| SEARCH-METADATA-01 | 公開シリーズ内に公開済TipタグとWord意味説明がある | 匿名検索はそれぞれの文字列に一致する該当公開項目を返す | SEARCH-METADATA-01 |
| SEARCH-METADATA-02 | 公開済Tip/Wordのタグ・意味説明を作者が下書き保存したが再公開していない | 旧公開メタデータだけが匿名検索可能で、未公開下書き文字列は返らない。明示公開後は新公開メタデータへ置き換わる | SEARCH-METADATA-02 |
| SEARCH-METADATA-03 | 公開済Tipの親カテゴリまたはWordの親言語を将来公開へ切り替える | 子の検索リンク・詳細直接URLを匿名から遮断する。別シリーズや他の公開項目の挙動を変更しない | SEARCH-METADATA-03 |

## 検証の境界

隔離DBの合成作者セッションで実HTTPと匿名Chromiumを用いる。Discord実OAuth、人間受入、負荷試験、正式CAT Confirmed・Process Closure・Model/Implementation Conformanceを成功とみなさない。
