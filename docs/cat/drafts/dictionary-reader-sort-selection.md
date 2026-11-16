---
cat_version: '0.3'
kind: domain-spec
id: eternalia.dictionary.reader-sort-selection
status: draft
process: eternalia.dictionary
source_refs:
  - https://drive.google.com/file/d/1v7p6qOMV6FLIt-Yp_HZ07k8KfOiRUesS/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/19Of1aedkX08JAl7c788eQc6f9j7K1ree/view
  - https://drive.google.com/file/d/1jbEyxADNSk43Gukde1nO7ePblxSJWE69/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/5997cb491894f463ec630f6d65b3a92078895910/apps/web/app/pages/dictionaries/%5Bid%5D.vue
refs: []
semantic_contract: markdown-v2
language: ja
---

# 辞書の品詞・スペル並べ替え選択（Draft）

## 根拠と現行観測

旧v0.3の `300_辞書共通機能.md` は辞書閲覧共通機能として「品詞、スペルでのソート順指定」「品詞での絞り込み」「スペル、意味での検索」を別々に記述している。現行LG-07はこの継承機能を要求する。

`develop@5997cb491894f463ec630f6d65b3a92078895910` の `apps/web/app/pages/dictionaries/[id].vue` を確認した結果、検索入力、言語/品詞フィルタは存在するが、**閲覧者による並べ替えモード選択UIがない**。単語一覧は `children()` の固定 `order` → タイトル順であり、ソート選択に応じた切替ではない。共通検索 `/search` のソート選択はシリーズ別辞書画面の品詞並べ替えの代替にはならない。

### 旧API・旧実装との照合（仕様根拠と観測を分離）

- 旧v0.3の `300_DetailDesign/200_Backend/200_API/300_Dictionary/Word.md` にある `Language/Word/SelectPublicInfo` は、公開単語リストの順序を **`Dictionary_D_Word.Spell` 昇順**と明記する。これは旧APIの既定順を示す根拠だが、閲覧UIの品詞ソート切替時の複合キーまでは定めない。
- 同 `Language.md` の言語詳細APIは、品詞マスタ `Dictionary_M_Class` を **`Order` 昇順**で返す。現行の公開言語スナップショットは `details.wordClasses` に順序付き配列を保持するため、言語固有の品詞順は実装候補にできる。
- 旧 `Eternalia_frontend/develop@170fb60` の `pages/dictionaries/[language]/index.vue` は `TODO: 未作成` であり、UI操作、複数品詞の代表キー、昇降順の選択を実装済みの先例として扱えない。
- 現行 `wordParts()` は1単語の複数意味から複数品詞を返す。**品詞で並べ替えても単語を重複行に分割しない**ことが現在の一覧構造と整合する候補であるが、その代表品詞選択の意味は旧仕様では未確定。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.dictionary.reader | シリーズ内の公開単語一覧に対する閲覧者の並べ替え選択 |
| eternalia.dictionary.visibility | 同一シリーズの公開投影のみを入力にし、検索・表示の変更で非公開情報を露出しない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| dictionary.reader.sort-selection | 辞書閲覧者が並べ替え基準を選ぶ | **品詞**と**スペル**を選択でき、結果の並びが選択に応じて更新される | SORT-01, SORT-02 |
| dictionary.reader.sort-filter | 言語と品詞の絞り込み、スペル・意味の検索を組み合わせる | フィルタを保持し、表示中の結果だけを選択基準で並べ替える | SORT-03 |
| dictionary.reader.sort-privacy | 非公開単語、公開予定前の単語、別シリーズの単語がある | 公開済みの対象だけを並べ替え、見えない語の名称・件数を露出しない | SORT-04 |
| dictionary.reader.sort-stability | 同一キーの複数語がある | 並べ替えの結果が不安定に入れ替わらず、読書・操作を妨げない | SORT-05 |

## 採用前の設計判断（Issue #1／LG-07、承認待ち）

2026-11-16の現行 `develop@1c7824bdb4a5597d6164c1443908b69e02ddbaf6` の `apps/web/app/pages/dictionaries/[id].vue`（Git blob `f7c45f1ebb416214648f3c8293e5f99ba379910a`）を読み戻した。従来の観測と同様、単語は `order` → 題名で固定ソートし、検索・言語/品詞フィルタはあるが、**並べ替え選択UIはない**。この不足は採用済みLG-07の範囲だが、以下の選び方は旧v0.3にも現行要件にも明記されていない。Draftを確定仕様として扱わない。

### 既定順の選択（利用者の決定が必要）

| 候補 | 初期表示 | 利点と影響 |
| --- | --- | --- |
| **A（推奨）** | **スペル昇順**。選択肢は `スペル` / `品詞` / `手動順` | v0.3 `Language/Word/SelectPublicInfo` の `Spell` 昇順を既定値として継承。既存の作者指定 `order` は「手動順」で引き続き読める。ただし現在の読者画面の初期並びは変わる |
| **B** | **手動順**。選択肢は `手動順` / `スペル` / `品詞` | 現行画面の初期並びと作者の並べ替え操作を維持。旧APIの `Spell` 昇順は閲覧者が選んだときのみ適用される |

両案とも **品詞とスペルの選択機能を提供する**のでLG-07の機能自体に違いはない。既定順がどちらかはユーザー体験の継承判断であり、旧APIの既定値だけを根拠に現行UIの変更を承認済みにしない。

### 品詞による並べ替えの規則案（同時承認対象）

1. 公開中の単語は **言語ごとの単語一覧内で**並べ替える。全言語選択時も言語見出しの順序と所属を変えず、別言語の同綴語を混合しない。並べ替え対象は匿名APIが既に投影した単語のみとする。
2. 品詞の順序はその言語の**公開版** `details.wordClasses` の配列順（旧 `Dictionary_M_Class.Order` 相当）を優先する。複数品詞を持つ単語は**1行のまま**とし、所属する品詞のうちマスタ上で最も早いものを代表キーとする。検索/品詞絞込を併用する場合、絞込後の表示集合は変更せず、選択中の品詞がその単語に含まれるならその品詞を代表キーにする。
3. 公開版マスタに存在しない品詞は既知品詞の後に置き、その品詞名→スペルで決定的に並べる。品詞自体がない語はさらに後方にする。公開版マスタが存在しない言語でも単語一覧・選択UIは機能し、作者下書きの品詞マスタを参照しない。
4. 同値の最終順序は公開スペル（既存UIと同じ `localeCompare(…, 'ja')`）→既存 `order`→不変IDで決定する。ロケール固有の創作言語照合規則・Unicode正規化・降順指定・複数行への品詞別分割は追加要件とせず、必要なら別途仕様化する。
5. 並べ替え処理は言語/品詞フィルタとスペル・意味検索の**後**に、可視な結果のコピーにだけ適用する。元ツリー、公開日時、個別非公開判定、件数、読者用公開スナップショットは不変とする。

この規則案は既存の `wordParts()` と `wordClasses` の公開投影を利用する実装可能性に基づく**提案**であり、旧v0.3の明示仕様ではない。「複数品詞の語を品詞ごとに別行へ複製する」案は単語ID/意味/語源/読者リンクの重複表示を生み、現行の1単語1レコード一覧と不整合となるため採用を推奨しない。

### 後続工程の入口と停止条件

- 決定が必要なのは **(a) 既定順A/B** と **(b) 上記の品詞代表キー・未登録品詞の扱いを採用するか** の二点。レイアウトや内部関数名等の技術細部を過剰に承認事項化しない。
- 決定前は既存 `issue-work` の設計Draftのまま保持する。利用者の意思を記録した根拠なしにConfirmedへ昇格したり、本番コード/テストを正式 `spec-implementation` として着手したりしない。
- 決定後、対象のProcess/PI/TCE Draft作成と規範確認、正規 CAT Process Closure／Model Conformance／Vectors／Queue／Red-Green／Conformance、実Chromium/PGでの SORT-01〜06 を独立実装Workへ引き継ぐ。既存公開制御とフィルタは回帰対象とする。

## 受入ベクトル候補

| ID | 操作 | 期待の範囲 |
| --- | --- | --- |
| SORT-01 | 1シリーズにスペル順と作成順が異なる公開語を登録し、スペル順を選ぶ | 表示順がスペル基準へ変わる |
| SORT-02 | 複数品詞の公開語を登録し、品詞順を選ぶ | 合意済みの代表品詞規則で安定ソートされる |
| SORT-03 | 言語/品詞フィルタと意味検索の併用中に並べ替えを変更 | 結果集合は変えず、順序のみ変わる |
| SORT-04 | 非公開・未来予約・他シリーズの語を混在させる | 未公開の語は一覧・ソートUIに現れない |
| SORT-05 | キーが同じ複数の語で選択を往復する | 決定的なタイブレークで表示順が再現する |
| SORT-06 | ある言語の品詞マスタ順を変更し、別の言語に同名品詞がある | 品詞順は同一言語の公開マスタに従い、別言語・下書き設定へ依存しない |

## 権威と工程

旧v0.3からの**並べ替え機能の継承**は既存要求にある。一方、複数品詞の代表キー等は提案段階。本書は `issue-work` の設計Draftであり、CAT Process/PI/TCEのConfirmed一式、Closure/Model/Queue/Implementation Gateや実機受入の合格を意味しない。必要な仕様判断を得た後に独立した `spec-implementation` Workへhandoffする。
