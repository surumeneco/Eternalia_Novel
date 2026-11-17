---
kind: pi
id: eternalia.publication.author-status-on-tip-move.pi
cat_version: '0.3'
status: confirmed
process: eternalia.publication.author-status-on-tip-move
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
semantic_contract: markdown-v2
language: ja
refs: []
decision_ref: CAT/Decisions/MOVE-07-user-approval-20261117.md
---

# PI: 作者向け実効公開可否の照会

## 境界

| 相手Process | 方向 |
| --- | --- |
| eternalia.author.publication-manager | 双方向 |

## 項目

| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.公開版あり | 受信 | 真偽 | 必須 |
| 入力.自身の公開条件成立 | 受信 | 真偽 | 必須 |
| 入力.公開祖先の公開条件成立 | 受信 | 真偽 | 必須 |
| 入力.下書き祖先の公開条件成立 | 受信 | 真偽 | 必須 |
| 出力.実効公開可 | 送信 | 真偽 | 必須 |

## 操作

| ID | 方向 | 起点 |
| --- | --- | --- |
| check | 受付 | 公開状態照会 |

## 制約

| 式 |
| --- |
