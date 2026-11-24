---
cat_version: '0.3'
kind: pi
id: eternalia.ui.admin-navigation.pi
status: confirmed
process: eternalia.ui.admin-navigation
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7119957252
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7119957252
---
# PI: eternalia.ui.admin-navigation.pi

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.ui.admin | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.作者 | 受信 | 真偽 | 必須 |
| 入力.対象存在 | 受信 | 真偽 | 必須 |
| 入力.所属一致 | 受信 | 真偽 | 必須 |
| 入力.種別一致 | 受信 | 真偽 | 必須 |
| 入力.旧クエリ | 受信 | 列挙{なし, item, create, 両方} | 必須 |
| 出力.結果 | 送信 | 列挙{認可拒否, 対象拒否, 正規編集} | 必須 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| check | 受付 | 正規編集要求 |

## 制約
| 式 |
| --- |

入力.所属一致と入力.種別一致はパスの対象についての判定であって、旧クエリの対象の判定ではない。正規編集はパスで指定された同一IDのみを編集対象とする。旧クエリは入力の存在区分であり、値の詳細はこの有限判定の外部観測。
