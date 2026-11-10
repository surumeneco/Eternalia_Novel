# CAT Draft — AC-08/53: 複数意味と意味別語源の独立性

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-08, AC-53)
Scope: 既存の WordMeaningsEditor と公開スナップショットの実ブラウザ受入。

## Process / invariant

- 同じ単語に同じ品詞の複数意味を登録でき、各意味は独立したIDを持つ。
- 各意味の語源も意味ごとに独立したIDと説明を保持する。片方の意味の編集はもう一方の意味と語源を変更しない。
- 下書き保存・再読込では両意味と語源が保持される。明示公開版更新まで匿名公開稿は変化しない。
- 公開版更新後、意味と語源の対応・IDが保持される。

## Candidate vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | 同一品詞の意味A/Bと各1件の語源を作者UIで登録 | 2意味・2語源が独立IDで保存される |
| V2 | 再読込→明示公開 | 匿名公開稿の意味A/Bに各々の語源が対応 |
| V3 | 意味Aだけ編集→下書き保存 | 公開稿は旧A/旧Bのまま |
| V4 | 明示再公開 | 新A/旧Bとなり、意味Bと語源のID/本文は不変 |

CAT機械Gateと正規Red/Greenは未実行。探索的ブラウザ/DBテストの成功をConfirmed昇格の根拠とはしない。
