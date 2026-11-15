---
cat_version: '0.3'
kind: domain-spec
id: eternalia.dictionary.reader-sort-selection
status: draft
process: eternalia.dictionary
source_refs:
  - https://drive.google.com/file/d/1v7p6qOMV6FLIt-Yp_HZ07k8KfOiRUesS/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/5997cb491894f463ec630f6d65b3a92078895910/apps/web/app/pages/dictionaries/%5Bid%5D.vue
refs: []
semantic_contract: markdown-v2
language: ja
---

# 辞書の品詞・スペル並べ替え選択（Draft）

## 根拠と現行観測

旧v0.3の `300_辞書共通機能.md` は辞書閲覧共通機能として「品詞、スペルでのソート順指定」「品詞での絞り込み」「スペル、意味での検索」を別々に記述している。現行LG-07はこの継承機能を要求する。

`develop@5997cb491894f463ec630f6d65b3a92078895910` の `apps/web/app/pages/dictionaries/[id].vue` を確認した結果、検索入力、言語/品詞フィルタは存在するが、**閲覧者による並べ替えモード選択UIがない**。単語一覧は `children()` の固定 `order` → タイトル順であり、ソート選択に応じた切替ではない。共通検索 `/search` のソート選択はシリーズ別辞書画面の品詞並べ替えの代替にはならない。

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

- 複数品詞を持つ1単語の「品詞ソートキー」。初出品詞、辞書順の代表品詞、絞り込み選択中の品詞のいずれを採るかは旧v0.3に明記されない。これを勝手にConfirmedの規範へ昇格させない。
- 品詞が未登録の語の位置と、ひらがな・漢字・ラテン文字が混在した場合の照合規則（実装では決定的な同値タイブレークが必要）。
- 現行の手動順序を第三の選択肢として保持するか。既存のデフォルト順序を破壊しない実装案を比較する。

## 受入ベクトル候補

| ID | 操作 | 期待の範囲 |
| --- | --- | --- |
| SORT-01 | 1シリーズにスペル順と作成順が異なる公開語を登録し、スペル順を選ぶ | 表示順がスペル基準へ変わる |
| SORT-02 | 複数品詞の公開語を登録し、品詞順を選ぶ | 合意済みの代表品詞規則で安定ソートされる |
| SORT-03 | 言語/品詞フィルタと意味検索の併用中に並べ替えを変更 | 結果集合は変えず、順序のみ変わる |
| SORT-04 | 非公開・未来予約・他シリーズの語を混在させる | 未公開の語は一覧・ソートUIに現れない |
| SORT-05 | キーが同じ複数の語で選択を往復する | 決定的なタイブレークで表示順が再現する |

## 権威と工程

旧v0.3からの**並べ替え機能の継承**は既存要求にある。一方、複数品詞の代表キー等は提案段階。本書は `issue-work` の設計Draftであり、CAT Process/PI/TCEのConfirmed一式、Closure/Model/Queue/Implementation Gateや実機受入の合格を意味しない。必要な仕様判断を得た後に独立した `spec-implementation` Workへhandoffする。
