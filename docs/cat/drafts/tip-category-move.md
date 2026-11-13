---
cat_version: '0.3'
kind: domain-spec
id: eternalia.settings.tip-category-move
status: draft
process: eternalia.settings
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/15X2GtGxr7iO4HrFgi5tmqqRGCKeC5flY/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: 既存設定のカテゴリ間下書き移動（Draft）

## 対象と承認根拠

2026-11-12採用のST-08・AC-46。設定(Tip)は同じシリーズ内の単一カテゴリに所属し、下書き所属の移動時点では匿名読者向けの旧公開所属を維持する。公開版更新でのみ新所属に移る。新規カテゴリのプリセットは既存Tipへ再適用しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.settings | Tipの下書き所属を同シリーズの別Categoryへ変更 |
| eternalia.publication | 下書きの移動と公開所属を独立させ、公開祖先と公開稿を保持 |
| eternalia.settings.link | 設定のタグ・関連設定・TipSectionの同一性と投影 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| category.move.target | 移動先を指定 | 同シリーズの既存Categoryのみ許可し、同じCategory/別シリーズ/他種別/不在を拒否する | MOVE-01 |
| category.move.revision | 古い改訂番号で移動 | 409相当の競合として拒否、既存下書き・公開稿不変 | MOVE-02 |
| category.move.draft | 有効なカテゴリ移動 | Tip ID・本文・タグ・関連・配下TipSectionを保持し、下書き親と改訂だけを更新。移動先プリセットを適用しない | MOVE-03 |
| category.move.published | 公開中Tipを下書き移動 | 旧公開親とその公開祖先条件のまま読者一覧・URL・関連/検索・パンくずを維持。新カテゴリへ読者情報を漏らさない | MOVE-04 |
| category.move.publish | 移動後に明示公開版を更新 | 同じTip IDの公開所属を新カテゴリへ移す。新しい祖先の公開状態が適用され、旧所属に残らない | MOVE-05 |
| category.move.auth | 移動APIを作者以外が呼び出す | 認証とサーバ側作者ガードで拒否し、データを変更しない | MOVE-06 |

## 探索的受入ベクトル（Draft）

- MOVE-01: 同一シリーズの2カテゴリで移動可能。別シリーズ、カテゴリ以外、自己、未分類は拒否。
- MOVE-02: 更新済み改訂では旧改訂の移動を拒否し、ライブラリは不変。
- MOVE-03: TipSectionのID/本文/順序、元のプリセット適用内容・タグ・関連を移動の前後で比較する。
- MOVE-04: 移動直後、旧カテゴリの公開ツリー/パンくず/直URLが残り、新カテゴリの公開ツリーに出ない。
- MOVE-05: 明示公開後、新カテゴリ下でのみ公開・閲覧され、祖先非公開なら取得不可。
- MOVE-06: 匿名と非作者の管理移動APIは拒否し、既存DBを変更しない。

## 決定・Gate境界

機能意味論は採用済み。CATのProcess/PI/TCE一式のConfirmedと機械的Process Closure/Model Conformance/Queue/implementation-conformanceは本Draftにより自動的には成立しない。探索的実装テストと正式Gateを区別する。
