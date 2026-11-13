---
cat_version: '0.3'
kind: domain-spec
id: eternalia.content.soft-delete
status: draft
title: Nonpublic leaf content logical deletion
process: eternalia.content
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://drive.google.com/file/d/15X2GtGxr7iO4HrFgi5tmqqRGCKeC5flY/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# CM-10 / AC-76: 非公開済みデータの論理削除（Draft）

## 利用者採用済み意味論

2026-11-12決定。削除は非公開済みの対象に限り、子孫および参照元の存在する対象の連鎖削除を認めない。削除した管理情報は公開状態と別に保持し、ゴミ箱・復元UIは実装しない。独立のDisabledフラグも設けない。

## 独立 Work の探索的検証条件

| ID | 前提 | 操作・期待結果 |
| --- | --- | --- |
| DEL-01 | 公開版があり現在非公開、子孫/参照元のない対象 | 改訂番号を照合して削除日時を保存。レコード/元の下書き/公開スナップショットは監査用にDBに残し、作者通常一覧には出さない |
| DEL-02 | 公開中・未公開・既削除の対象 | 拒否。状態・改訂・DBを変更しない |
| DEL-03 | 子孫が下書きまたは公開済みで残る対象 | 非公開済みでも削除不可。下書きの所属と公開スナップショット上の所属の両方を参照検証 |
| DEL-04 | 設定関連/語源に参照先として使用された対象 | 参照元の下書き・公開版の一方でも残れば削除不可 |
| DEL-05 | 旧改訂番号、存在しないID、非作者のAPIリクエスト | それぞれ409、404、401/403を返し、データを保持 |
| DEL-06 | 論理削除後の匿名アクセス | 直接URL、階層一覧、検索、新着、パンくず、関連参照で存在・名称・本文を出さない |
| DEL-07 | 論理削除後の操作 | 削除済みIDの編集・公開・公開設定・順序操作・参照対象化を拒否し、IDを再利用しない |

## 技術上の境界

- deletedAtは公開状態isPublicとは独立した墓標時刻であり、公開の第4状態でもありません。
- 移動途中のTipの公開親はスナップショットを優先して、削除可能判定でも元の公開親の子を見落とさない。
- 永続化された未公開/公開両方の参照グラフを走査し、依存関係の削除連鎖を許可しない。
- 細部の復旧UI・監査保持期間は後続検討。物理削除はしません。

## CAT境界

このDomainSpecはDraftであり、規範Process/PI/TCEのConfirmed宣言や正式CAT Gate通過の証拠ではありません。変更と自動テストは探索的証拠として別管理します。
