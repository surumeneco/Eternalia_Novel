---
cat_version: '0.3'
kind: process
id: eternalia.ui.admin-navigation
status: draft
process: eternalia.ui.admin-navigation
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs:
  - eternalia.ui.admin-navigation.pi
semantic_contract: markdown-v2
language: ja
---
# Process: eternalia.ui.admin-navigation

200 §6.2/6.3、IA-05/06の正規個別編集の入口判定のみ。URLパスの対象IDを確定した後に旧Studioクエリで別対象編集・作成へ変更しない。リンクの実際の表示・遷移、ID比較と親子検証、認可API、未保存入力、プレビュー内容は別の外部観測。AI作成DraftでありConfirmedではない。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.ui.admin-navigation.pi |

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
| 正規編集要求 | eternalia.ui.admin-navigation.pi/check |
