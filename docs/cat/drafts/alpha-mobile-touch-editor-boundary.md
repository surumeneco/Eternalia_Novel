---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.mobile-touch-editor-boundary
status: draft
process: eternalia.author-editor
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/1I7o6XHzRCqDZXxnL265oA1hZ8VifoNrA/view
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 作者編集のモバイルタッチ・IME操作境界（探索的CAT Draft）

## 対象

作者がスマートフォン幅の実Chromiumで本文選択とツールバー操作を行う際の編集バッファ保持、および4領域の編集フォームが小画面で操作可能かを検証する。確定済みの下書き・公開稿分離とレスポンシブ方針を参照する。タッチの詳細な挙動や未決の編集キャンバスのデザインは仕様として新規確定しない。

| Ref | Aspect |
| --- | --- |
| AC-65 | モバイル表示と原稿編集操作 |
| AC-69 | 下書き保存と明示公開の分離 |
| TASK-20261101-009 | 実Android/日本語IMEは実機検証であり合成イベントと区別 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| MOB-01 | 390pxのtouch enabled Chromiumで章本文の中央を選択後、ルビボタンをtap | 選択本文を保持したルビが挿入され、読み選択範囲とフォーカスが保たれる | 実Chromium + HTTP |
| MOB-02 | 同じ端末でページ区切りボタンをtap | 選択文字を失わず区切りが挿入される | 実Chromium + HTTP |
| MOB-03 | compositionstart中にツールバーを参照 | ルビ・区切り挿入は無効化され、compositionend後は再び使用可能 | 実Chromiumの合成イベント（実IMEではない） |
| MOB-04 | スマートフォン幅320/390pxの4領域編集 | 水平はみ出しなし、本文・保存アクションが表示・操作可能 | 実Chromium viewport |
| MOB-05 | タッチ操作後に下書き保存・明示公開 | 保存だけでは非公開、明示公開後にのみ新本文を匿名読者が取得可能 | 実HTTP + PostgreSQL |

## 制限

本ArtifactはDraftであり、正規CAT process-closure、model-conformance、implementation-conformanceおよびConfirm済みTestModelの代替としない。Chromiumのtouchエミュレーションと合成compositionイベントは実Android/OS日本語IME変換操作の受入合格ではない。旧v0.3画面との人間による比較も未実施として区別する。
