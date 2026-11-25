---
cat_version: '0.3'
kind: process
id: eternalia.ui.shell
status: draft
process: eternalia.ui.shell
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.ui.shell.pi", "eternalia.ui.shell.tce", "eternalia.ui.shell.relations"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Process: eternalia.ui.shell

アプリケーション共通画面の左右モバイルメニューに対する利用者境界。開閉状態、操作可能な範囲、フォーカスの遷移と観測できるヘッダー寸法を区別する。

本DraftはW07の採用済み差分を再配置する。全機能をこの部分仕様だけで閉包したとは扱わない。相手は実際の利用者という外部Processであり、検証用の論理サービスを捏造しない。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.ui.shell.pi |

## 仕様状態
| ID | Domain |
| --- | --- |
| 状態.展開 | enum{閉,主,副} |

## 観測能力
| ID | 情報源 | Domain |
| --- | --- | --- |
| 観測.狭い画面 | レスポンシブ画面条件 | boolean |
| 観測.フォーカス先 | 利用者が操作可能なフォーカス対象 | nullable<string> |
| 観測.領域内操作対象 | 開いたパネル内の操作可能な対象の列 | sequence<string> |
| 観測.起点可視 | 現在開いたパネルに対応する起点が復帰可能 | boolean |

## 作用能力
| ID | 対象 | Domain |
| --- | --- | --- |
| 作用.フォーカス | 画面上の実フォーカス対象 | nullable<string> |

## 起点
| ID | 由来 |
| --- | --- |
| メニュー展開 | eternalia.ui.shell.pi/open |
| メニュー閉鎖 | eternalia.ui.shell.pi/close |
| フォーカス移動 | eternalia.ui.shell.pi/focus-move |

## 適用範囲
三状態は既存Confirmedの表示区分を保持する。開いているパネルから対応する左右の起点が定まるため、起点IDの任意入力・独立状態は導入しない。遷移・リサイズの起点の機械形式化は未完。狭幅の具体的閾値を追加決定しない。

未形式化のEffect・Condition・外部観測関係をTCE・領域別仕様に保持する。Compilerの対応範囲に合わせて要求を削らず、正式Gateは未完了。
