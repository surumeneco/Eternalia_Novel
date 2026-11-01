# CAT Draft — AC-02: 編の改名と兄弟表示順変更

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-02)
Scope: 同一シリーズの編（volume）2件に対する作者UIでの順序変更と改名。部・章への拡張は別検証。

## Process / invariants

- 同一親・同一kindの兄弟要素を作者が順序変更でき、保存後のDB orderと再読込後の表示順が一致する。
- 順序変更は各要素のID、親ID、本文、公開スナップショットを改変しない。
- 作者が編の名称を編集・下書き保存すると、該当IDの下書き名称だけが変更され、兄弟の名称・親子関係・順序は保持される。
- 競合・公開読者画面・実Discord認証・部/章の全階層は本Workの受入対象外とする。

## Candidate exploratory vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | 同一シリーズの編A・Bを作者の並び替え画面に表示 | 初期順序A→B |
| V2 | Aを下へ移動して確定 | DB orderはB=0,A=1、IDと親IDは不変 |
| V3 | 並び替え画面を再読込 | B→Aの順序を保持 |
| V4 | 作者の書斎でAの名称を変更・保存・再読込 | Aのみ改名、Bと順序は不変 |

本DraftはConfirmedやCAT機械Gateのpassを意味しない。探索的Playwright/DB試験と正式な生成テストは区別する。
