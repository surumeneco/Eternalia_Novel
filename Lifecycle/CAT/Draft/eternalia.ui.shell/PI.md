---
cat_version: '0.3'
kind: pi
id: eternalia.ui.shell.pi
status: draft
process: eternalia.ui.shell
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: []
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# PI: eternalia.ui.shell.pi

利用者が区別する値・操作・結果の意味上の境界。レコードは境界上の必要な射影であり、HTTP DTOやDOMタグの形を固定しない。値の有無は操作ごとに区別する。このPIはUIの観測射影でありHTTP応答を要求しない。表示パネルと背景操作可否は操作・状態変化後に観測される値。フォーカス領域は当該操作による明示的なフォーカス遷移が要求される場合の遷移先であり、項目の不在は実DOMにフォーカスが存在しないという意味ではない。

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.actor.user | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.メニュー | 受信 | enum{主,副} | 不在 |
| 入力.閉鎖操作 | 受信 | enum{Esc,背景} | 不在 |
| 入力.キー | 受信 | enum{Tab,ShiftTab} | 不在 |
| 出力.表示パネル | 送信 | enum{閉,主,副} | 必須 |
| 出力.背景操作可 | 送信 | boolean | 必須 |
| 出力.フォーカス領域 | 送信 | enum{主領域,副領域,主起点,副起点,本文} | 任意 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| toggle | 受付 | メニュー起点操作 |
| close | 受付 | メニュー閉鎖 |
| focus-move | 受付 | フォーカス移動 |
| toggle-view | 提供 | メニュー起点操作 |
| close-view | 提供 | メニュー閉鎖 |
| focus-view | 提供 | フォーカス移動 |
| navigation-view | 提供 | 画面遷移 |
| resize-view | 提供 | 狭幅条件解除 |
| language-view | 提供 | 言語選択起点 |

## 操作別存在
| 操作 | 項目 | 存在 |
| --- | --- | --- |
| toggle | 入力.メニュー | 必須 |
| close | 入力.閉鎖操作 | 必須 |
| focus-move | 入力.キー | 必須 |

## 制約
| 式 |
| --- |

フォーカス領域は実DOMフォーカス先の所属を示す。正確な対象の同一性・循環順序、寸法および実際の操作遮断はDomainSpecの規則を併せて適用する。適合/不適合はPIの値でない。
