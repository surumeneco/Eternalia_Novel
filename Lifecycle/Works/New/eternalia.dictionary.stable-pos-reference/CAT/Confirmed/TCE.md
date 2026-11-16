---
cat_version: '0.3'
kind: tce
id: eternalia.dictionary.stable-pos-reference.tce
status: confirmed
process: eternalia.dictionary.stable-pos-reference
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.stable-pos-reference.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# TCE: 公開済み品詞IDと表示名

網羅要求: closed

## 振る舞い

| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| unspecified | 品詞名解決 | `否定(入力.品詞ID指定あり)` | 1 | `出力.公開名を表示 = 偽` |
| published | 品詞名解決 | `入力.品詞ID指定あり かつ 入力.公開マスタ内に同IDあり` | 1 | `出力.公開名を表示 = 真` |
| hidden | 品詞名解決 | `入力.品詞ID指定あり かつ 否定(入力.公開マスタ内に同IDあり)` | 1 | `出力.公開名を表示 = 偽` |

## 適用境界

単語の所属言語の同一性、名変更・削除の参照保証、公開境界、および実DOM表示は実API/実ブラウザ検証で追加確認する。
