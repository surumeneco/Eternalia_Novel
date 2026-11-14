---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.ui6-role-trial
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1XqbwPJhSK946BSFlAoG7hM2jcQYi8gn1/view
  - https://drive.google.com/file/d/1I7o6XHzRCqDZXxnL265oA1hZ8VifoNrA/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/51df3787877be925dff8c97289546960bc3b2b71/docs/ui-component-dependency-inventory.md
refs: []
semantic_contract: markdown-v2
language: ja
---

# UI6の既存Vue部品への試験的役割割当て（Draft）

## 位置付けと根拠

010_UI構造契約により六分類 `room/furniture/partition/equipment/structure/decor` の**試用のみ採用済み**。詳細判定条件・許可依存行列・DOM親子契約は未Confirmedである。本Draftは、2026-11-14の既存Vue SFC 15件の現行コードを直接読んだうえで主たる責務に基づき**候補**を割当てる。旧v0.3の共通Shell/公開領域継承と、現行の作者編集・公開閲覧の境界を維持する。名称やファイルサイズ・タグ階層から自動推定しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.role.catalog | 既存Vue SFCの主責務から得た試用役割と確認可能な根拠 |
| eternalia.ui.role.coverage | 未分類・削除済み候補・未知の役割文字列を隠さず報告 |
| eternalia.ui.role.edges | 既存静的依存観測器の依存先を役割付きで読み、反転の疑いを人手検討候補として出す |
| eternalia.ui.role.authority | 役割の試用とCATの規範適合・実際のDOM構造を明示的に区別 |

## 15部品の主責務と試用分類

| 部品 | 候補 | コードから確認した主責務 |
| --- | --- | --- |
| PublicCollectionPage | room | 公開領域の一覧取得・エラー/空状態・各UI部品の統合を所有 |
| ReaderPanel | structure | 装飾ではなく、slotを受ける石板型コンテンツ領域の骨格 |
| ReadingSkeleton | decor | ローディング状況の文字/視覚表現、操作入力を担当しない |
| AuthorCreateLink | equipment | 作者セッション確認に基づく作成リンク操作 |
| AuthorEditLink | equipment | 作者セッション確認に基づく編集リンク操作 |
| TopicPath | furniture | 複数リンクと現在位置のパンくず複合表示 |
| AuthorReferencePanel | furniture | 同一シリーズ内の資料検索・フィルタ・詳細プレビューの複合部品 |
| CategoryPresetEditor | furniture | カテゴリの複数プリセット行の入力・順序編集 |
| LanguageStructureEditor | furniture | 文字・連接可否・品詞マスタの複合入力 |
| LanguageStructureReader | furniture | 言語の文字/品詞の表・定義リストの複合表示 |
| RichContent | furniture | ルビ付き複数ページ本文の表示とページ操作を一体提供。**複合責務で分割評価対象** |
| TipLinksEditor | furniture | タグと関連設定の選択・並べ替え・削除の複合フォーム |
| TipLinksReader | furniture | 公開タグと公開関連リンクの複合表示 |
| WordMeaningsEditor | furniture | 意味・品詞・語源の複数行編集 |
| WordMeaningsReader | furniture | 意味と語源の複合公開表示 |

`partition`は現行対象SFC群には候補がない。**六分類すべてが存在すること自体は要求しない**。各ページ単位のレイアウトやNuxt内部部品はこの15件の対象外。とくに`RichContent`の表示とページ遷移を単純に`equipment`へ再分類せず、主責務は読書体験の合成として試用する。

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| UI6-TRIAL-01 | 現行の明示的なVue SFC一覧が与えられる | 試用役割を名称に対応付ける。既知の役割文字列のみ受理し、現在の全対象の被覆率・未分類・古い割当を報告する | UI6-TRIAL-01 |
| UI6-TRIAL-02 | 新しいSFCが追加される、古いSFCが消える、または候補に未知の役割がある | ソース未読のものを役割へ自動推定しない。未分類・不正・古い割当を別々に報告する | UI6-TRIAL-02 |
| UI6-TRIAL-03 | 静的依存グラフにUI6候補を重ねる | 観測したfrom/toと各roleを決定的順序で出す。structure/decor/equipmentからroomへの参照等の逆向き疑義は**レビュー候補**であり違反確定ではない | UI6-TRIAL-03 |
| UI6-TRIAL-04 | 分類済み率が100%または循環が見つからない | 試用候補の被覆や静的依存はCAT規範Gateのpassed、許可依存・DOM契約の合格、機能受入とみなさない | UI6-TRIAL-04 |

## 非対象と権威

この試用監査は`scripts/audit-ui-component-deps.mjs`の既存限定字句検査に依存する。静的importとtemplate合成の**根拠は区別できていない**。複数ディレクトリ、Nuxtの動的解決、slots委譲、実ブラウザDOM、操作/フォーカス、分類の意味的正当性は未検証。候補割当はAIによるDraftでありConfirmしない。正式CAT Gateの実行結果と独立し、利用者の実機/デザイン受入は別。
