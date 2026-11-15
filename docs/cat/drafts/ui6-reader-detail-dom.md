---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.reader-detail-dom-observation
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開シリーズ・設定詳細・章本文の実DOM観測（Draft）

## 根拠・範囲

公開4領域の共通一覧は既存UI6-DOM-OBSで観測済みだが、公開シリーズ目次、汎用設定詳細、章本文の画面は構造・SSR・端末幅別のDOM観測が不足する。現行CM-01/05、PB-02/03、WR-05および旧v0.3画面継承設計を根拠に、現行Vueの`TopicPath`、`ReaderPanel`、`RichContent`と共通Shellの実DOM合成を探索的に検証する。UI6六分類の規範表や許可依存関係を決めるものではない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.reader-detail.dom | 公開シリーズ・Tip詳細・章本文の各画面で共通Shell・ナビ・コンテンツ面が正しいDOM順序で合成される |
| eternalia.ui.reader-detail.ssr | JavaScript無効時も公開タイトル・章本文・すべての章ページが初期HTMLに含まれ、下書きが混入しない |
| eternalia.ui.reader-detail.viewport | 320〜1280pxの匿名公開詳細画面で水平方向のページ全体の溢れがない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| UI6-DETAIL-DOM-01 | 匿名でシリーズ、公開Tip、公開章を開く | `header/aside/main/footer`、ラベル付きパンくず、直後の石板コンテンツ面、階層に対応した見出しが存在し、作者編集リンクを表示しない | UI6-DETAIL-DOM-01 |
| UI6-DETAIL-DOM-02 | 匿名Chromiumを320/390/768/1280pxに変更する | 各詳細画面で横溢れせず、記事と章ナビを含むコンテンツが親の石板面に収まる | UI6-DETAIL-DOM-02 |
| UI6-DETAIL-DOM-03 | JavaScriptを無効にして同じ公開URLを開く | 公開済み名称と章の全ページがSSRに現れ、未公開の章下書きタイトルと本文は現れない | UI6-DETAIL-DOM-03 |

## 検証の境界

使い捨てPostgreSQL、匿名Chromiumと合成作者セッションでない既存公開フィクスチャの読取を使用する。コンポーネントの静的役割分類の確定、CAT Confirmed・規範Gate、OS実機の操作・IME・CDNキャッシュの結果に代わるものではない。
