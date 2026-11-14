---
cat_version: '0.3'
kind: domain-spec
id: eternalia.public.reader-resume
status: draft
process: eternalia.public
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開詳細表示・章読書・シリーズ目次の再表示検証（Draft）

## 確定要求との関係

100_機能仕様 PB-03/PB-05/PB-10/PB-11と310_API・セキュリティ §5.1は、非公開化・予約公開化された対象や祖先の情報を新たな匿名閲覧から遮断する。既存のサーバー公開投影は新規取得時に判定しているが、一度表示した読者画面のNuxt状態は非表示タブ中に公開設定が変わった後も旧データを表示し得る。前回PR #85の検索と同じ再検証境界を、直接参照できる詳細画面にも広げる。これは正式CAT分類の確定や実端末の承認ではない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.public.reader.items | `/items/:id` の公開詳細本文とパンくず経路 |
| eternalia.public.reader.chapter | `/read/:id` の公開章全ページ・前後章導線 |
| eternalia.public.reader.series | `/series/:id` の公開目次・シリーズ名 |
| eternalia.public.reader.lifecycle | 隠蔽・復帰・BFCacheと再取得失敗時のfail-closed |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| READER-RESUME-01 | 公開Tip詳細を開き、非表示中に親カテゴリを未来公開へ変更し、画面復帰 | 既取得のタイトル・本文・関連情報・パンくずを非表示にし、公開itemとpathを再取得して非公開エラーを表示する | READER-RESUME-01 |
| READER-RESUME-02 | 章の読書画面を開き、非表示中に上位Partを未来公開へ変更し、画面復帰 | 章本文・ページ・前後章名・導線を破棄し、公開章/経路/目次を再取得して非公開エラーにする | READER-RESUME-02 |
| READER-RESUME-03 | シリーズ目次を開き、非表示中にシリーズ本体を未来公開へ変更し、画面復帰 | 旧シリーズ名・旧公開ツリーと一覧を描画し続けず、再取得後に非公開エラーへ移る | READER-RESUME-03 |
| READER-RESUME-04 | 復帰時に対象を再公開した、または再取得が503失敗した | 再公開時は同じURLで最新版の公開スナップショットを再表示する。503時は古い本文を復活させず既存のエラー表示へ移行する | READER-RESUME-04 |

## 解釈範囲と未検証

既存の公開API、階層公開判定、下書きと公開稿の分離を変更しない。JavaScript無効時の初期SSRも変更しない。ブラウザの`visibilitychange(hidden)`・`pagehide`・BFCache`pageshow.persisted`を再検証起点とする。表示中の常時監視やWebSocketによる即時取り消し配信、CDNの失効、実OSのタブ切替は別課題とする。ヘッドレスChromiumではvisibilityState変更を合成イベントで起こすため、その試験だけで実端末の可視状態挙動を確認済みとはしない。DraftおよびWorkの構文チェックは正式Process Closure/Model Conformance/Implementation Conformanceに代わらない。
