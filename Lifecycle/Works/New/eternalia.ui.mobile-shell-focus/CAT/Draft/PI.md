---
cat_version: '0.3'
kind: pi
id: eternalia.ui.mobile-shell-focus.pi
status: draft
process: eternalia.ui.mobile-shell-focus
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
refs: []
semantic_contract: markdown-v2
language: ja
---
# PI: eternalia.ui.mobile-shell-focus.pi

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.ui.shell | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.メニュー | 受信 | 列挙{閉, 主, 副} | 必須 |
| 出力.背景操作可 | 送信 | 真偽 | 必須 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| check | 受付 | メニュー状態照合 |

## 制約
| 式 |
| --- |

表示中のモバイルパネルに関する背景操作可否の判定のみ。デスクトップ常設表示・実DOM制御・フォーカス復帰の実測とは区別する。
