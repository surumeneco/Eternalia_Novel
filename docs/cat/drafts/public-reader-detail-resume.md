---
cat_version: '0.3'
kind: domain-spec
id: eternalia.public.reader-detail-resume
status: draft
process: eternalia.public
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開詳細・章本文の復帰時再検証（Draft）

## 解釈前提

100_機能仕様 PB-03/05/10/11と310_API・セキュリティ §5.1では、匿名公開経路の下書き遮断、非公開祖先優先、およびキャッシュ/既表示データを含む漏えい防止を要求する。PR #85で公開検索の復帰時再検証を導入済み。今回は読者が既に開いた**汎用詳細と章本文**に限り、タブ非表示とBFCache風復帰時の「古い公開情報を残さない」を実装・観測する。前面表示中のプッシュ型即時失効は保証範囲外。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.public.detail.resume | /items/:id の本文、関連資料、パンくず |
| eternalia.public.chapter.resume | /read/:id の章本文、ページと前後章導線 |
| eternalia.public.detail.cache | 非表示・復帰時のNuxt公開投影無効化・取得失敗時の閉鎖 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| PUB-DETAIL-RESUME-01 | 公開済Tip詳細を表示した読者がタブを非表示化し、その間に作者がカテゴリを予約公開へ変更 | 詳細と祖先パンくずの旧タイトル/本文を消し、復帰時の匿名APIの404を受けて非公開表示へ移る | PUB-DETAIL-RESUME-01 |
| PUB-DETAIL-RESUME-02 | 非表示中にカテゴリを再公開し同じ詳細へ戻る | 匿名APIから最新の公開版を再取得し、再読み込み操作なしで本文を表示する | PUB-DETAIL-RESUME-02 |
| PUB-DETAIL-RESUME-03 | 章本文を表示し、非表示中に親の部/編を非公開にする | 章本文/ページ本文を消し、公開API404後に非公開エラーへ移る。非公開の前後章導線も表示しない | PUB-DETAIL-RESUME-03 |
| PUB-DETAIL-RESUME-04 | BFCache風のpageshow後に公開詳細再取得が失敗する | 過去に取得した公開稿の再表示へフォールバックせず、既存エラーUIを表示する | PUB-DETAIL-RESUME-04 |

## 制約・証拠境界

対象は`apps/web/app/pages/items/[id].vue`と`read/[id].vue`。既存サーバー公開投影、SSR、作者管理/下書き保存の意味は変えない。汎用Composableは公開読者用の取得にのみ利用する。ヘッドレスChromiumの合成`visibilitychange`／`pageshow.persisted`は**ブラウザ内処理**の検査であり実OSタブ切替・実BFCache・CDN・常時前面タブの同期失効・正式CAT Gate・人間受入の証明ではない。
