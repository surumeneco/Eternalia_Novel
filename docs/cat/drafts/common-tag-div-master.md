---
cat_version: '0.3'
kind: domain-spec
id: eternalia.common-master
status: draft
process: eternalia.master
source_refs:
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
  - https://docs.google.com/document/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/edit
  - https://docs.google.com/document/d/15X2GtGxr7iO4HrFgi5tmqqRGCKeC5flY/edit
  - https://docs.google.com/document/d/1f1j3dds7AlnSx1iYGkegdIZMnoo7zFXo/edit
  - https://docs.google.com/document/d/1sr6gcUc1qyVZ2bg-jIEAN0Zd9nLJD1AD/edit
refs: []
semantic_contract: markdown-v2
language: ja
---

# 共通Tag/Divマスタメンテ（承認方針の具体化Draft）

## 目的と規範の境界

現行 `100_機能仕様.md` CM-09、`200_情報構造・画面設計.md` §6.2、受入計画 AC-58/75/81 は、共通のタグ・区分の維持管理画面を対象に含める。旧v0.3には `Common_M_Tag` と `Common_M_Div` とその `Select` / `SelectManage` / `Register` API がある。現行 `300_データモデル.md` の旧い統一・一般化未決記述は、2026-11-24の利用者決定（Issue #165）による採用方針を踏まえて見直す。Tag/Divはサイト共通・安定ID、辞書Classは言語別とし、旧データ形式互換は要求しない。本DraftはProcess/PI/TCEの機械的Confirmed化や正式CAT Gateの合格を意味しない。

## 対象

| Ref | Aspect |
| --- | --- |
| common.tag | 共通Tagの選択・管理・登録・変更・参照整合性 |
| common.div | 共通Divの選択・管理・登録・変更・参照整合性 |
| tip.tags | 公開版と下書きの分離、シリーズ境界 |
| memo.tags | 作者メモの非公開境界 |
| dictionary.class | 言語別品詞マスタとして保全（共通Divへ混合しない） |

## 規則

| ID | Condition | Requirement | Verification |
| --- | --- | --- | --- |
| master.auth | 非作者がマスタ管理・変更を要求 | 管理データと変更機能へアクセスさせない | 匿名・非作者HTTP 401/403と状態不変 |
| master.tag-list | 作者がGroup指定でタグ候補を要求 | 対象Groupの候補と順序を表示 | 異Groupの混入と順序の境界確認 |
| master.div-list | 作者がKind指定で区分候補を要求 | 対象KindのName・Value・順序を表示 | 異Kindの混入と順序の境界確認 |
| master.write | 競合・無効入力・通信失敗で登録を試行 | 部分登録と参照破損を防ぐ | 同時更新・エラー後のDB readback |
| master.public | 公開Tipと下書き・作者メモの内容が異なる | 公開版は最後の明示公開スナップショットに従う | 匿名API検索・メモ秘匿・公開版スナップショット比較 |
| master.class | 共通Divと辞書の品詞を編集 | 言語単位品詞の安定IDと独立管理を保持 | 言語間混入なし・編集後の既存意味参照維持 |

## 既存で区別すべき対象

| 対象 | 現行根拠と状態 | 境界 |
| --- | --- | --- |
| 共通タグ（Tag） | 旧 `Common_M_Tag`: ID、Group、Tag、Order。グループ別選択と管理一覧、グループ別登録が旧APIに存在 | シリーズ内のCategoryやTipではない。タグは公開状態の親にならない |
| 共通区分（Div） | 旧 `Common_M_Div`: Kind、Name、Value、Order。種別別選択と管理一覧、種別別登録が旧APIに存在 | Dictionaryの言語別品詞Classとは**別** |
| 言語別品詞（Class） | 現行 LG-05: 言語ごとの安定ID・順序・単語意味からの参照 | 共通DivのCRUDに流用・統合しない |
| 設定のタグ参照 | Tip下書きでは共通Tagの不変IDを参照し、読者向け公開稿には明示公開時点のタグ表示値を保持 | 親の公開状態や所属Categoryを変更しない |
| 作者メモのタグ参照 | 共通Tagの不変IDで参照する（旧文字列名配列は互換維持不要） | 公開APIへメモ・メモの非公開タグを漏らさない |
| 画像タグ | 旧v0.3にD_ImageTagが存在。現行UI画像挿入は後続候補 | 現行の画像機能を勝手に稼働・参照移行しない |

## 観測すべき操作と状態（仕様化の対象）

| 起点 | 事前状態 | 成功時に観測する結果 | 失敗時に保つ結果 |
| --- | --- | --- | --- |
| 作者がタグ管理へアクセス | 作者認証済、Tagが0件/複数件 | Group別にTagと順序を把握できる | 匿名・非作者に管理データを開示しない |
| 作者が区分管理へアクセス | 作者認証済、Divが0件/複数件 | Kind別にName/Value/順序を把握できる | 匿名・非作者に管理データを開示しない |
| 作者が選択候補を取得 | GroupまたはKindが指定済 | その条件に属する候補だけを指定順序で返す | 無関係な候補・非公開データを混入させない |
| 作者が登録・編集する | 重複なし、入力有効、保存版が既知 | 対象マスタの新状態を読み戻せる | 入力不正・競合・障害では部分適用・破損を生じさせない |
| 作者が名称・順序を変更する | 既存参照が0件/複数件 | 既存参照と公開版の契約に沿って表示を更新 | 未決の参照移行を自動で行わない |
| 作者が削除する | 未参照/下書き参照/公開版参照/メモ参照 | 承認された参照・削除方針の範囲でのみ実行 | 参照切れ、意図しない公開データの書換えを起こさない |
| 読者が公開Tipを検索する | 作者下書きと公開版が相違 | 最後の明示公開スナップショットだけに従う | マスタ操作だけで未公開の下書き・メモを露出しない |

## 制約と保持対象

- 作者のみ書込み・管理一覧閲覧。匿名公開閲覧APIと管理APIを分離する（既存のDiscord本人認証＋サーバー権限判定）。
- Tag/Divは共通マスタとして調査するが、**シリーズ間の作品・本文・資料共有を新設しない**。シリーズ別タグの所有境界は以下の未決事項が確定するまで実装上の仮説とする。
- TagのGroup、DivのKind、表示順、重複判定、変更時の参照整合性をそれぞれ検証する。Tag.NameとDiv.Name/Valueの取り違えを認めない。
- 公開Tipのスナップショットと下書き、作者メモ、言語別品詞の状態空間を混同しない。保存・公開・非公開の境界は従来の規範を維持する。
- 旧v0.3 Tag/SelectのOrder参照が `Common_M_Div.Order` であった箇所、Tag/SelectManageの子要素参照が `Common_M_Div.Tag/Order` となっていた箇所は他テーブルを指しており、旧記述をそのまま実装する根拠にならない。旧 `Register` は更新・削除・同時実行の正確な原子性を定義しない。

## 利用者承認済みの設計境界（2026-11-24）

[Issue #165の承認記録](https://github.com/surumeneco/Eternalia_Novel/issues/165#issuecomment-7106396316)に基づき、次を採用する。

1. サイト共通のTag（Group・Name・Order）とDiv（Kind・Name・Value・Order）を管理し、Dictionary Class（言語別品詞）は混合しない。シリーズに属する本文やTipそのものの共有は行わない。
2. TagとDivは安定IDを持つ。Tip/Memoの編集用参照はTag IDとし、**旧形式のタグ名配列を保つ互換レイヤー・移行・自動backfillは実装しない**。一方、読者向けの既公開版は明示公開時点の表示名のスナップショットを保持し、マスタ操作で下書き・公開稿が意図せず変化しない。
3. 変更は作者専用の行単位CRUD、順序変更、改訂の楽観競合検出を基本とし、エラー時は原子処理。旧v0.3のRegister APIの全件置換動作は不採用。参照中のTagの改名・削除は拒否する。Divに参照元が生じる場合も参照整合性を保つ。
4. Tipの既存タグ自由入力を無断で廃止しないという**旧形式互換の説明**は採用しない。現行モデルの新しいTag選択UIとする。ただしタグによる横断分類、公開検索、関連設定、メモ非公開、シリーズ隔離等の機能保証は保持する。

この設計における入力上限、並べ替えの操作粒度、具体的DBテーブル・API型・UI配置は採用要件に基づく実装設計事項であり、ここから独立した規範を増やさない。ユーザーの「おおむね問題ない」は旧データ互換を積極的に要求する意味ではない。


## 後続の正式Gateと受入

このDraftが正当な承認でConfirmedへ昇格した後、Process・PI・TCEを相互参照する正本として組み立てる。正規 `process-closure`、TestModel/`model-conformance`、vectors、TDD Queue、Red/Green、`implementation-conformance`、DB migrationと実HTTP/UI試験の順に検証する。実機の本人Discord OAuth、Pixel 8等のタッチ・IME・viewport挙動はテストCI・モデル検証と分ける。
