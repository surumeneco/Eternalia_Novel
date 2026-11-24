---
cat_version: '0.3'
kind: pi
id: eternalia.ui.chapter-return.pi
status: confirmed
process: eternalia.ui.chapter-return
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# PI: eternalia.ui.chapter-return.pi

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.reader.chapter | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.詳細 | 受信 | 列挙{正規公開章} | 必須 |
| 出力.遷移先 | 送信 | 列挙{所属部の章一覧,その他} | 必須 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| back | 受付 | 章一覧遷移 |

## 制約
| 式 |
| --- |
