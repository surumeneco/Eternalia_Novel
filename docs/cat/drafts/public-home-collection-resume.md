---
cat_version: '0.3'
kind: domain-spec
id: eternalia.public.home-collection-resume
status: draft
process: eternalia.public
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# ホーム新着・公開4領域一覧の復帰時公開再検証（Draft）

## 解釈前提

現行100_機能仕様 PB-03/05/06/10/11と310_API・セキュリティ §5.1では公開情報のみを匿名一覧、新着、検索、直接参照およびキャッシュで提供する。PR #85/#87/#90の検索/詳細/シリーズ画面の復帰時失効に続き、**ホームのシリーズ一覧・新着**と4領域共通の`PublicCollectionPage`でも、非表示→再表示時に古い公開投影を破棄する。常時前面表示中の即時配信やサーバー公開判定の変更は範囲外。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.public.home.resume | ホーム公開シリーズ一覧と新着の同時失効・再取得 |
| eternalia.public.collection.resume | stories/tips/dictionaries/timeline共通公開シリーズ一覧 |
| eternalia.public.home.cache | BFCache風復帰・503時の旧公開情報の非表示 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| PUB-LIST-RESUME-01 | ホームで公開済シリーズとその新着を表示→タブ非表示中に作者が親シリーズを予約非公開 | 非表示時に両一覧の旧タイトル/IDを消し、復帰時の新規公開API応答に基づき双方を再描画する | PUB-LIST-RESUME-01 |
| PUB-LIST-RESUME-02 | 再公開後に同じホームへ復帰 | ページ再読み込みなしでシリーズと新着が再表示される | PUB-LIST-RESUME-02 |
| PUB-LIST-RESUME-03 | stories/tips/dictionaries/timelineの4一覧をそれぞれ表示→タブ非表示中に親シリーズ予約化 | 共通一覧コンポーネントが過去のシリーズ情報を残さず、復帰後も公開不可シリーズへの導線を表示しない | PUB-LIST-RESUME-03 |
| PUB-LIST-RESUME-04 | ホームでBFCache風復帰時に公開API再取得が503失敗 | 過去の公開タイトル/本文へフォールバックせず、既存の失敗UIを表示する | PUB-LIST-RESUME-04 |

## 境界

再利用する`usePublicReaderRevalidation`は既存の公開読者画面の試用ガードであり、公開APIのサーバー側実効権限、公開稿/下書き境界、匿名SSR/JavaScript無効閲覧の要件は不変。Chromiumは合成`visibilitychange`と`pageshow.persisted`で画面内の反応を検証する。実OSのタブ切替、実BFCache/CDN、常時前面の即時失効、実Discord、正式CAT Gate、人間受入は未検証。
