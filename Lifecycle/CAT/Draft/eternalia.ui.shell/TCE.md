---
cat_version: '0.3'
kind: tce
id: eternalia.ui.shell.tce
status: draft
process: eternalia.ui.shell
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.ui.shell.pi"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# TCE: eternalia.ui.shell.tce

網羅要求: partial

## 振る舞い

ここでは完全な意味上のCondition・Effectを一つの表に保持する。現段階の自由記述は機械式への変換が未完であり、正規Compilerによる規範モデル生成対象として承認されていない。未記述Effectを「不変」や「出力なし」として合格扱いする部分Outcomeを置かない。

| ID | 起点 | 条件 | 結果 | 効果 | 要求 |
| --- | --- | --- | --- | --- | --- |
| shell.open | メニュー起点操作 | 狭い画面で閉じた状態から起点を操作、または他方の起点を操作 | 1 | 対応する領域を本文に重ねて表示する。背景は操作不可となり、開いた領域へフォーカスを移す。他方へ切り替える場合は以前の領域を閉じ、一度に一領域のみを展開する。 | 200 §6.3、AC-85/86 |
| shell.close | メニュー閉鎖 | 開いている領域をEscまたは背景操作で閉じる | 1 | 該当領域を閉じ、背景の操作を回復し、対応する可視の起点へフォーカスを戻す。 | AC-85/96 |
| shell.navigation | 画面遷移 | 展開中にページ遷移が成立 | 1 | 展開を閉じ、背景遮断を解除し、遷移先の本文へフォーカスを移す。 | AC-85/96 |
| shell.resize | 狭幅条件解除 | 展開中に狭幅条件を外れる | 1 | 展開を閉じ、背景遮断を解除する。消失した起点への強制復帰を要求しない。 | AC-85/96 |
| shell.focus | フォーカス移動 | メニュー展開中にTab/Shift+Tab | 1 | フォーカスを開いた領域の操作対象と対応する起点の間で順方向/逆方向に循環させ、背景へ移動させない。 | 200 §6.3、AC-85/96 |
| shell.toggle.close | メニュー起点操作 | 狭い画面で開いているパネルと同じ起点を再押下 | 1 | 領域を閉じ、背景の操作を回復し、対応する可視の起点へフォーカスを戻す。 | AC-85/96 |

## 残る形式化

自由記述のCondition・Effectを元の意味を保持して機械式へ変換し、操作別出力Presence、起点、到達可能性、例外・不変条件を確定する。未対応は未証明のまま扱い、旧真偽判定や一部EffectのみのOutcomeに戻さない。網羅要求をclosedにする前に残る条件を解消する。
