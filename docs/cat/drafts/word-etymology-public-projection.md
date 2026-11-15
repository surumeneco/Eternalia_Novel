---
cat_version: '0.3'
kind: domain-spec
id: eternalia.dictionary.etymology-public-projection
status: draft
process: eternalia.dictionary
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/09861644b30a26a29151aa8677da3d122874698e/packages/contracts/src/novel.ts
refs: []
semantic_contract: markdown-v2
language: ja
---

# 複数意味に属する語源参照の公開版・祖先制御検証（Draft）

## 根拠と対象

LG-05/06は同一単語の複数意味（同じ品詞の異なる意味も含む）と**意味ごとの**複数の語源参照を継承する。PB-10/15は非公開言語・単語の投影を遮断し、意味・語源の公開設定は所属単語に従う。PB-18の下書きと明示公開版の分離も維持する。語源先を辿る画面とデータの参照の合否は別層とし、ここでは共有`toReader`の語源ラベル投影だけを試験する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.dictionary.etymology.ids | 同一品詞の複数意味IDが混同されず、各意味の個別語源ID/順序を維持する |
| eternalia.dictionary.etymology.ancestor | 語源先言語が非公開/未来予約なら参照ID・タイトルを公開投影へ漏らさない |
| eternalia.dictionary.etymology.snapshot | 語源先単語の作者下書き改名は公開ラベルを変えず、明示公開後に初めてラベルが更新される |
| eternalia.dictionary.etymology.boundary | 権限制御を伴う参照の内容は公開版・祖先公開条件のみから生成する |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| ETYM-PUBLIC-01 | 同じ品詞に異なる意味2件と別々の語源リストがある | 公開投影は意味ID・語源ID/順序を混同せず保存する | Node領域試験 |
| ETYM-PUBLIC-02 | 語源先の言語を非公開または未来予約に変更する | 公開語源から非公開参照IDとタイトルが消え、別意味の公開語源は維持する | Node領域試験 |
| ETYM-PUBLIC-03 | 語源先単語を下書き改名し、次に明示公開する | 公開元は公開版名だけを投影し、下書き改名中は変化せず、公開更新後に変化する | Node領域試験 |
| ETYM-PUBLIC-04 | この探索試験が成功する | ソース整合性の証拠であり、語源参照の全UI導線・性能・CAT正式Gate・人間受入の合格としない | 台帳 |

## 権威・留保

新しい削除・循環語源の仕様、時刻制御、外部語源の同定など未決の詳細を勝手に採用しない。既存ドメイン関数の実行証拠のみで規範CAT Gate通過を宣言しない。独立CAT Draftのまま保持する。
