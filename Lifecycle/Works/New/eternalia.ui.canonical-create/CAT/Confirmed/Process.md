---
cat_version: '0.3'
kind: process
id: eternalia.ui.canonical-create
status: confirmed
process: eternalia.ui.canonical-create
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs:
  - eternalia.ui.canonical-create.pi
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# Process: eternalia.ui.canonical-create

200 §6.2/6.4、100 LG-08、AC-81/95。作者用の新規作成は親と系列、作成種別の整合したコンテキストだけで開始する。シリーズ新規作成は親を持たない。作成成功後は作成した資料の正規個別編集へ移行する。同一言語のスペル重複では、拒否された作成を保存せず既存単語の正規編集へ移行し、入力した意味を未保存の編集として保持する。その他失敗は新規作成入力を保持する。認可はサーバー側でも独立に検証する。有限判定の範囲は、作者用作成フォームへの入場のみとする。実データの親の所属確認、作成・遷移、未保存の意味・API効果は実際のUI/API境界における別途の検証を必要とする。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.ui.canonical-create.pi |

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
| 作成入場判定 | eternalia.ui.canonical-create.pi/check |
