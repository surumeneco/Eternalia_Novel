---
cat_version: '0.3'
kind: domain-spec
id: eternalia.public.four-domain-resume
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

# 4領域シリーズ別公開読者一覧の復帰時公開再検証（Draft）

## 根拠と既存処理

100_機能仕様 PB-03/05/10/11、310_API・セキュリティ §5.1により、下書き・非公開内容・非公開祖先の名前や識別子は公開閲覧の一覧・検索・キャッシュへ露出させない。PR #85は公開検索、PR #87は詳細と章、PR #90はシリーズ目次を再検証している。独立Workではまだその対策がないシリーズ別4領域の読者画面で、既存の`usePublicReaderRevalidation`を再利用する。サーバー投影や公開判定は変更しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.public.stories.resume | ストーリー編/部/章の公開目次 |
| eternalia.public.tips.resume | カテゴリ/設定/設定項目・タグ絞り込み |
| eternalia.public.dictionaries.resume | 言語/単語/文法/意味と検索 |
| eternalia.public.timeline.resume | 年代区分・出来事、統合公開年表 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| FOUR-DOMAIN-RESUME-01 | 匿名で4領域のシリーズ別画面を開き、画面を非表示にする | 公開ツリーとそこから派生した名前/本文/リンクを無効化し、再検証中の過去の内容を表示しない | FOUR-DOMAIN-RESUME-01 |
| FOUR-DOMAIN-RESUME-02 | 非表示中に対象シリーズの公開日時を未来へ移す | 復帰時に各画面の`/api/public/series/:id/tree`を再取得し、404の場合は公開名・子情報を表示せず既存のエラー画面へ移る | FOUR-DOMAIN-RESUME-02 |
| FOUR-DOMAIN-RESUME-03 | 非表示中にシリーズを再公開する | 画面URLと利用中のUI状態を保ち、取得した新しい公開スナップショットの内容だけを表示する | FOUR-DOMAIN-RESUME-03 |
| FOUR-DOMAIN-RESUME-04 | BFCache風復帰時に公開APIが503へ失敗 | 旧公開結果をフォールバックせずエラー状態へ移行する | FOUR-DOMAIN-RESUME-04 |

## 検証境界

サーバーの「非公開祖先は404」と公開稿/下書き分離が正本。ヘッドレスChromiumではページの可視状態を合成`visibilitychange`で切り替えてイベントリスナーを検査する。実OSタブ切替、実BFCache/CDN失効、ページが前面のままの即時公開取り消し配信は未検証。CAT DraftとWorkの構文検査は正式なCAT規範Gate、Confirmed、実機受入を意味しない。
