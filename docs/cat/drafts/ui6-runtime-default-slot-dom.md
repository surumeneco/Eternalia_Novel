---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.runtime-default-slot-dom
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1XqbwPJhSK946BSFlAoG7hM2jcQYi8gn1/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/079ed09de9997e4a70fe0703f9954588a87a72be/apps/web/app/components/ReaderPanel.vue
  - https://github.com/surumeneco/Eternalia_Novel/blob/079ed09de9997e4a70fe0703f9954588a87a72be/apps/web/app/layouts/default.vue
refs: []
semantic_contract: markdown-v2
language: ja
---

# UI6既定slotの実DOM投影の部分観測（Draft）

## 根拠と範囲

採用済みUI6試験方針の`ui.composition`は、コード上の静的依存と表示DOMの親子関係を分けて検証する。前段の限定字句監査（`UI6-COMP`）では`ReaderPanel`の`slotOutlets=["default"]`を報告したが、その子要素が実際のSSR・Hydration画面で石板領域へ投影されるかは未検証。現行コードには`ReaderPanel.vue`の`<section class="stone-panel"><slot /></section>`と、レイアウト`default.vue`の`<main class="site-main"><slot /></main>`がある。

本Workは仕様採否を変えず、**匿名読者と作者管理の既存画面の一部**で、出所とは独立したブラウザDOMを観測する。CSSで隠した管理内容を匿名へ露出しない境界も維持する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.slot.ssr-public | 匿名ホーム・公開一覧のSSRで、既定slot由来の見出しと一覧が石板面の直接子として出現する |
| eternalia.ui.slot.author | 作者のメモ・章/Tip編集画面で、石板面の既定slotにフォームや編集領域が投影される |
| eternalia.ui.slot.non-normative | 静的字句slot証拠、ブラウザDOM、許可依存・CAT規範判定を混同しない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| UI6-SLOT-DOM-01 | 匿名・JavaScript無効でホームとストーリー一覧を開く | 共通layoutのmain内に読者本文が現れ、`ReaderPanel`由来の石板面の**直接子**として見出し/シリーズ一覧がSSRで現れる。編集リンクは出現しない | Playwright/実HTTP |
| UI6-SLOT-DOM-02 | 合成作者がメモとTip編集画面を開く | 認証後に石板面の**直接子**としてメモ一覧フォーム・編集グリッドが存在し、編集側`AuthorReferencePanel`がグリッド内にある | Playwright/実HTTP |
| UI6-SLOT-DOM-03 | このDOM検査が成功する | 他画面のslot接続、名前付きslot、動的Nuxtコンポーネントの解決、UI6規範許可表、実Discordや実OS受入は別判定を維持する | 台帳・結果 |

## 権威と限界

使い捨てPostgreSQL、匿名Chromium、合成作者セッションの既存受入フィクスチャを用いる。これは既存のVue既定slotについて**観測された具体例**であり、全slot委譲の完全な解析やUI6分類・依存許可・正式CAT Gateの合格ではない。Draftを独断でConfirmedにしない。
