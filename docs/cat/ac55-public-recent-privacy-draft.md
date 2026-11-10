# CAT Draft — AC-55: 匿名ホームの新着公開項目と非公開遮断

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-55), 10_要件定義/100_機能仕様.md (PB-10〜12)
Scope: 新着一覧API、匿名ホーム表示・ジャンプ、章の非公開後の除外。全領域・並び替え・キャッシュの完全検証は別Work。

## Process / invariants

- 明示公開済みの章は、祖先がすべて実効公開なら匿名の新着一覧に表示され、読者用の章URLへ遷移できる。
- 下書きだけの項目や非公開の章・非公開祖先の子孫は、匿名の新着一覧・直URLから取得できない。
- 公開済み章を非公開に切り替えた後、新着一覧とホーム画面は当該章を表示しない。
- 新着の順序は公開版の時刻に基づき、未公開下書き更新日時を公開更新と扱わない。

## Candidate exploratory vectors

| Case | Action | Expected |
| --- | --- | --- |
| V1 | 章を下書き保存、公開版なし | 新着に表示しない |
| V2 | 祖先・章を明示公開 | 匿名新着APIとホームに章が出現、章へリンク |
| V3 | 章を非公開に切り替え | 新着API・ホーム・直URLから消える |

本Draftは正式CAT Gateや生成テストのpassを意味しない。合成作者セッションと実Chromiumによる探索的検証を区別する。
