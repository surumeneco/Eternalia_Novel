---
cat_version: '0.3'
kind: domain-spec
id: eternalia.timeline.cross-period-epoch
status: draft
process: eternalia.timeline
source_refs:
  - https://drive.google.com/file/d/1pxoMMK9JMC-8qC4pQHJ4kdQAG8ypK1T1/view
  - https://drive.google.com/file/d/1Auye8OV-35xvJTI5zGsFEIXQSCQsx-6V/view
  - https://drive.google.com/file/d/1gKAPdnnHjDCy_dDxWx3BB6mL-eGPb92J/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 年代区分間の共通年換算・統合表示（Draft）

## 由来・権威と実装選択

v0.3の年表は複数年代区分の基準計算と、全年代区分の統合表示を要求する。Periodization.RelativeYearsは「基準年に対する相対年数」、Event.Yearは「年数」。v0.3のAPIには符号の計算式が存在しない。2026-11-12の利用者決定により整数・年0・負年を使う。2026-11-14の利用者指示に従い、資料から合理的に導ける細部は実装して実機確認で是正する。**次の加算向きは当面の実装解釈であり、v0.3が明記した事実でもCATのConfirmed仕様でもない。**

## 意味論と境界

- 共通年 C = Periodization.RelativeYears R + Event.Year E。Rは所属区分の年0の共通軸上の位置、Eはその区分内の符号付き年。例えばR=100、E=-90ならC=10。R=-15、E=25でもC=10。
- R=0とE=0は明示的な値。欠損、空欄、不正整数を0とみなさない。R/Eまたは計算結果が安全整数でなければ共通年なし、区分別の未換算群へ表示し、黙って年表から消さない。
- 区分別表示は従来どおりEの昇順。同じCの出来事は年代区分表示順、各出来事表示順、名称、IDの順で安定させる。
- 全区分表示では換算可能な出来事をCの昇順で一つの一覧へ配置。出来事名と所属年代区分および元のEを併記し、共通年と原表記を取り違えない。
- 匿名読者の入力は実効公開済みのシリーズに紐付く公開ツリーのみとし、親非公開/予約公開/未公開下書き、別シリーズの区分基準・出来事を結果に混入しない。年と区分の基準は公開スナップショット由来。
- 既存データのR/Eの再書込みや自動補完は行わない。整数範囲・未設定時・計算不能時は保守的に扱う。

## 観測規則とテスト

| ID | 条件 | 要求 | 観測 |
| --- | --- | --- | --- |
| epoch.offset-add | RとEが安全整数 | C=R+E。負年、年0、負のRを保持 | EPOCH-01 |
| epoch.safe | R/E不正、欠損、空欄または加算オーバーフロー | Cを作らず未換算群に表示 | EPOCH-02 |
| epoch.unified | 複数公開区分で全区分を選択 | 共通年で統合昇順、同年は決定的タイブレーク | EPOCH-03 |
| epoch.filter | 一つの公開区分を選択 | 従来の区分内順序、原表記を保持 | EPOCH-04 |
| epoch.privacy | 予約・非公開・別シリーズ・未公開下書きが存在 | 匿名投影から秘匿し、公開稿の基準のみを使用 | EPOCH-05 |

## CAT状態

本書はDraftでありConfirmedへの自己昇格・正式Closure/Model/Queue/Gate合格の主張ではない。新しい統合表示は利用者の実機受入で補正され得る試行実装。