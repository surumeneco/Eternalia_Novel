---
cat_version: '0.3'
kind: domain-spec
id: eternalia.reader.chapter-pages-nojs
status: draft
process: eternalia.reader
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 章本文の全ページをSSRで読めるプログレッシブ閲覧（Draft）

## 採用仕様・観測された残差

WR-02/PB-13では章本文を順序付きページ配列として保存し、ページごとの公開可否を設けず、章単位で公開制御する。現行`RichContent.vue`の`paged`表示はSSRで第1ページだけを描画し、続きのページは水和後の「次のページ」ボタンを押さないと表示できない。このボタンはSSRの時点で有効なため、JavaScript無効時・水和前には続きの本文が読めない。

本Workは新たな公開単位や自動公開を設けず、章が公開中なら全ページをSSRでも読むことができるようにする。JavaScriptが動作する時だけ従来のページ切替操作を有効化する。SSR/クライアントの初期状態を一致させ、Vueマウント後にのみ対話表示へ移行する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.reader.pages.ssr | JS無効・水和前の公開章は、順序付きページ配列の全本文をHTMLに投影し、ページ目印を表示する |
| eternalia.reader.pages.interactive | JS水和後のみページ切替ボタンを出し、従来の1ページ表示と移動を維持する |
| eternalia.reader.pages.privacy | 章が非公開なら元から公開APIで本文を返さず、公開章内のページだけを表示する |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| CHAPTER-NOJS-01 | 2ページ以上の公開章をJavaScript無効の匿名Chromiumで開く | SSR HTMLに全ページの本文が順序通り表示され、イベントハンドラのない「次のページ」ボタンが表示されない | CHAPTER-NOJS-01 |
| CHAPTER-NOJS-02 | 同じ章をJavaScript有効のChromiumで開く | Vue水和後は第1ページのみと操作可能なページャーを示し、次へ移動すると第2ページが表示される | CHAPTER-NOJS-02 |
| CHAPTER-NOJS-03 | 第2ページ閲覧後にja/enを切替える | 作品本文は翻訳されず、ページ状態・表示順・公開単位が維持される | CHAPTER-NOJS-03 |

## CAT境界

本Draftは採用済みの章単位公開とページ配列の読者表示を保護する実装上の改善で、別ページごとの公開判断を追加しない。テスト用匿名Chromiumでの探索的証拠を正式CATのConfirmed・Closure/Model/Implementation Gate・全実機受入と混同しない。
