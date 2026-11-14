---
cat_version: '0.3'
kind: domain-spec
id: eternalia.public.search-resume-revalidation
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

# 公開検索画面に残る旧公開情報の復帰時再検証（Draft）

## 確定要件と限定的な実装解釈

100_機能仕様のPB-03/05/10/11は匿名公開範囲と祖先非公開優先を要求する。310_API・セキュリティ §5.1は、親非公開化後の**新規取得**禁止に加え、検索・キャッシュの漏えいを防ぐ設計を要求する。HTTP APIは既存の実効公開投影を用いるが、公開検索の開いたままのブラウザタブが一度取得した公開コンテンツを無期限に表示し得る。サーバーからのプッシュ通知までは要求せず、**画面が非表示になり、再び閲覧される時点**を再検証の境界とする。

## 観測・試行契約

| ID | 状況 | 期待するブラウザ観測 |
| --- | --- | --- |
| PUB-RESUME-01 | 匿名の公開検索でTipが見えている状態から別タブへ移り、作者がその祖先を未来公開へ変更 | タブ復帰時、前回取得した検索結果を表示し続けず、公開ツリーを再取得して非公開Tipのタイトル・本文・IDを検索結果から除く |
| PUB-RESUME-02 | 非表示タブ中に作者が祖先を再公開した後、元の検索へ戻る | 検索入力・領域絞込・シリーズ選択を保持し、更新後の匿名公開ツリーに基づいて公開Tipを再表示する |
| PUB-RESUME-03 | BFCacheから公開検索が`pageshow.persisted`で復帰 | 復帰直後は過去の検索結果を一度無効化し、公開可否を再取得する。画面遷移を伴う匿名ルート再検証を代替するものではない |
| PUB-RESUME-04 | 復帰後の公開ツリー再取得が失敗する | 前回表示していた公開結果へフォールバックせず、既存の読込失敗UIを使う |

## 対象・制約

対象は`apps/web/app/pages/search.vue`の匿名公開検索に限定。現在のサーバー側`/api/public/series`/`/tree`の公開判定、既存の公開版・下書き分離、SSRとJavaScript無効の読者閲覧、多言語UI、検索フォーム入力値は変更しない。タブが連続して前面にある間のリアルタイム公開取り消し配信・実CDNや全読者ルートのBFCache設定は**未検証**。試行ロジックはブラウザで再検証可能な範囲に限定し、正式CAT Gate・実機・新規仕様承認とは独立させる。
