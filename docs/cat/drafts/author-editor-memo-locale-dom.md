---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.author-editor-memo-locale-dom
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/8a4c354449398fb3f379ed2bb420eedd10341c2a/apps/web/app/pages/studio/memos.vue
refs: []
semantic_contract: markdown-v2
language: ja
---

# 作者編集・メモ画面の言語・DOM実測（Draft）

## 根拠・対象

CM-02は作者用メモの作成・編集・タグ付け、CM-07は匿名公開と作者操作の認可分離、CM-08は固定UI/エラーの日本語・英語表示を採用済みとする。作者が執筆したタイトル・本文・タグは言語切替によって自動翻訳しない。画面骨格と利用性は既存UI6の試用観測対象であり、規範許可依存表の承認ではない。

現行`/studio/memos`はAPIの保存失敗時に、HTTP状態に関係なくレスポンス`data.message`を画面へ直表示する。サーバー409の日本語競合メッセージは英語UIの固定エラー表示方針と一致しない。既存共通`localizeApiError`は言語別のHTTPエラー表示を実装しており、メモでもこれを再利用する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.memos.conflict-locale | メモの競合保存409を英語UIでは英語、日本語UIでは日本語で表示し、入力中の内容を保持する |
| eternalia.ui.memos.dom | 作者のメモ画面は共通Shell/TopicPath/ReaderPanel内で一覧・編集フォームを安全に構成する |
| eternalia.ui.editor.dom | 作者の章・Tip編集は共通Shell/TopicPath/ReaderPanelと参照パネルを構成し、未公開の下書きを匿名へ露出しない |
| eternalia.ui.author.privacy | 匿名管理URLでメモ・未公開作者情報を表示せず管理APIを401にする |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| AUTHOR-MEMO-01 | 作者がメモ編集中に別の編集元が改訂し、旧改訂で保存する（UI=en） | 競合409を英語の固定エラーメッセージで示し、メモの下書きフォーム入力を残す | 実HTTP・Chromium |
| AUTHOR-MEMO-02 | 同じ競合をUI=jaで再試行 | 日本語の競合エラーを示し、入力を保持する。失敗した保存でDB改訂番号を増加させない | 実HTTP・Chromium |
| AUTHOR-MEMO-03 | 作者のメモ/章/Tip画面を幅320/390/768/1280pxで開く | 共通Shell→パンくず→石板型ReaderPanelの実DOMを保ち、全体に横方向の溢れがない | Chromium DOM・viewport |
| AUTHOR-MEMO-04 | 匿名でメモ・作者編集URLへ直接移動 | 認証説明を表示し、メモ一覧・編集フォーム・参照パネル・未公開本文は表示しない。メモ管理APIは401 | Chromium・HTTP |

## 対象外・権威

保存時の改訂競合を受け入れる既存仕様、メモのDB構造、公開操作、作者が作成した文章の翻訳可否は変更しない。使用する合成作者セッションと使い捨てPostgreSQLの検証は実Discord OAuthや正式CAT Gateの代替ではない。本文書は未承認のCAT Draftであり、Confirmedへ昇格しない。
