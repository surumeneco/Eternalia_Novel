---
kind: tce
id: eternalia.publication.author-status-on-tip-move.tce
cat_version: '0.3'
status: confirmed
process: eternalia.publication.author-status-on-tip-move
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
semantic_contract: markdown-v2
language: ja
refs: ["eternalia.publication.author-status-on-tip-move.pi"]
decision_ref: CAT/Decisions/MOVE-07-user-approval-20261117.md
---

# TCE: 作者の実効公開判定を公開稿の祖先へ一致させる

網羅要求: closed

## 振る舞い

| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| no-snapshot | 公開状態照会 | `否定(入力.公開版あり)` | 1 | `出力.実効公開可 = 偽` |
| self-blocked | 公開状態照会 | `入力.公開版あり かつ 否定(入力.自身の公開条件成立)` | 1 | `出力.実効公開可 = 偽` |
| ancestor-blocked | 公開状態照会 | `入力.公開版あり かつ 入力.自身の公開条件成立 かつ 否定(入力.公開祖先の公開条件成立)` | 1 | `出力.実効公開可 = 偽` |
| visible | 公開状態照会 | `入力.公開版あり かつ 入力.自身の公開条件成立 かつ 入力.公開祖先の公開条件成立` | 1 | `出力.実効公開可 = 真` |

## 検証境界

`入力.下書き祖先の公開条件成立` をTCEの条件に**含めない**。それが真偽のどちらでも結果が同じという観測保証を、公開祖先と下書き祖先の可視状態を反転したChromium/PostgreSQL実試験で別途照合する。`入力.公開祖先の公開条件成立` は公開稿上の親参照であり、祖先の公開稿不在・非公開・未来予約をすべて含む。この入力の生成方法は技術実装の詳細であって仕様の正本ではない。
