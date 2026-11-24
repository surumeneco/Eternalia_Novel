---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.session-resume-boundary
status: draft
process: eternalia.author
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: 作者セッションの失効と正規管理入口

200 §6.2–6.4、AC-18/19/22/83/95の採用済み要求に基づく限定的な検証単位。作者メニューはサーバーが現行セッションを認可している場合に限り表示する。メニューは認可境界ではない。実Discordプロバイダの動作と端末固有のBFCacheは別受入。

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author | OAuth認証成功と管理入口への遷移、作者セッションの再確認 |
| eternalia.public | 公開読者画面からの作者メニュー、作成・編集入口 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| auth.callback.entry | 許可作者のOAuth完了が成功 | 発行した作者Cookieを設定し、現行管理ホームへ遷移する。旧Studioを認証完了時の入口にしない | callback-controller |
| auth.menu.valid | 現行セッションの再確認が認可成功 | ヘッダー・フッターおよび公開画面の作者入口を表示可能 | session-resume |
| auth.menu.invalid | 現行セッションの再確認が未認可、失効または失敗 | 作者入口を表示せず、保護URL/APIは独立に拒否 | session-resume |
| auth.menu.resume | 公開画面の復帰・フォーカス・画面遷移 | 旧認可結果を再確認する。実際に失効したサーバーセッションを認可済みとして扱わない | session-resume |
| auth.menu.preserve | 編集中のセッション確認 | メニューの再確認のみを理由に未保存原稿を破棄しない | 既存未保存保護回帰 |

## 検証境界
合成OAuthプロバイダを用いる既存PostgreSQL試験で実コントローラの応答を確認する。専用の合成セッションをPostgreSQL上で失効させ、同一Chromiumページの復帰時にヘッダー・フッター・作者入口を検査し、保護URL/API拒否を照合する。正式な全状態Process/PI/TCE Gate、実Discord、実OSでの復帰は別判定。無操作状態の即時通知/監視を新たな採用仕様にしない。
