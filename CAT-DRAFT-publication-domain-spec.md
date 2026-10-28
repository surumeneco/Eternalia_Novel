---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.boundary
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1YgJaY4gQQ5Stla9sdS5F05P-LMUTbZr_/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
base_revision: 7d23cbf43b37bcafef29abacdb6802657ae16cdc
semantic_contract: markdown-v2
language: ja
---

# Domain Specification: eternalia.publication.boundary

> **CAT Draft。** この文書は `cat-designer` が規範化する候補であり、confirmedでも閉包検証済みでもない。独立したCAT実行系の `routing.json` に従って正規Stageへ引き渡す。

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.series | シリーズ共通公開状態 |
| eternalia.story.chapter | 章の下書き／公開版 |
| eternalia.settings.tip-section | 設定項目の公開境界 |
| eternalia.dictionary.word | 単語の公開境界 |
| eternalia.dictionary.grammar | 文法項目の公開境界 |
| eternalia.timeline.event | 出来事の公開境界 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| pub.draft.isolation | 作者が下書きを保存した時 | 読者取得可能な直前の公開版本文を変更しない | 正規TCE/TestModel + E2E、未生成 |
| pub.snapshot.explicit | 作者が明示的に公開版を更新した時 | 対象単位の現行下書きから公開用の独立した版を生成する | 正規TCE/TestModel、未生成 |
| pub.ancestor.block | いずれかの祖先が非公開、または公開開始日時前である時 | 子孫の公開設定に関係なく、読者には当該情報を開示しない | 正規TCE + 全公開API統合検証、未実行 |
| pub.self.block | 対象自身が非公開、公開日時前、または公開版なしの時 | 下書きや公開用に確定していない情報を読者に返さない | 正規TCE + 匿名API検証、未実行 |
| pub.restore | 祖先を再公開する時 | 個々の子要素自身の非公開指定は保持され、勝手に公開にならない | 正規TCE + integration、未実行 |
| pub.multichannel | 一覧、検索、新着、直接URL、関連リンク、キャッシュから公開情報を読む時 | すべての取得経路で同一の実効公開境界を適用する | integration/E2E、未実行 |
| pub.conflict | 別の編集元が保持する古い版番号で下書きや公開版を更新しようとした時 | 他の編集者が保存した新しい版を無通知で上書きしない | 正規TCE + DB transaction、未実行 |

## 未決・Gate

- `draft`→`confirmed` の昇格権限はCAT正規Authorityが所有する。ここに `decision_ref` は付けない。
- `Process` / `PI` / `TCE` の境界・Input/Output・戻り値のpresenceは未定義。人手でTestModelを生成しない。
- 年表の年換算、本文のルビ形式、公開日時の予約と公開版更新の細部、公開時の監査とロールバックは別Workとして仕様化する。
- この文書はCAT Compilerにより検証済みではない。未対応の構造・複数実行関係を別の低精度な式へ置き換えない。
