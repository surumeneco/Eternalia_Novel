# CAT Draft — AC-11: 下書き保存の通信断と再試行

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-11)
Scope: 作者UIでの単発PATCH通信断、入力保持、再送後の永続化。実回線・オフライン継続編集の全条件は対象外。

## Process / invariants

- 作者が入力した未保存本文は、保存APIの通信断によって失われない。
- 失敗を成功と表示せず、作者が失敗を識別できる。
- サーバー側の下書きは失敗した操作では変更されず、再試行が成功した場合だけ保存内容が反映される。
- 明示公開版更新を伴わない下書き保存は匿名公開内容を変更しない。

## Candidate exploratory vectors

| Case | Action | Expected |
| --- | --- | --- |
| V1 | 作者UIで未保存本文を編集 | 入力内容を保持 |
| V2 | 次の保存PATCHだけ通信断にする | エラー表示、入力保持、DB未変更 |
| V3 | 通信を回復し再保存 | 成功表示、DBに本文を保存 |
| V4 | 作者画面を再読込 | 保存した本文を再取得 |

CAT機械Gateは未実行。合成セッション・Playwright通信断は実Discord認証や実端末の成功を意味しない。
