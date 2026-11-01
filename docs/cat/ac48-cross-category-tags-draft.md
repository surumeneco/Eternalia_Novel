# CAT Draft — AC-48: カテゴリをまたぐタグ検索

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-48)
Scope: 既存Tipタグと設定集の公開ブラウザ検索。タグは親子・公開状態を継承する親ではない。

## Process / invariant

- 異なるカテゴリに所属するTipに同じタグを付けても、各Tipの所属カテゴリは変更されない。
- 匿名設定集で共通タグを選ぶと、複数カテゴリの公開Tipを横断的に表示する。
- カテゴリ絞込とタグ絞込を併用しても、表示対象のカテゴリ所属が維持される。
- 一方のTipを非公開にしても、他方の同タグTipは公開されたまま残り、非公開Tipの名称は出ない。

## Candidate vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | カテゴリA/Bに同タグの公開Tip各1件 | タグ選択で2カテゴリ/2Tipが表示 |
| V2 | タグを維持しカテゴリAのみ絞込 | Aのみ表示、Bは非表示 |
| V3 | AのTipを非公開 | Aは匿名404、Bは公開・タグ検索に残る |

CAT機械Gate未実行。実DB/Chromiumの探索的受入証拠をConfirmed判定と混同しない。
