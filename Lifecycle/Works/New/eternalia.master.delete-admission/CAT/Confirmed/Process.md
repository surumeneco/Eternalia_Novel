---
cat_version: '0.3'
kind: process
id: eternalia.master.delete-admission
status: confirmed
process: eternalia.master.delete-admission
source_refs:
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
  - https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7106396316
decision_ref: https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7106396316
refs:
  - eternalia.master.delete-admission.pi
semantic_contract: markdown-v2
language: ja
---
# Process: eternalia.master.delete-admission

改訂競合と参照整合性を区別して、共通Tag/Divの明示削除を許可するかを判定する。対象の削除実行・原子的なDB更新と外部認証の検証は、この純粋な判定とは別の観測対象である。ユーザーが旧データ互換は不要と明示したため、古い文字列タグ配列との互換性は対象にしない。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.master.delete-admission.pi |

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
| 削除可否判定 | eternalia.master.delete-admission.pi/check |
