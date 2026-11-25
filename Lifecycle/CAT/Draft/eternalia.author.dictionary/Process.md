---
cat_version: '0.3'
kind: process
id: eternalia.author.dictionary
status: draft
process: eternalia.author.dictionary
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
  - https://github.com/surumeneco/Eternalia_Novel/issues/39#issuecomment-6898199909
refs: ["eternalia.author.dictionary.pi", "eternalia.author.dictionary.tce", "eternalia.author.dictionary.relations"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Process: eternalia.author.dictionary

作者が所属言語を選択し、品詞マスタと単語の下書きを編集・保存する境界。実際の候補、識別子、名称、並び、保存結果および編集対象を観測する。公開版更新は独立操作であり、ここでの下書き編集から生じない。

本DraftはW07の採用済み差分を再配置する。全機能をこの部分仕様だけで閉包したとは扱わない。相手は実際の利用者という外部Processであり、検証用の論理サービスを捏造しない。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.author.dictionary.pi |

## 仕様状態
| ID | Domain |
| --- | --- |
| 状態.選択系列 | nullable<string> |
| 状態.選択言語 | nullable<string> |
| 状態.編集対象 | nullable<string> |
| 状態.未保存意味 | sequence<record<id:string,classId:nullable<string>,definition:string,etymologies:sequence<record<id:string,languageId:nullable<string>,wordId:nullable<string>,note:string>>>> |
| 状態.編集中品詞列 | sequence<record<id:string,name:string>> |

## 観測能力
| ID | 情報源 | Domain |
| --- | --- | --- |
| 観測.認証役割 | 作者認証・認可 | enum{作者,非作者,未ログイン} |
| 観測.言語ID | 選択要求で解決した実在言語ID（不在はなし） | nullable<string> |
| 観測.言語所属系列ID | 解決した言語の実所属系列 | nullable<string> |
| 観測.下書き品詞列 | 選択言語の保存済み品詞マスタ | sequence<record<id:string,name:string>> |
| 観測.下書き単語 | 同一言語の保存済み語 | sequence<record<id:string,spelling:string,deleted:boolean>> |
| 観測.保持公開単語 | 同一言語の保持公開版 | sequence<record<id:string,spelling:string,deleted:boolean>> |

## 作用能力
| ID | 対象 | Domain |
| --- | --- | --- |
| 作用.保存語 | 下書き単語の保存 | record<id:string,languageId:string,spelling:string,meanings:sequence<record<id:string,classId:nullable<string>,definition:string,etymologies:sequence<record<id:string,languageId:nullable<string>,wordId:nullable<string>,note:string>>>>> |
| 作用.保存品詞列 | 選択言語の下書きマスタの保存 | sequence<record<id:string,name:string>> |

## 起点
| ID | 由来 |
| --- | --- |
| 言語選択 | eternalia.author.dictionary.pi/select-language |
| 品詞追加 | eternalia.author.dictionary.pi/add-class |
| 品詞移動 | eternalia.author.dictionary.pi/move-class |
| 品詞名称編集 | eternalia.author.dictionary.pi/edit-class |
| 品詞保存 | eternalia.author.dictionary.pi/save-classes |
| 語編集開始 | eternalia.author.dictionary.pi/open-word |
| 語保存 | eternalia.author.dictionary.pi/save-word |

## 適用範囲
品詞候補・順序列・実際の安定IDを仕様値とし、移動可能フラグや同綴フラグを外部PIとして要求しない。意味のID・定義・品詞参照・語源を保持する。空品詞の意味上の未指定はなしで表す（保存形式の空文字を変更する要求ではない）。語源編集の個別操作の全詳細は今回の差分外。

未形式化のEffect・Condition・外部観測関係をTCE・領域別仕様に保持する。Compilerの対応範囲に合わせて要求を削らず、正式Gateは未完了。
