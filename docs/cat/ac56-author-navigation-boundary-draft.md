# CAT Draft — AC-56: 公開サイトから作者画面への導線と匿名権限境界

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-56), 10_要件定義/100_機能仕様.md (AU-01〜)
Scope: 現行共通フッターの作者導線と匿名利用者の編集API遮断。旧v0.3全導線・項目直編集リンクは別Work。

## Process / invariants

- 作者は公開ホーム・一覧・シリーズ詳細から共通導線で作者の書斎へ移動できる。
- 認証済み作者の書斎では作者ライブラリを利用できる。
- 匿名読者が同じURLへ移動しても編集UIは利用できず、作者専用APIの書き込みも許可されない。
- UIの導線は認可の代替ではなく、API側の認証・認可を維持する。

## Candidate exploratory vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | 作者がホーム/一覧/シリーズ詳細の共通リンクを使用 | 書斎へ遷移し作者ライブラリを表示 |
| V2 | 匿名読者が書斎URLへ直接アクセス | 認証案内のみ、編集フォームなし |
| V3 | 匿名で作者専用POSTを呼ぶ | 401、DBに変更なし |

正式CAT Gate、別Discordアカウントの実OAuth認証、旧v0.3の全導線は未検証。
