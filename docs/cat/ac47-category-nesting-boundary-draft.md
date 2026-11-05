# CAT Draft — AC-47: カテゴリの階層制約

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md (ST-03), 40_開発・検証/400_受入検証計画.md (AC-47)
Scope: シリーズ直下のカテゴリ作成・編集と、カテゴリ内カテゴリの作成拒否。

## Process / invariants

- カテゴリはシリーズ直下に作成でき、名称・説明の下書きを編集できる。
- カテゴリ配下にさらにカテゴリを作る操作は作者UIの種類候補に現れず、直接APIから要求しても親子階層不正として拒否される。
- 不正な作成要求は既存カテゴリや他の要素のID・内容・親子関係を変更しない。

## Candidate exploratory vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | シリーズ直下でカテゴリ作成・編集 | 保存・再読込で内容保持 |
| V2 | カテゴリ配下の新規作成UI | 子カテゴリの選択肢なし |
| V3 | カテゴリを親とするカテゴリ作成API | 400、DBに不正要素なし |

正式CAT Gateや実Discord認証は未実施。探索的ブラウザ/ドメイン検証を代替しない。
