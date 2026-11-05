# CAT Draft — AC-04: 原稿編集中の設定・辞書参照

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-04)
Scope: AuthorReferencePanelによる同一シリーズの作者下書き参照と、原稿未保存バッファの非破壊性。

## Process / invariant

- 作者が章本文を未保存のまま編集中でも、同じシリーズの設定・単語を作者用参照パネルで検索し、内容を閲覧できる。
- 参照の検索・種類フィルター・対象切替は章本文の編集中バッファを変更せず、参照先の公開状態も変更しない。
- 未公開の参照資料は匿名APIでは取得できない。
- 作者が明示保存した原稿は再読込で復元できる。

## Candidate vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | 未保存章本文と未公開設定Tipを同一シリーズに用意 | 設定の作者下書きを参照でき、章本文は不変 |
| V2 | 種類を単語へ変更し未公開Wordを参照 | 単語の作者下書きを参照でき、章本文は不変 |
| V3 | 参照後に章本文を保存・再読込 | 編集本文が保持され、参照先の匿名APIは404 |

正式CATの機械Gateは未実行。実Chromium/DBの探索的受入証拠と区別する。
