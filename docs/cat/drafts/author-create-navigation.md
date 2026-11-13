---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.create-navigation
status: draft
process: eternalia.author
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1DkwRXiAkwtBY2x4TC7lLt-U7pxt4cAgR/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 共通作成導線（Draft）

## 採用根拠

CM-09 / AC-66。旧v0.3からホーム・各公開一覧で作者が新規投稿に移る導線を継承する。認証済みの唯一の作者のみ操作可能で、匿名読者は公開閲覧だけ。現行Studioの`createItem()`、親子Kind制約、API認可を使い、導線から新規作成を重複実装しない。既存の自作本文・公開状態と作者の編集中データを保護する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.author.navigation | ホーム・シリーズ一覧・4領域の公開一覧で作者のみ作成リンクを表示 |
| eternalia.author.deep-link | Studioは既存親IDと許可Kindの組を検証し、指定の新規作成フォームを開く |
| eternalia.author.security | 未認証・非作者・不正親と不正Kind・不存在項目を作成経路としない |
| eternalia.author.shared-ui | 固定作成ラベルは既存ja/en翻訳状態に追従し、作成フォームへ移っても作品名は不変 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| CREATE-01 | 匿名でホーム/4領域一覧を閲覧 | 公開データは通常表示され、作者専用作成リンクは表示されない | CREATE-01 |
| CREATE-02 | 正規作者がホーム/各一覧を閲覧 | 新シリーズ作成リンクからStudioに移り、シリーズ新規フォームを開ける | CREATE-02 |
| CREATE-03 | 正規作者が各公開一覧から対象シリーズを選ぶ | 物語→編、設定→カテゴリ、辞書→言語、年表→年代区分のフォームが該当シリーズの下に開く | CREATE-03 |
| CREATE-04 | 不明な親・異なる親Kind・許可外KindをURL queryに指定 | 任意の親に所属させるフォームを開かず、サーバの権限・構造検証を迂回しない | CREATE-04 |
| CREATE-05 | 言語をja/en切替、既存データを閲覧 | 作成リンクだけ言語に追従。公開タイトル・本文や下書きは変更しない | CREATE-05 |

## 留保

本DomainSpecはCAT Draft。AIはConfirmedに昇格せず、規範Gateの成功を偽装しない。リアルDiscord OAuth・実機・人間による受入は別。
