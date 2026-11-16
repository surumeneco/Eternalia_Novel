---
cat_version: '0.3'
kind: tce
id: eternalia.dictionary.master-only-input.tce
status: confirmed
process: eternalia.dictionary.master-only-input
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.master-only-input.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# TCE: eternalia.dictionary.master-only-input.tce

網羅要求: closed

## 振る舞い

| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| master.selected | 品詞欄表示 | `入力.マスタ登録あり かつ 否定(入力.マスタ外旧値あり)` | 1 | `出力.選択有効 = 真; 出力.旧値保持表示 = 偽; 出力.自由入力 = 偽` |
| master.legacy | 品詞欄表示 | `入力.マスタ登録あり かつ 入力.マスタ外旧値あり` | 1 | `出力.選択有効 = 真; 出力.旧値保持表示 = 真; 出力.自由入力 = 偽` |
| empty.no-legacy | 品詞欄表示 | `否定(入力.マスタ登録あり) かつ 否定(入力.マスタ外旧値あり)` | 1 | `出力.選択有効 = 偽; 出力.旧値保持表示 = 偽; 出力.自由入力 = 偽` |
| empty.legacy | 品詞欄表示 | `否定(入力.マスタ登録あり) かつ 入力.マスタ外旧値あり` | 1 | `出力.選択有効 = 偽; 出力.旧値保持表示 = 真; 出力.自由入力 = 偽` |

## 適用境界

マスタ候補値と旧値の同一性、実DOM、公開版/下書き分離、サーバー入力検査は別の技術証拠が必要。
