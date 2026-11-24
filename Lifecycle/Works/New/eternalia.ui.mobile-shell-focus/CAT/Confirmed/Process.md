---
cat_version: '0.3'
kind: process
id: eternalia.ui.mobile-shell-focus
status: confirmed
process: eternalia.ui.mobile-shell-focus
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs:
  - eternalia.ui.mobile-shell-focus.pi
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# Process: eternalia.ui.mobile-shell-focus

200 §6.3/6.4、AC-85/86/96。狭い画面の左右のメニュー展開中は背景への操作を遮断し、開いた領域へフォーカスを移動して循環させる。Esc・起点・背景操作による閉鎖時に起点へ復帰する。遷移による閉鎖、画面幅の変化、既存ダイアログ、言語切替、認可表示を壊さない。有限モデルはメニュー開閉に伴う背景操作許可の判定に限定し、実際のDOM・キー操作・タッチ・画面幅・ヘッダー寸法は外部観測で検証する。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.ui.mobile-shell-focus.pi |

## 仕様状態
| ID | Domain |
| --- | --- |

## 観測能力
| ID | 情報源 | Domain |
| --- | --- | --- |

## 作用能力
| ID | 対象 | Domain |
| --- | --- | --- |

## 起点
| ID | 由来 |
| --- | --- |
| メニュー状態照合 | eternalia.ui.mobile-shell-focus.pi/check |
