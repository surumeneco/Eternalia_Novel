---
cat_version: '0.3'
kind: domain-spec
id: eternalia.settings.preset-id-collision
status: draft
process: eternalia.settings
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/b4bb57d0b10c84bd8f50242efceba40db64e4097/packages/contracts/src/novel.ts
refs: []
base_revision: b4bb57d0b10c84bd8f50242efceba40db64e4097
semantic_contract: markdown-v2
language: ja
---

# CAT Draft — 設定項目プリセットの生成ID衝突

既存の採用要件 ST-01/ST-02/ST-03（独立した設定と設定項目、作成時のプリセット複製）と AC-49/50 のデータ独立性を根拠とする。**この文書は Draft であり Confirmed ではない。** 生成ID方式を設計決定として固定しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.settings.tip | 異なる設定を一意に識別するID |
| eternalia.settings.tip-section | プリセット複製から生成される項目のID・所属先 |
| eternalia.settings.category-preset | 設定作成時点でのプリセット複製 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| preset.identity.isolation | IDの末尾だけが異なる二つの設定を、同じプリセット付きカテゴリに作成する | 異なる設定項目が同じIDを共有しない | 既存実装に対する回帰テストで再現。具体的なID発行方針は未決 |
| preset.creation.atomic | 生成される設定項目IDが既存データと衝突する | 既存設定と項目を破壊・誤参照・変更しない | 結果と入力Libraryの不変性を直接検証 |
| preset.normal.creation | 生成IDが衝突しない | 既存のプリセット複製・独立編集を維持する | 同カテゴリの通常作成の回帰テスト |

## 観測と未決

- 2026-11-05: createNode は生成する tipSection IDを親Tipの先頭30文字と連番6桁で決定する。末尾6文字のみ異なる二つの有効なUUID形IDは同一の生成IDを得る。元実装はこの重複を検出せず Library.nodes へ追加する。
- 回避策の候補は「衝突時に作成を拒否して原子性を保つ」と「一意ID生成方式を変更する」。後者は既存識別子との互換・同期実装でのID発行権限を要確認。暫定的な防御コードは正規CAT Gate完了扱いにしない。
- CAT Process/PI/TCEのConfirmed昇格、Process Closure、TestModel、正規Red/Green、Implementation Conformance、実DB/ブラウザ受入はいずれも **not-run**。探索的Node Red/Greenは別証拠。
