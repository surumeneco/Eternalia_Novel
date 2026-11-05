# CAT Draft — AC-01: 作者UIでシリーズ→編→部→章を作成・保存

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md (ST-01〜03), 40_開発・検証/400_受入検証計画.md (AC-01)
Scope: 作者画面からの階層作成と章本文の下書き保存・再読込。既存機能の探索的受入検証。

## Process / invariants

- 作者はシリーズを作成し、その配下に編、編の配下に部、部の配下に章を作成できる。
- 作成した要素のkindとparentIdは指定した階層に一致し、同一シリーズ外の要素へ誤接続しない。
- 章の本文は下書きとして保存・再読込しても保持される。明示公開操作なしに公開版を生成しない。
- 公開操作・順序変更・実Discord認証は本Workの受入対象外であり、別ACと区別する。

## Candidate exploratory vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | 作者UIで新規シリーズを作成 | シリーズが保存され選択される |
| V2 | シリーズ→編→部→章を子項目作成操作で連続追加 | 4階層の親子IDとkindが正しい |
| V3 | 章本文に日本語・改行を入力して下書き保存 | 作者DBに保存されるがpublishedはnull |
| V4 | ブラウザ再読込後に章を開く | 下書き本文が一致する |

本DraftはCAT Confirmedや機械Gateの成功を意味しない。探索的Playwright/DB検証を正規CAT Red/Greenに代用しない。
