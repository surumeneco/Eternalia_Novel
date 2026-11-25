---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.shell.relations
status: draft
process: eternalia.ui.shell
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.ui.shell.pi", "eternalia.ui.shell.tce"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Domain Specification: eternalia.ui.shell.relations

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.ui.shell | 複数実行間の関係・実DOM構造・状態不変性（適用する規則に限定） |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| shell.layout.invariance | 同一画面幅でメニューを閉じた状態と展開状態 | ヘッダーの高さ・幅は同じで、本文を押し下げない。右起点は主、左起点は副。 | 実ブラウザのbounding box前後比較とキーボード・タッチ操作 |
| shell.focus.boundary | パネル展開時のDOM/アクセシビリティ構造 | 本文・フッター・背景操作対象へのキーボード／ポインタ操作は遮断され、展開中のパネルと対応起点だけが共通メニューのキーボード循環対象となる。実際の背景操作の遮断を状態フラグだけから推定しない。 | 実DOM、Tab/Shift+Tab、背景操作の実測 |
| shell.focus.position | メニューが受理したTab/Shift+Tabの開始断面 | Oを対応する可視起点、Pを展開中領域の実際に操作可能なDOM対象の順序列、Rを O に P を続けた列とする。観測.焦点位置は、現在の実焦点がOならP空のとき起点のみ・それ以外は起点、P内なら長さ1のとき単独・それ以外は先頭/中間/末尾、R外ならPの非空性に従う領域外対象あり/なし。これは開始時の実フォーカスと列から定まる観測であり、期待結果ではない。 | 同一操作の開始時DOMから独立に現在位置を取得し、列と分類を照合 |
| shell.focus.initial | 主または副メニューを開いた直後（切替を含む） | 実焦点は新たに開いた領域の先頭操作対象、当該対象が存在しなければその領域自身。以前の領域や背景へ残らない。 | DOMの操作対象列とactiveElementの同一性 |
| shell.focus.cycle | 展開中に共通メニューがTab/Shift+Tabを受理 | 開始時の実列Rに対し、Tabは次の対象、Shift+Tabは前の対象へ循環する。末尾→先頭・先頭→末尾を含む。開始焦点がR外の場合、TabはR先頭、Shift+TabはR末尾に移る。同じ領域内というだけでは合格にしない。実対象の同一性を保存する。 | 実DOMの全循環対象を取得し、両方向・1件・空のパネル・領域外焦点で開始/終了の対象を比較 |
| shell.focus.restore | メニューを利用者操作で閉鎖、またはページ遷移・狭幅条件解除 | 起点可視の利用者閉鎖（同じ起点の再操作を含む）では元の対応起点へ実焦点を戻す。ページ遷移による閉鎖では遷移先の本文へ移す。狭幅条件解除で消失した起点への強制復帰は要求しない。 | 同一DOM起点・遷移先本文のactiveElementと操作後の実背景遮断解除を照合 |
| shell.locale.preserved | メニュー展開中に言語選択UIを操作 | モバイルオーバーレイを閉じて背景遮断を解除し、既存の明示的な言語選択導線を阻害しない。言語選択の内部状態を本Processのフォーカス循環に混入しない。 | 言語切替UIと左右メニューの既存ブラウザ回帰 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
