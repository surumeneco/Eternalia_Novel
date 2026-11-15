---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.search-cross-series-isolation
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 匿名公開検索のシリーズ間隔離・非公開参照負例（Draft）

## 根拠

現行機能仕様のSR-04、PB-03、PB-10〜12はシリーズをまたぐ非公開情報の混入と、公開されていない祖先配下の取得を禁止する。ST-04/09とLG-05/07は設定タグ・辞書の意味を公開検索対象に含める。すでに公開検索はシリーズ単位の公開ツリーを使用しているが、同一語句・同一タグ・同一意味を複数の公開シリーズが共有するときのクライアント検索分離、および公開状態が異なる系列を選び直したときの非漏洩を独立に検証する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.public.search.series | 同一語句が別シリーズに存在しても、選択中の公開シリーズの項目のみ検索する |
| eternalia.public.search.metadata | 公開タグ・公開辞書意味の検索はシリーズ間で混在しない |
| eternalia.public.search.revocation | 非公開・未来予約の祖先配下の項目名、本文、タグ、意味、IDを匿名検索結果に出さない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| SEARCH-ISOLATION-01 | 異なる公開シリーズA/BのTipに同一タグを付け、シリーズCを非公開にする | Aを選択した検索にはAのTipのみ、Bを選択した検索にはBのTipのみ表示する。Cは匿名のシリーズ選択肢に表示しない | SEARCH-ISOLATION-01 |
| SEARCH-ISOLATION-02 | 同じ意味の文字列を持つA/B別言語の公開Wordを検索する | 辞書領域の検索結果には選択シリーズのWordのみ現れ、他シリーズのWordへのリンクは現れない | SEARCH-ISOLATION-02 |
| SEARCH-ISOLATION-03 | BのWordの祖先言語が未来予約となった後、A/Bを選択して同一語句を検索する | BのWordおよび公開済みの旧意味・IDは匿名の結果から消え、公開継続中のAのWordは保持される | SEARCH-ISOLATION-03 |

## 限界

本Draftは既存の確定要件を検証観点へ整理する非規範の候補であり、Confirmedに昇格しない。使い捨てPostgreSQLと合成作者セッション、匿名Chromiumで公開検索と公開APIを検証する。実Discord OAuth、実機、正式CAT Process/Model/Implementation Gate、常時前面タブへの即時撤回配信の証拠にはしない。
