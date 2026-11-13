---
cat_version: '0.3'
kind: domain-spec
id: eternalia.timeline.integer-year-input
status: draft
process: eternalia.timeline
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://drive.google.com/file/d/1Auye8OV-35xvJTI5zGsFEIXQSCQsx-6V/view
  - https://drive.google.com/file/d/1gKAPdnnHjDCy_dDxWx3BB6mL-eGPb92J/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 年表の整数年入力と相対年データ保持（Draft）

## 意味論と範囲

TL-01〜03/AC-10・42の2026-11-12採用部分。年表内部の年は整数であり、0年・負年を保持する。旧v0.3のPeriodization.RelativeYears（基準年に対する相対年数）とEvent.Yearを独立した値として保持し、欠損値を勝手に0へ補完しない。**区分間の換算式/正負の向きは現時点で未決であり、このWorkでは統合時系列へ変換しない。**

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.timeline.event-year | Event.Yearの符号付き安全整数、年0、未設定 |
| eternalia.timeline.period-offset | Periodization.RelativeYearsの入力・保存・再読込 |
| eternalia.timeline.reader | 同区分内の年ソートを維持し、区分間は未定義のままにする |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| year.integer | Event.YearまたはPeriodization.RelativeYearsが設定されたとき | 符号付き10進整数のみ受理。0・負数は許可、浮動小数・指数・非安全整数は拒否 | YEAR-01 |
| year.optional | 年が未設定の既存データ | 無断で0年へ書き換えず、未設定として保持 | YEAR-02 |
| year.edit | 作者が値を保存 | 許可された年値は下書き保存・再読込で変化しない。明示公開前に公開稿へ反映しない | YEAR-03 |
| year.sort | 同年代区分内のEventを閲覧 | 負年、0年、正年の順に並べ、同年は既存の順序を維持 | YEAR-04 |
| year.no-unapproved-conversion | 年代区分が異なる出来事を閲覧 | 未承認の相互換算を実装・主張せず、既存の年代区分別表示を維持 | YEAR-05 |

## Pending decision（別Work）

RelativeYearsの符号/基準軸、Event.Yearから共通年への厳密な式、未設定時の統合表示、基準値の読者秘匿。Issue #5へ継承する。CATのConfirmed仕様・Process Closure等はこのDraftでは成立しない。
