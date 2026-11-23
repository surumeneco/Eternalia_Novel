---
cat_version: '0.3'
kind: pi
id: eternalia.master.delete-admission.pi
status: confirmed
process: eternalia.master.delete-admission
source_refs:
  - https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7106396316
decision_ref: https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7106396316
refs: []
semantic_contract: markdown-v2
language: ja
---
# PI: eternalia.master.delete-admission.pi

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.master.admin | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.改訂一致 | 受信 | 真偽 | 必須 |
| 入力.参照あり | 受信 | 真偽 | 必須 |
| 出力.結果 | 送信 | 列挙{許可, 競合, 参照あり} | 必須 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| check | 受付 | 削除可否判定 |

## 制約
| 式 |
| --- |
