# Eternalia α版：作者認証・公開境界のブラウザ受入

**状態：未実行。** TASK-20261101-008 / PR #7の独立検証手順。正本は `100_機能仕様.md` と `400_受入検証計画.md`、補助Draftは `docs/cat/drafts/anonymous-author-route-protection.md`、`studio-scheduled-publication.md`、`publication-shared-visibility-gate.md`。合成sessionのAPIテストを、実Discord OAuth2/PKCE・ブラウザ認証の成功証拠にしない。

## 実行環境と主体

- 隔離したNuxt/Nest/PostgreSQL検証環境と固定commit/DB migrationを用意し、使い捨ての**作者アカウント・別人アカウント・未認証context**を独立させる。Discord OAuth2/PKCEは許可されたテスト用OAuth設定で実施し、token/cookie/PKCE verifierをログやGitに保存しない。
- 各Playwright contextのcookie・storageを分離し、HTTPリクエストとDB before/afterを対応付ける。匿名検証に作者sessionを流用しない。公開APIのレスポンス本文とHTML初期状態も確認する。
- 公開済み親/子、非公開祖先、未来公開、未公開draft、改訂競合のfixtureを用意する。既存のユーザーデータを改変しない。

## 受入マトリクス

| ID / Draft | 操作 | 合格条件 |
| --- | --- | --- |
| AUTH-REAL-01 / ANON-AUTH-01,02 | Cookieなしで `/studio`、`/studio/memos`、`/studio/order`、`/studio/publication` を開く | 非公開本文・作者メモ・編集可能UIをDOM/HTML/初期stateへ露出しない。ログイン案内は許可 |
| AUTH-REAL-02 / ANON-AUTH-03 | 未認証contextから保護管理APIを読み書きする | HTTP 401、DB・公開状態・作者メモ不変 |
| AUTH-REAL-03 / ANON-AUTH-04 | 匿名で公開済みの物語・設定・辞書・年代記を読む | 公開四領域を読める一方、非公開祖先・未公開draftはレスポンスに含まれない |
| AUTH-REAL-04 / author ownership | 実Discordログインした作者と別人が同じ編集対象を開き、更新を試みる | 作者のみ編集可能。非本人の更新は拒否され、DBの版・本文・公開状態を変えない |
| AUTH-REAL-05 / revision conflict | 作者が同じ版から2contextで編集し、先に一方を保存する | 後続のstale更新はHTTP 409で拒否し、先行保存を上書きしない |
| AUTH-REAL-06 / scheduled publication | 公開済み作品の開始日時を十分先の未来へ設定し、その後解除する | 匿名には未来公開が不可視。解除後は公開済みsnapshotのみ再表示され、draftは露出しない |
| AUTH-REAL-07 / ancestor visibility | 親を非公開/未来公開にして子の直接URL・検索・一覧を参照する | 子の公開状態だけで祖先の非公開条件を迂回できない |

## 記録・未検証境界

各ケースを **not-run / pass / fail / blocked** とし、PR HEAD、Nuxt/Nest/DB版、fixture識別子、Playwright実行ID、HTTP status、DOM/JSONの秘匿検査、DB before/afterを記録する。認証secretや私的本文は証拠に含めない。

現在のCAT Draftは**Confirmedではなく**、正式process-closure/model-conformance、生成Red/Green、実OAuth2/PKCE、非本人browser/HTTP受入、隔離デプロイの検証は未実施。時間境界の秒精度・タイムゾーン丸めは規範未決定のため、本書は十分未来の時刻だけを検証対象とする。**本書の作成は受入テストの合格ではない。**
