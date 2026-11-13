---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.localized-author-api-errors
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 作者UIのAPI由来エラーメッセージの言語切替（Draft）

## 根拠と境界

CM-08 / AC-59/75採用。作者画面の固定UIとエラーメッセージはja/enに対応する。サーバー由来の日本語例外文字列を英語UIへそのまま表示しない。APIのHTTPステータス・識別コード・既存作者認可・保存フローは変更しない。詳細なドメインエラー表示がない場合も未知のエラー原文を表示言語と無関係に露出しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.api-errors | HTTPステータス・例外コードから作者向け固定エラーへ変換 |
| eternalia.ui.author | Studioの保存・公開管理で同じ変換器を共有 |
| eternalia.ui.fallback | jaでは既存APIの詳しい日本語を維持し、enでは安全な英語メッセージを表示 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| ERROR-01 | ja表示でサーバーからmessageを受信 | 既存日本語・配列のメッセージをそのまま表示し、既存の詳細を欠落させない | ERROR-01 |
| ERROR-02 | en表示で400/401/403/404/409を受信 | 対応する英語固定文言を表示。日本語のmessageをそのまま転載しない | ERROR-02 |
| ERROR-03 | en表示で未知・ネットワーク・5xxを受信 | 英語の既定失敗メッセージを表示し、認証情報やサーバーの内部文言を開示しない | ERROR-03 |
| ERROR-04 | 保存失敗後 | 既存の下書き内容・競合情報・画面状態を変更せず、表示文言だけ差し替える | ERROR-04 |
| ERROR-05 | 英語/日本語切替、その他の言語 | アプリ共通の言語状態を使い、未対応言語はjaへフォールバック | ERROR-05 |

## CAT境界

本仕様はDraft。正式CAT Gate合格や実機での実Discord認証・多言語受入を表明しない。
