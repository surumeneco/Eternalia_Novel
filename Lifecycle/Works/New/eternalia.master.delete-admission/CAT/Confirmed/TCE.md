---
cat_version: '0.3'
kind: tce
id: eternalia.master.delete-admission.tce
status: confirmed
process: eternalia.master.delete-admission
source_refs:
  - https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7106396316
decision_ref: https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7106396316
refs:
  - eternalia.master.delete-admission.pi
semantic_contract: markdown-v2
language: ja
---
# TCE: eternalia.master.delete-admission.tce

網羅要求: closed

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| delete.conflict | 削除可否判定 | `否定(入力.改訂一致)` | 1 | `出力.結果 = "競合"` |
| delete.referenced | 削除可否判定 | `入力.改訂一致 かつ 入力.参照あり` | 1 | `出力.結果 = "参照あり"` |
| delete.allowed | 削除可否判定 | `入力.改訂一致 かつ 否定(入力.参照あり)` | 1 | `出力.結果 = "許可"` |

## 適用境界
本TCEは削除可否の判定のみ。外部DB状態との一致、削除の原子性、Tag/Div参照集合の網羅性、権限の検証は実ストレージ側で個別検証する。
