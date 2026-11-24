---
cat_version: '0.3'
kind: process
id: eternalia.ui.chapter-return
status: confirmed
process: eternalia.ui.chapter-return
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.ui.chapter-return.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# Process: eternalia.ui.chapter-return

200 §6.3の採用済み要件「章一覧へ戻る」のみ。正規公開章詳細に入場済みの閲覧者が目次リンクを操作すると、当該章が所属する部の章一覧へ戻る。公開章の正規入場・他の前後章・未公開遮断は既存別境界であり、本Workで変更しない。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.ui.chapter-return.pi |

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
| 章一覧遷移 | eternalia.ui.chapter-return.pi/back |
