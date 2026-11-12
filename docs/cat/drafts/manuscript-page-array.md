---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.chapter-page-array
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: 章の順序付きページ編集（CAT Draft）

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.editor | 章内のページ編集、下書き保存・読取・公開版反映 |
| eternalia.editor.keyboard-undo-ime | 編集中のIME・ルビ・Undo境界 |
| eternalia.publication | ページ単位の公開属性を持たない章単位公開 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| page.ordered | 章本文を保存・再読込するとき | ページ本文と順序を配列として保持する | PAGE-01 |
| page.edit | ページ間移動・末尾追加・途中挿入・並べ替えをするとき | 既存本文・ルビを無断変更・欠落させず、順序と選択ページを整合させる | PAGE-02 |
| page.compatibility | 旧`[[page]]`区切りの章を開くとき | 編集・再保存まで既存ページ内容を失わず、配列形式へ移行可能にする | PAGE-03 |
| page.publication | 章の下書き保存・公開版更新・非公開化をするとき | 下書きは公開版を変更せず、明示公開時に章の全ページをまとめて更新し、ページ単位公開設定を増設しない | PAGE-04 |
| page.error | 不正な配列・古い編集改訂を保存するとき | 入力・競合を拒否し、既存下書き・公開版を破壊しない | PAGE-05 |

## 受入ベクトル（Draft）

- PAGE-01: 3ページを順序付き保存し、再読込後の本文・順序を比較する。
- PAGE-02: 2ページの途中にページを挿入し、別ページを先頭へ移動してから本文・ルビ・順序を比較する。
- PAGE-03: 旧区切り文字列をページ配列に読取変換し、同等の公開内容を保持する。
- PAGE-04: 編集途中では匿名APIは旧公開版、明示公開後は新ページ配列を返す。祖先非公開なら全ページを遮断する。
- PAGE-05: 不正なページ型・上限超過・旧改訂番号での書き込みは状態不変。

## 決定・検証境界

2026-11-12利用者決定のWR-02、AC-03/33/57を現行コードへ接続するDraft。CAT Confirmedへの昇格、Process Closure、Model Conformance、implementation-conformance、実端末での日本語IME/Undo検証は未実施であり、局所テストやCI成功で代替しない。
