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
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | --- | --- |
| shell.open.main | メニュー展開 | `観測.狭い画面 かつ 入力.メニュー == "主" かつ 状態.展開 != "主"` | 1 | `状態.展開 = "主"; 出力.表示パネル = "主"; 出力.背景操作可 = 偽` |
| shell.open.side | メニュー展開 | `観測.狭い画面 かつ 入力.メニュー == "副" かつ 状態.展開 != "副"` | 1 | `状態.展開 = "副"; 出力.表示パネル = "副"; 出力.背景操作可 = 偽` |
| shell.toggle.main | メニュー展開 | `観測.狭い画面 かつ 入力.メニュー == "主" かつ 状態.展開 == "主"` | 1 | `状態.展開 = "閉"; 出力.表示パネル = "閉"; 出力.背景操作可 = 真` |
| shell.toggle.side | メニュー展開 | `観測.狭い画面 かつ 入力.メニュー == "副" かつ 状態.展開 == "副"` | 1 | `状態.展開 = "閉"; 出力.表示パネル = "閉"; 出力.背景操作可 = 真` |
| shell.close | メニュー閉鎖 | `状態.展開 != "閉"` | 1 | `状態.展開 = "閉"; 出力.表示パネル = "閉"; 出力.背景操作可 = 真` |

## 振る舞いの意味契約（形式化途上）

下表が今回の要求上の振る舞いであり、上表はそのうち現行記法で書ける局所状態・結果の断片である。未形式化のCondition・Effectも削除・合格扱いしない。重複IDは同一振る舞いの部分式と意味の対応であり、別の選択肢を意味しない。

| ID | 起点 | Condition（意味） | Effect（意味） | 要求 |
| --- | --- | --- | --- | --- |
| shell.open | メニュー展開 | 狭い画面で閉じた状態から起点を操作、または他方の起点を操作 | 対応する領域を本文に重ねて表示する。背景は操作不可となり、開いた領域へフォーカスを移す。他方へ切り替える場合は以前の領域を閉じ、一度に一領域のみを展開する。 | 200 §6.3、AC-85/86 |
| shell.close | メニュー閉鎖 | 開いている領域をEsc・背景操作または同じ起点の再押下で閉じる | 該当領域を閉じ、背景の操作を回復し、対応する可視の起点へフォーカスを戻す。遷移時・画面幅変化時のフォーカス先は既存ナビゲーション規則を保持し、存在しない起点への復帰を要求しない。 | AC-85/96 |
| shell.navigation | 画面遷移・画面幅変化 | 展開中にページを移動、または狭幅条件を外れる | 展開を閉じ、背景遮断を解除する。遷移時は遷移先の本文へフォーカスを移し、画面幅変化では消失した起点への強制復帰を要求しない。 | AC-85/96（起点形式化未完） |
| shell.focus | フォーカス移動 | メニュー展開中にTab/Shift+Tab | フォーカスを開いた領域の操作対象と対応する起点の間で順方向/逆方向に循環させ、背景へ移動させない。 | 200 §6.3、AC-85/96 |

## 残る形式化

実際の境界値、関係・効果の完全な式、操作別出力Presence、到達可能性を確定したうえでclosedを要求する。現行Compiler未対応の箇所は未証明として扱い、旧真偽判定に戻さない。
