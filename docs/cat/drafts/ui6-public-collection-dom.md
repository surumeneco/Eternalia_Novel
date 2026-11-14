---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.public-collection-dom
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1XqbwPJhSK946BSFlAoG7hM2jcQYi8gn1/view
  - https://drive.google.com/file/d/1I7o6XHzRCqDZXxnL265oA1hZ8VifoNrA/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開四領域コレクションのDOM骨格観測（Draft）

## 位置付け

旧v0.3のHeader/SideMenu/MainContents/Footer、パンくず、石板風の情報面の継承を基準にし、現行Nuxtの`PublicCollectionPage`（UI6 trialの`room`候補）が`TopicPath`・`ReaderPanel`・`AuthorCreateLink`・`ReadingSkeleton`を合成する**実ブラウザDOM**を検証する。これは現行で実装済みの構造の受入証拠を増やす観測Workであり、DOM規範やUI6役割確定を偽装しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.collection.dom | 公開四領域一覧のナビ・見出し・主コンテンツの実DOM意味構造 |
| eternalia.ui.collection.ssr | JSが使えない匿名ブラウザでのSSR一覧表示 |
| eternalia.ui.collection.responsive | 小型携帯からデスクトップまでの横幅・移動の観測 |
| eternalia.ui.collection.auth | 作者作成リンクが匿名DOMに現れない境界 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| UI6-DOM-OBS-01 | 匿名でstories/tips/dictionaries/timeline一覧を開く | ヘッダー・aside・main・footerがあり、mainのパンくずnavが見出しと公開一覧を含む石板sectionより先に同じ親に描画される | UI6-DOM-OBS-01 |
| UI6-DOM-OBS-02 | JS無効の匿名ブラウザで各一覧を開く | サーバーが公開済みシリーズの見出し・導線をHTMLに描画し、クライアント水和待ちのみでは空にならない | UI6-DOM-OBS-02 |
| UI6-DOM-OBS-03 | 幅320/390/768/1280pxで各一覧を見る | 機能の維持と、意図しないドキュメント全体の横方向オーバーフローを起こさない | UI6-DOM-OBS-03 |
| UI6-DOM-OBS-04 | 未ログインで各公開一覧にアクセス | 作者用の作成導線を実DOMに出さず、公開一覧への導線は保持する | UI6-DOM-OBS-04 |

## 権威・限界

DOMはブラウザ上の観測であり、`room/furniture/equipment/structure/decor`の割当や、六分類の依存許可表の正当性の証明ではない。既存の静的Vue SFC観測と別の軸で検証する。Chrome/Chromiumの合成HTTP環境と実端末、実Discord OAuth、正式CAT Gate、旧FE同内容画像比較は独立。DraftをConfirmedに自己昇格しない。
