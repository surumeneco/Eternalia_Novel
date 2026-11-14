---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.locale-hydration-readiness
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 言語切替のSSR→水和準備状態（Draft）

## 現行仕様と不具合の観測

CM-08、AC-59/75の採用済み要件では固定UIの日本語/英語切替が利用でき、タイトルや作品本文を自動翻訳せず、切替とページ再読込で言語状態を保持する。

NuxtのSSRで先に描画される`default.vue`の言語切替ボタンは、クライアント水和の完了前にはクリックイベントハンドラが接続されていない。中途の実Chromium CI #43555036033では、初回クリック後に英語から日本語へ戻すボタンが現れず30秒タイムアウトした。水和前に無反応のボタンを操作可能にしないことを、既存仕様を変えずに実装上の正しい防御とする。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.locale.ssr-inert | SSR段階で言語切替を操作可能と見せず、無効状態で配信する |
| eternalia.ui.locale.hydrated-enabled | Vue水和を完了した後に切替操作が有効になる |
| eternalia.ui.locale.persistence | 切替後のHTML lang、Cookie、再読込、作者の本文不変を維持する |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| LOCALE-HYDRATION-01 | JavaScriptを無効にして匿名読者ページをSSR表示 | 言語切替ボタンがdisabledで、無反応のボタンを操作可能と見せない | LOCALE-HYDRATION-01 |
| LOCALE-HYDRATION-02 | JavaScriptを有効にした同じページがクライアントで水和完了 | ボタンが自動的に有効になり、1回のクリックでja/enが切り替わる | LOCALE-HYDRATION-02 |
| LOCALE-HYDRATION-03 | 英語に切り替えたまま再読込、その後日本語へ戻す | クライアントのボタンが再び水和後に有効になり、Cookie保存と本文不変が維持される | LOCALE-HYDRATION-03 |

## 限界

これは既に採用したUI言語切替の操作準備状態についてのDraftであり、仕様Confirmed化やCAT正規Gate、全実機IME受入を意味しない。探索的Chromium試験を別証拠とする。
