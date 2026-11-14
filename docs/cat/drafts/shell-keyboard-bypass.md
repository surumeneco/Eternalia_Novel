---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.shell-keyboard-bypass
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 共通Shellのキーボード本文移動と水和前メニュー操作（Draft）

## 根拠と既存実装

DS-05/AC-63〜65/78では旧ShellのHeader/SideMenu/Main/Footerを保持しながらキーボード、フォーカス、モバイルを検証する。共通UIの固定翻訳辞書には既に`skipToContent`（日本語「本文へ移動」、英語「Skip to content」）がある。しかし現行`default.vue`のShellに対応する実リンクは存在せず、キーボードユーザーはページごとに長いヘッダーナビゲーションを繰り返し通過する。WCAG 2.2の2.4.1（Bypass Blocks）は別途Web標準として参照し、プロジェクト独自のCAT正本と混同しない。

さらにモバイルの`nav-toggle`はSSR段階で押せる表示だが、水和前にはイベントハンドラがなく無反応。言語切替ボタンで既に採用した`clientReady`を再利用し、メニューも水和前に無効化する。既存のShell構造、ブランド、各リンク、ja/en、作者の本文は変更しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.shell.skip | ページ最初のTabで表示される本文移動リンクを置き、ランドマークの先頭へフォーカスを移す |
| eternalia.ui.shell.locale | 既存のja/en辞書でリンク文言を切り替え、作者が記述したタイトル・本文を翻訳しない |
| eternalia.ui.shell.mobile-ready | JavaScript無効/未水和のメニューを無効化し、水和後のメニュー開閉とARIA状態を維持する |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| SHELL-KEYBOARD-01 | 390pxと1280pxの匿名公開ページでTabを1回押す | 画面の先頭に置いた本文移動リンクが最初のフォーカス対象となり、可視化され、Enterでmain#main-contentへ実フォーカス移動する | SHELL-KEYBOARD-01 |
| SHELL-KEYBOARD-02 | 同じブラウザでja/en言語切替する | 本文移動ラベルは固定UI辞書に従って再描画され、リンクの遷移先ID・作者本文は保持される | SHELL-KEYBOARD-02 |
| SHELL-KEYBOARD-03 | JavaScript無効のモバイルSSRと、有効な水和後のメニュー | SSRのメニューボタンはdisabledで、マウント後のみ有効化し、クリックでnavの開閉とaria-expandedが一致する | SHELL-KEYBOARD-03 |

## 検証・権威境界

本Draftは決定済みのShell継承とUI品質要件に沿う実装上の改良で、正式CAT Confirmed・Process Closure・Model/Implementation Conformanceに自己昇格しない。ChromiumのキーボードとJavaScript有無を実測するが、WCAG全適合、実スクリーンリーダー・全実機、人間受入を宣言しない。
