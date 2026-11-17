---
kind: process
id: eternalia.publication.author-status-on-tip-move
cat_version: '0.3'
status: draft
process: eternalia.publication.author-status-on-tip-move
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
semantic_contract: markdown-v2
language: ja
refs: ["eternalia.publication.author-status-on-tip-move.pi"]
---

# Process: 下書き所属移動中の作者向け実効公開状態

このProcessは作者の公開管理画面の**実効公開可否**という観測結果を扱うDraftである。Tipがカテゴリ間を下書き移動しても、明示公開前は公開スナップショット上の親から公開祖先をたどる。下書きの親カテゴリは実効公開可否の根拠にしない。公開日時の未来予約・親自身の非公開・公開稿不在も匿名読者の条件に従う。

公開/非公開フィルタと公開状態表示の整合が対象。UIラベルの細目、日時表示、編集操作、保存API、カテゴリ移動の制約は既存契約と独立のDraft DomainSpecを参照し、このProcessから実装手順を規定しない。

## 契約

閉世界: 真

## 境界

| PI |
| --- |
| eternalia.publication.author-status-on-tip-move.pi |

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
| 公開状態照会 | eternalia.publication.author-status-on-tip-move.pi/check |
