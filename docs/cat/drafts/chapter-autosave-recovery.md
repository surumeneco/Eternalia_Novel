---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.chapter-autosave-recovery
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/41
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec Draft: WR-07 章下書き自動保存と入力回復

## 採用済みの要件と実装設計の区別

- WR-07: 章本文を編集中に自動で下書きを保存し、通信断・競合でも未保存入力を保持する。
- PB-18: 自動下書き保存は公開スナップショットを変更せず、公開版は作者の明示操作のみで更新する。
- AC-11/12: 更新は改訂競合を検知し、二重書込みや無通知上書きをしない。
- このDraftで選ぶ1.5秒デバウンス、当該タブのsessionStorage、復元確認UIは未確定の実装詳細であり、利用者がその意味を別途確認したConfirmed仕様ではない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.editor | 章ページ配列を編集中の自動下書き保存と復元 |
| eternalia.publication | 下書きと公開版の分離 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| autosave.debounce | 章タイトル・本文ページ・詳細を編集中 | IME変換中は送信せず、一定時間入力停止後に下書きPATCHする | AC-11-1 |
| autosave.serial | 保存リクエストが進行中に追加入力 | 並列PATCHせず保存完了後に最新の入力を保存する | AC-11-2 |
| autosave.revision | 別の編集元が改訂を進めた | 古いrevisionでの409を検出し、自動上書きを止め、編集内容を残す | AC-11-3 |
| autosave.recovery | 切断・再読込・一時的な送信失敗 | 対象タブ内で復元候補を保持し、明示的に復元できる | AC-11-4 |
| autosave.publication | 自動保存のみ実行した | 匿名読者への公開版は変更しない | AC-11-5 |
| autosave.identity | ログアウトした | ログアウト後、作者原稿の復元候補を同じタブに残さない | AC-11-6 |

## 境界

初期実装対象は `chapter` に限定する。他の種別の汎用編集・手動保存・明示公開・公開可否・作者認証・投稿成功の判定は現状の契約を保持する。通信結果が不明な場合は書込みの成功を推定せず、読み戻しまたは手動確認を要求する。競合解決は自動上書きではなく利用者の明示操作を必要とする。

Confirmed Process/PI/TCE の正規承認、Process Closure、Model Conformance、TDD Queue、implementation-conformance は現在未確認。探索的テストやCIの結果をCAT正規Gateの成功と混同しない。
