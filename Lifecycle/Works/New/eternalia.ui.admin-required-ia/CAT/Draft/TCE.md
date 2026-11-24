---
cat_version: '0.3'
kind: tce
id: eternalia.ui.admin-required-ia.tce
status: draft
process: eternalia.ui.admin-required-ia
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.ui.admin-required-ia.pi"]
semantic_contract: markdown-v2
language: ja
---
# TCE: eternalia.ui.admin-required-ia.tce

網羅要求: closed

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| admin.required.ia | 管理一覧閲覧 | `入力.操作 == "正規管理一覧"` | 1 | `出力.章の編部 = "適合"; 出力.表示順 = "適合"; 出力.シリーズ非重複 = "適合"; 出力.言語限定 = "適合"` |

## 適用境界
200 §6.1/§6.2: 正規管理一覧で章の編・部所属と表示順を示し、選択済みシリーズを重複表示せず、単語一覧を選択言語に限定できること。認証済み作者の正規系列入場を前提に既存管理入場・編集リンク・公開操作は維持する。 実際の disposable HTTP fixture・Chromium の操作とDOM観測で判定する。
