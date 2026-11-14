---
cat_version: '0.3'
kind: domain-spec
id: eternalia.studio.manuscript-writing-surface
status: draft
process: eternalia.studio
source_refs:
  - https://drive.google.com/file/d/1I7o6XHzRCqDZXxnL265oA1hZ8VifoNrA/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 作者用長文執筆面の可読性・レスポンシブ（Draft）

## 正本からの推定と設計判断

旧v0.3のブランド色（青・黒・緑）と石板風パネルを共通要素として維持しつつ、現行`220_ビジュアルデザイン・画面コンポーネント継承設計`に採用済みの「作者向け長文編集領域の明度・余白・横幅を執筆UXに合わせて調整してよい」に基づき、**本文エリアだけ**を可読性の高い横組み/行間・行長へ改善する。旧読者用画面の全面複製やベージュの独自配色化は行わない。実機確認で数値は是正可能な試行設計であり、正式CAT Confirmedではない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.studio.chapter.body-editor | 章本文のtextareaへの長文向け専用classと文字組み |
| eternalia.studio.chapter.mobile | 320/390pxの作者画面でのフォーム可視性・横方向オーバーフロー防止 |
| eternalia.studio.chapter.content | 下書き変更・ルビ・ページ切替・保存内容は見た目の変更で不変 |
| eternalia.studio.other-editors | 章以外の設定・辞書・年表textareaには章専用CSSを伝播させない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| MANUSCRIPT-UX-01 | デスクトップ幅1280pxで章本文を編集 | 編集欄の行長は無制限の全幅にならず、読みやすい上限を持つ。行間は既存一般textareaより広く、縦方向に十分な編集面がある | MANUSCRIPT-UX-01 |
| MANUSCRIPT-UX-02 | 320/390pxで章本文を編集 | viewport幅に追従し、本文欄・保存UIは表示され、意図しない文書全体の横スクロールがない | MANUSCRIPT-UX-02 |
| MANUSCRIPT-UX-03 | 章ではない設定/辞書/年表の本文を編集 | 章専用class/文字組みを付けず、既存のフォーム幅や入力挙動を維持する | MANUSCRIPT-UX-03 |
| MANUSCRIPT-UX-04 | 作者が長文日本語を編集・保存/再読込 | DOMの見た目だけを変更し、入力中文字・ルビ・ページ操作・下書き/公開稿分離の既存テストが引き続き成立する | MANUSCRIPT-UX-04 |

## 具体的な試行数値と未検証

章本文欄に専用クラスを割当て、行幅の上限は`72ch`、行間は`1.95`、最低編集高は`clamp(24rem,58vh,46rem)`、本文書体は明朝系を優先し、既存の`--color-background-input`/`--color-text-base`等を使う。これはCSS/Chromiumの試行値であり旧v0.3が正確に指定した値ではない。実機Windows/Android日本語IME、実機視覚比較、ルビの編集体験、アクセシビリティ、CAT規範Gateは別の検証として保持する。
