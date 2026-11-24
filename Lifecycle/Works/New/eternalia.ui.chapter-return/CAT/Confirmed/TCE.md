---
cat_version: '0.3'
kind: tce
id: eternalia.ui.chapter-return.tce
status: confirmed
process: eternalia.ui.chapter-return
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.ui.chapter-return.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# TCE: eternalia.ui.chapter-return.tce

網羅要求: closed

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| chapter.return | 章一覧遷移 | `入力.詳細 == "正規公開章"` | 1 | `出力.遷移先 = "所属部の章一覧"` |

## 適用境界
正規公開章を開いた後、実際のリンクを操作し、遷移したURLと章一覧見出しを観測する。非公開・不正親・系列は既存入場Workで検査する。
