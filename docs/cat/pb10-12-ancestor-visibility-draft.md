# CAT Draft — PB-10/11/12: 祖先非公開時の匿名遮断

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md §7.1 (PB-10, PB-11, PB-12)
Scope: α版の既存公開判定に対する実DB・HTTP・Chromium受入回帰。新しい公開仕様は導入しない。

## Process / invariant

- 作者はシリーズと配下の4領域（章、設定項目、単語・文法、年表イベント）を作成し、各祖先と末端を明示公開できる。
- 全祖先と対象自身が実効公開なら、匿名APIと読者画面から公開版を閲覧できる。
- 祖先を1つでも非公開にすると、子自身の isPublic が true のままでも匿名の直接API/画面/検索から子孫が遮断される（PB-10, PB-11）。
- 祖先を再公開すると、子自身の個別公開状態を変更せずに公開判定を再計算する。非公開の子は引き続き非公開（PB-12）。
- 作者の保存済み公開スナップショットは公開状態の切替で破壊されない。

## TestModel / candidate vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | 公開済みの全4領域末端、公開祖先 | 匿名API 200 |
| V2 | シリーズのみ非公開、末端は公開のまま | 全末端API 404、直接読者画面にタイトルなし、検索に単語なし |
| V3 | シリーズ再公開 | 全末端API 200、公開版本文保持 |
| V4 | 言語を非公開 | 単語・文法のみ404、他領域の公開は維持 |
| V5 | 設定の親Tipを非公開 | TipSectionのみ404 |
| V6 | 年代区分を非公開 | Eventのみ404 |
| V7 | 単語自身を非公開→言語を非公開→言語を再公開 | 単語は404のまま、他の言語子孫は公開可能 |

## Evidence contract

実DB・実HTTP・Chromiumで独立したフィクスチャを作成する。テストコードの追加とCI実行を実証し、Red/Greenの実測・CAT機械Gateの未実行は別々に記録する。機械的 process-closure、TestModel生成、model-conformance、implementation-conformance は未実行であり、上記は正規生成物ではない。
