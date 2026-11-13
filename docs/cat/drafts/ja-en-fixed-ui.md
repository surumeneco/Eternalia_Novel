---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.ja-en-fixed-text
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 固定UI・エラー文言のja/en切替（Draft）

## 根拠と境界

2026-11-12採用のCM-08とAC-59/75。作者が作成した小説、設定、単語、文法、年表名や本文は翻訳しない。固定UI文言・通知・クライアントのエラーをja/enへ切替可能とする。zh/deは初期範囲外。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.catalog | 現行jaキーの欠落なく、英語の固定文言を提供 |
| eternalia.ui.switch | 同一端末の言語指定をCookieで保持し、SSR/CSRで表示一致 |
| eternalia.ui.content-boundary | 利用者が作成した本文・見出し・ユーザーデータを自動翻訳しない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| locale.complete | 既存固定UIキーを参照 | ja/enの各キーを対応させ、未登録言語は既存jaフォールバック | LOCALE-01 |
| locale.switch | グローバルヘッダでjaとenを切替 | ナビ・状態・メッセージを切り替え、Cookieでリロードを跨いで維持。HTML言語属性も同期 | LOCALE-02 |
| locale.authored | 利用者作成のシリーズ・本文や設定を表示 | UI言語変更で作品データの文字列を変更しない | LOCALE-03 |
| locale.errors | 保存・公開/認証等の固定エラー・確認文言を表示 | 対応する英語固定UI文言を選択。APIから返る動的メッセージの伝送は別Workで監査 | LOCALE-04 |
| locale.unknown | Cookieが未知の言語文字列 | jaへ安全にフォールバックし、JavaScriptオブジェクトの継承キー等を使用しない | LOCALE-05 |

## CAT境界

本文はCAT Draft。規範Confirmedの宣言や正式CAT Gate、実機ja/en受入を代替しない。
