---
cat_version: '0.3'
kind: pi
id: eternalia.ui.admin-required-ia.pi
status: confirmed
process: eternalia.ui.admin-required-ia
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# PI: eternalia.ui.admin-required-ia.pi

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.author.admin | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.操作 | 受信 | 列挙{正規管理一覧} | 必須 |
| 出力.章の編部 | 送信 | 列挙{適合,不適合} | 必須 |
| 出力.表示順 | 送信 | 列挙{適合,不適合} | 必須 |
| 出力.シリーズ非重複 | 送信 | 列挙{適合,不適合} | 必須 |
| 出力.言語限定 | 送信 | 列挙{適合,不適合} | 必須 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| view | 受付 | 管理一覧閲覧 |

## 制約
| 式 |
| --- |
