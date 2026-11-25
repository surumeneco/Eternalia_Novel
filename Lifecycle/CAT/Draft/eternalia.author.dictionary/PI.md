---
cat_version: '0.3'
kind: pi
id: eternalia.author.dictionary.pi
status: draft
process: eternalia.author.dictionary
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
  - https://github.com/surumeneco/Eternalia_Novel/issues/39#issuecomment-6898199909
refs: []
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# PI: eternalia.author.dictionary.pi

利用者が区別する値・操作・結果の意味上の境界。レコードは境界上の必要な射影であり、HTTP DTOやDOMタグの形を固定しない。値の有無は操作ごとに区別する。受付入力は各操作の必要項目だけを保持し、提供Operationは同一論理実行の結果観測を区別する。操作別の未変換結果条件はTCEと領域別仕様を維持する。

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.actor.author | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.シリーズID | 受信 | string | 不在 |
| 入力.言語ID | 受信 | string | 不在 |
| 入力.品詞ID | 受信 | string | 不在 |
| 入力.方向 | 受信 | enum{前,後} | 不在 |
| 入力.品詞名 | 受信 | string | 不在 |
| 入力.語ID | 受信 | nullable<string> | 不在 |
| 入力.スペル | 受信 | string | 不在 |
| 入力.意味列 | 受信 | sequence<record<id:string,classId:nullable<string>,definition:string,etymologies:sequence<record<id:string,languageId:nullable<string>,wordId:nullable<string>,note:string>>>> | 不在 |
| 出力.品詞候補 | 送信 | sequence<record<id:string,name:string,description:string>> | 任意 |
| 出力.品詞列 | 送信 | sequence<record<id:string,name:string,description:string>> | 任意 |
| 出力.編集対象ID | 送信 | nullable<string> | 任意 |
| 出力.編集スペル | 送信 | string | 任意 |
| 出力.新規公開初期値 | 送信 | boolean | 任意 |
| 出力.未保存意味 | 送信 | sequence<record<id:string,classId:nullable<string>,definition:string,etymologies:sequence<record<id:string,languageId:nullable<string>,wordId:nullable<string>,note:string>>>> | 任意 |
| 出力.保存結果 | 送信 | enum{保存成功,重複,入力不正,認可拒否,保存失敗} | 任意 |
| 出力.衝突語ID | 送信 | string | 任意 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| select-language | 受付 | 言語選択 |
| add-class | 受付 | 品詞追加 |
| move-class | 受付 | 品詞移動 |
| edit-class | 受付 | 品詞名称編集 |
| save-classes | 受付 | 品詞保存 |
| open-word | 受付 | 語編集開始 |
| save-word | 受付 | 語保存 |
| select-language-view | 提供 | 言語選択 |
| add-class-view | 提供 | 品詞追加 |
| move-class-view | 提供 | 品詞移動 |
| edit-class-view | 提供 | 品詞名称編集 |
| save-classes-view | 提供 | 品詞保存 |
| open-word-view | 提供 | 語編集開始 |
| save-word-view | 提供 | 語保存 |

## 操作別存在
| 操作 | 項目 | 存在 |
| --- | --- | --- |
| select-language | 入力.シリーズID | 必須 |
| select-language | 入力.言語ID | 必須 |
| add-class | 入力.品詞名 | 必須 |
| move-class | 入力.品詞ID | 必須 |
| move-class | 入力.方向 | 必須 |
| edit-class | 入力.品詞ID | 必須 |
| edit-class | 入力.品詞名 | 必須 |
| open-word | 入力.語ID | 必須 |
| save-word | 入力.語ID | 必須 |
| save-word | 入力.スペル | 必須 |
| save-word | 入力.意味列 | 必須 |
| save-word-view | 出力.保存結果 | 必須 |
| open-word-view | 出力.品詞列 | 不在 |
| open-word-view | 出力.保存結果 | 不在 |
| open-word-view | 出力.衝突語ID | 不在 |

## 制約
| 式 |
| --- |

実IDの所属、対象の同一性、操作に固有の結果Presenceは未形式化のTCEおよび領域別関係を参照する。適合/不適合はPIの値でない。
