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

# 共通Tag/Divマスタメンテ（CAT Draft、未承認）

## 目的と規範の境界

現行 `100_機能仕様.md` CM-09、`200_情報構造・画面設計.md` §6.2、受入計画 AC-58/75/81 は、共通のタグ・区分の維持管理画面を対象に含める。旧v0.3には `Common_M_Tag` と `Common_M_Div` とその `Select` / `SelectManage` / `Register` API がある。ただし現行 `300_データモデル.md` は Tag/TipTag/MemoTag/ImageTag の統一と区分マスタの一般化を**物理設計前の検討事項**とし、データの参照・削除・再命名の挙動までは確定していない。本DraftをConfirmed仕様、実装済み、正式CAT Gate合格と扱わない。

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
| 設定のタグ参照 | Tipの下書き・公開版にタグ名情報を保持し、Categoryを跨ぐ分類・検索に用いる | 親の公開状態や所属Categoryを変更しない |
| 作者メモのタグ参照 | 非公開 `author_memos.tags` は文字列配列。Tip公開情報から隔離 | 公開APIへメモ・メモの非公開タグを漏らさない |
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

## Normative Authorityへの要決定事項

以下は**候補**であり本Artifactでは決定しない。

1. **マスタの所属範囲**：旧v0.3のようなサイト全体の共通Group/Kindとするか、TagのGroupをシリーズにスコープさせるか。推奨候補は「共通マスタはサイト管理、Tagを付けたTipはシリーズ所属を維持し参照先コンテンツの共有はしない」。
2. **参照識別方式と移行**：既存のTip/Memo文字列タグを、共通Tagの安定IDに移すか、文字列互換を保ちマスタは選択候補の一覧とするか。前者は移行・公開版の互換性が必要、後者は改名の一貫性を保証しない。自動的に既存の公開スナップショットを書き換えない方針を優先する。
3. **Registerと削除の意味**：旧APIのGroup/Kind一括登録を全置換とみなすか、個別登録/編集/明示削除を定義するか。推奨候補は明示的な行単位操作＋同時更新の改訂競合、参照中の物理削除拒否。
4. **タグの名称変更の公開投影**：参照中タグの改名を既公開Tipへ即時反映するか、下書き更新後の明示公開まで読者には旧名称を保持するか。既存の下書き/公開スナップショット分離と整合する後者を推奨するが、ID参照へ移行するなら読者投影規則も確定する必要がある。

## 後続の正式Gateと受入

このDraftが正当な承認でConfirmedへ昇格した後、Process・PI・TCEを相互参照する正本として組み立てる。正規 `process-closure`、TestModel/`model-conformance`、vectors、TDD Queue、Red/Green、`implementation-conformance`、DB migrationと実HTTP/UI試験の順に検証する。実機の本人Discord OAuth、Pixel 8等のタッチ・IME・viewport挙動はテストCI・モデル検証と分ける。
