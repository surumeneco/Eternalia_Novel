---
cat_version: '0.3'
kind: tce
id: eternalia.ui.admin-navigation.tce
status: confirmed
process: eternalia.ui.admin-navigation
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7119957252
refs:
  - eternalia.ui.admin-navigation.pi
semantic_contract: markdown-v2
language: ja
decision_ref: https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7119957252
---
# TCE: eternalia.ui.admin-navigation.tce

網羅要求: closed

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| edit.denied | 正規編集要求 | `否定(入力.作者)` | 1 | `出力.結果 = "認可拒否"` |
| edit.invalid | 正規編集要求 | `入力.作者 かつ (否定(入力.対象存在) または 否定(入力.所属一致) または 否定(入力.種別一致))` | 1 | `出力.結果 = "対象拒否"` |
| edit.canonical | 正規編集要求 | `入力.作者 かつ 入力.対象存在 かつ 入力.所属一致 かつ 入力.種別一致` | 1 | `出力.結果 = "正規編集"` |

## 適用境界
無関係なクエリの4状態で結果は同一。正規編集ルートに限定し、旧 /studio のitem/create互換は要求しない。拒否の具体的HTTP応答、未保存入力の処理、実際のDOM/DBを合格と推定しない。
