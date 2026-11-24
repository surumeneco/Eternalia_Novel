---
cat_version: '0.3'
kind: pi
id: eternalia.ui.canonical-create.pi
status: confirmed
process: eternalia.ui.canonical-create
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# PI: eternalia.ui.canonical-create.pi

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.ui.author-editor | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.作者 | 受信 | 真偽 | 必須 |
| 入力.作成範囲 | 受信 | 列挙{root,child} | 必須 |
| 入力.親関係 | 受信 | 列挙{none,same,invalid} | 必須 |
| 入力.種別整合 | 受信 | 真偽 | 必須 |
| 出力.入場可 | 送信 | 真偽 | 必須 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| check | 受付 | 作成入場判定 |

## 制約
| 式 |
| --- |

親関係sameは実在する親の祖先系列が正規パスの系列に一致する場合。noneは親なし、invalidは親不在・異系列等。種別整合はrootならseries、childなら親の許された子種別。実データからの事実導出はこの有限モデルの判定範囲外。
