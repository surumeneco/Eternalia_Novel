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

## 実装前に確定する設計項目

以下はいずれも**実装案**であり、旧APIから直接確定するのはスペル昇順の既定順までである。規範承認なしにConfirmedへ昇格しない。

1. **並べ替え選択肢**: `スペル`（旧APIに従う昇順）と `品詞` を用意する。現行の固定 `order` → タイトル順を `手動順` として第三選択肢に残すか、スペル昇順を既定とするかは要確認。既存閲覧者の順序を変更する影響を評価する。
2. **品詞順**: 同一言語の公開 `wordClasses` 配列順を第一キーにする案。1語が複数品詞を持つ場合は、表示対象の品詞のうち最も早い品詞を代表キーとし、未登録品詞や品詞なしの語は後方に置く案。品詞フィルタを選んでいる場合はその品詞を対象とする。旧APIには複数品詞の代表選択規則がない。
3. **同値・照合**: スペルには `Intl.Collator('ja')` で照合し、品詞・スペルが同じなら不変IDでタイブレークする案。Unicode正規化、ロケールごとの順序や降順操作は採用が明示されるまで拡張要件としない。
4. **公開境界**: ソートは既存の匿名公開ツリーから得た同一言語・同一シリーズの可視な単語集合の**複製**にだけ適用する。非公開データをソート用に別取得しない。検索・言語/品詞絞り込みの結果集合を変えず、結果の表示順だけを変更する。

候補比較の探索的Node実行では、5語（複数品詞、同一スペル、品詞なしを含む）の順序・フィルタとの結合・原配列非破壊が成立した。ただし当該独立実験は製品ソースの試験・正式CAT Gateではなく、このルールの規範承認にもならない。

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
