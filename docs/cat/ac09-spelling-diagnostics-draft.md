# CAT Draft — AC-09: 同一言語内の重複綴り警告

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-09)
Existing behavior: packages/contracts/src/spelling-diagnostics.ts — diagnostics only; rejection policy undecided.

## Process / invariant

- 作者が同じ言語に同一綴りの別単語を編集すると、対象単語自身を除外して重複警告を表示する。
- 作者が編集中の綴りを一意なものへ変更すると警告は消える。
- この警告は自動削除・改名・登録拒否を行わない。採否未決の「警告／拒否」規則を勝手に固定しない。

## Candidate vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | 言語Lに同一綴りの単語A/B、作者がBを編集 | 重複警告が1件表示 |
| V2 | Bの綴りを別表記に編集 | 重複警告が消える |
| V3 | Bを再びAと同綴りに編集 | 重複警告が復帰 |

実Chromiumと実DBの探索的受入。正規CATのProcess/TCE/TestModel/Queue/Gateは未実行であり、本DraftはConfirmedではない。
