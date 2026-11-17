# CAT Draft — AC-09: 同一言語内の重複綴り警告

Status: historical Draft (not Confirmed; duplicate policy is superseded by adopted LG-08)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-09)
Current authority: `10_要件定義/100_機能仕様.md` LG-08 and confirmed CAT Process/PI/TCE `eternalia.dictionary.spelling-collision` (approved duplicate rejection). This document remains a historical diagnostic Draft, not a normative policy source.

## Process / invariant

- 作者が同じ言語に同一綴りの別単語を編集すると、対象単語自身を除外して重複警告を表示する。
- 作者が編集中の綴りを一意なものへ変更すると警告は消える。
- 診断関数自体は自動削除・改名・保存操作を行わない。一方、保存境界は採用済みLG-08に従い、未削除の同一言語・自己以外の単語について下書きと保持中の公開版の両方を照合し、同綴を拒否する。非公開化だけでは解除せず、適法な論理削除後は重複としない。このDraftはその承認済み規則を変更しない。

## Candidate vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | 言語Lに同一綴りの単語A/B、作者がBを編集 | 重複警告が1件表示 |
| V2 | Bの綴りを別表記に編集 | 重複警告が消える |
| V3 | Bを再びAと同綴りに編集 | 重複警告が復帰 |

実Chromiumと実DBの探索的受入。正規CATのProcess/TCE/TestModel/Queue/Gateは未実行であり、本DraftはConfirmedではない。
