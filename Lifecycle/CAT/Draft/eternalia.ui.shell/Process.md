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
| ID | 情報源 | Domain | Available on |
| --- | --- | --- | --- |
| 観測.狭い画面 | レスポンシブ狭幅条件（利用者の入力ではない） | boolean | メニュー起点操作 |
| 観測.起点可視 | 開いたパネルの対応起点がフォーカス復帰可能 | boolean | メニュー閉鎖 |
| 観測.焦点位置 | 実DOMのフォーカス対象と開いている領域の操作対象列との位置関係（shell.focus.position） | enum{起点のみ,起点,単独,先頭,中間,末尾,領域外対象あり,領域外対象なし} | フォーカス移動 |

## 作用能力
| ID | 対象 | Domain |
| --- | --- | --- |

## 起点
| ID | 由来 |
| --- | --- |
| メニュー起点操作 | eternalia.ui.shell.pi/toggle |
| メニュー閉鎖 | eternalia.ui.shell.pi/close |
| フォーカス移動 | eternalia.ui.shell.pi/focus-move |
| 画面遷移 | 画面遷移の成立（アプリケーション内の観測可能イベント） |
| 狭幅条件解除 | レスポンシブ狭幅条件の変化 |
| 言語選択起点 | 表示言語選択の起点操作（既存の言語選択UIへの移行） |

## 適用範囲

状態.展開はモバイルのオーバーレイの開閉状態であって、デスクトップの常設ナビゲーションの可視性ではない。開いている領域から対応する左右の起点が一意に定まるため、起点IDを入力や別状態にしない。利用者に提示されるフォーカス領域はPIの観測可能な値であり、テストの合否や外部APIの返値ではない。領域内の実対象IDと隣接関係・背景遮断・ヘッダー寸法の規則はDomainSpecで保持する。特定のDOMタグ・セレクター・画面幅の閾値を新規要求しない。

メニュー閉鎖・フォーカス移動は共通メニューが受理したイベントを指す。より優先されるダイアログや消費済みキーイベントの処理はその境界の責務。画面遷移・狭幅条件解除は実際の状態変化に由来する。閉じているときの一般的なTab移動やEsc等の別機能の振る舞いは本Processが強制しない。

このDraftは有限の開閉・背景操作・フォーカス領域を機械式として定義し、実対象の循環とDOM・寸法は領域別仕様として保持する。領域別規則の検証をTCEの検証で代用しない。Confirmed化・正式Gateは未完了。
