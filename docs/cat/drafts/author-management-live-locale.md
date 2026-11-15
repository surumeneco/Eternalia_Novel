---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.author-management-live-locale
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/e09bd810a2d4ea5f6659e8c5a94bc185f1429019/apps/web/app/composables/useUiLocale.ts
refs: []
semantic_contract: markdown-v2
language: ja
---

# 作者の管理画面における項目種別の即時言語切替（Draft）

## 根拠・対象

CM-08（日本語・英語の基幹UIに対応し、ユーザーの作成した文章を翻訳しない）と、既存`useUiLocale`のNuxt共通リアクティブ言語状態を根拠とする。

`/studio/publication` と `/studio/order` の種別ラベルは、現在コンポーネント初期化時の固定辞書に`t(...)`を適用している。UI言語変更後も辞書オブジェクト自体が更新されず、同一画面の種別・親項目の分類ラベルのみ旧言語に残る。共通見出しや操作ボタンは既に反応するため、表示のみを現行言語へ揃える。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.author-management.publication-kind | 公開管理リストの種別ラベルは言語切替の直後に更新される |
| eternalia.ui.author-management.order-kind | 並べ替え画面の親種別・子種別選択肢は言語切替の直後に更新される |
| eternalia.ui.author-management.security | 匿名・非作者には公開管理と並べ替え操作が表示されず、作者データを取得できない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| AUTHOR-L10N-01 | 作者が公開管理のTip/Seriesを表示し、同一ページでja→en→jaを切替 | `種類 · 公開状態`の種類が`設定`→`Setting`→`設定`と切替わり、作者作成のTip名は変化しない | AUTHOR-L10N-01 |
| AUTHOR-L10N-02 | 作者が並べ替えのシリーズ親を選び、同一ページでja→en→jaを切替 | 親の種別`シリーズ`↔`Series`、子の`編`↔`Arc`が即時更新され、選択IDは保持する | AUTHOR-L10N-02 |
| AUTHOR-DOM-01 | 匿名で両管理URLへ直接移動 | 同じReaderPanel/パンくず/認証説明を表示し、管理フィルタ・並べ替えフォーム・内部項目名を出さない | AUTHOR-DOM-01 |
| AUTHOR-DOM-02 | 作者が幅320/390/768/1280pxで両管理画面を開く | Shell、TopicPath、ReaderPanelの順序を維持し、横方向の文書全体オーバーフローがない | AUTHOR-DOM-02 |

## 権威・試験範囲

CM-08を変更せず、翻訳辞書への新規語句追加、公開可否、序列保存、IDおよび作者作成コンテンツの変換も行わない。DraftはCATのConfirmed仕様ではない。実PostgreSQL＋合成作者セッションを用いた匿名/認証Chromiumは探索的な受入証拠であり、実Discord OAuthや規範CAT Gateを代替しない。
