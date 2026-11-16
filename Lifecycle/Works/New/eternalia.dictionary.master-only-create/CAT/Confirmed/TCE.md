---
cat_version: '0.3'
kind: tce
id: eternalia.dictionary.master-only-create.tce
status: confirmed
process: eternalia.dictionary.master-only-create
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.master-only-create.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# TCE: 新規単語の品詞照合

網羅要求: closed

## 振る舞い

| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| none | 品詞照合 | `否定(入力.品詞指定あり)` | 1 | `出力.登録可 = 真` |
| member | 品詞照合 | `入力.品詞指定あり かつ 入力.品詞が所属言語マスタ内` | 1 | `出力.登録可 = 真` |
| absent | 品詞照合 | `入力.品詞指定あり かつ 否定(入力.品詞が所属言語マスタ内)` | 1 | `出力.登録可 = 偽` |

## 適用境界

属性間の入力整合（品詞未指定時の「マスタ内」フラグは適用外）と実言語ID解決・公開版/下書き分離は、ドメイン・HTTPの実装証拠により確認する。直接APIでの新規作成に限定し、既存単語の編集や参照中マスタ改名削除には適用しない。
