---
cat_version: '0.3'
kind: tce
id: eternalia.ui.mobile-shell-focus.tce
status: confirmed
process: eternalia.ui.mobile-shell-focus
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
refs:
  - eternalia.ui.mobile-shell-focus.pi
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# TCE: eternalia.ui.mobile-shell-focus.tce

網羅要求: closed

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| background.allowed | メニュー状態照合 | `入力.メニュー == "閉"` | 1 | `出力.背景操作可 = 真` |
| background.blocked | メニュー状態照合 | `入力.メニュー == "主" または 入力.メニュー == "副"` | 1 | `出力.背景操作可 = 偽` |

## 適用境界
フォーカスやDOMの実装適合、メニューの操作順、寸法とリサイズは別途の観測。
