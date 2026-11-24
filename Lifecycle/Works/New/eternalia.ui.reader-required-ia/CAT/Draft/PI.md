---
cat_version: '0.3'
kind: pi
id: eternalia.ui.reader-required-ia.pi
status: draft
process: eternalia.ui.reader-required-ia
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: []
semantic_contract: markdown-v2
language: ja
---
# PI: eternalia.ui.reader-required-ia.pi

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.public.reader | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.操作 | 受信 | 列挙{正規設定集と辞書} | 必須 |
| 出力.名称項目検索 | 送信 | 列挙{適合,不適合} | 必須 |
| 出力.タグ絞込 | 送信 | 列挙{適合,不適合} | 必須 |
| 出力.名称順 | 送信 | 列挙{適合,不適合} | 必須 |
| 出力.非公開除外 | 送信 | 列挙{適合,不適合} | 必須 |
| 出力.設定項目本文 | 送信 | 列挙{適合,不適合} | 必須 |
| 出力.文法導線 | 送信 | 列挙{適合,不適合} | 必須 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| view | 受付 | 公開資料閲覧 |

## 制約
| 式 |
| --- |
