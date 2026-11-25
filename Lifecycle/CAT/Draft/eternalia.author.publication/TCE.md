---
cat_version: '0.3'
kind: tce
id: eternalia.author.publication.tce
status: draft
process: eternalia.author.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.author.publication.pi"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# TCE: eternalia.author.publication.tce

網羅要求: partial

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | --- | --- |
| publication.filter.selection | 公開絞込 | `観測.認証役割 == "作者"` | 1 | `状態.公開絞込 = 入力.公開絞込; 出力.公開絞込 = 入力.公開絞込` |

## 振る舞いの意味契約（形式化途上）

下表が今回の要求上の振る舞いであり、上表はそのうち現行記法で書ける局所状態・結果の断片である。未形式化のCondition・Effectも削除・合格扱いしない。重複IDは同一振る舞いの部分式と意味の対応であり、別の選択肢を意味しない。

| ID | 起点 | Condition（意味） | Effect（意味） | 要求 |
| --- | --- | --- | --- | --- |
| publication.select | 系列選択 | 認可済みかつ実在する系列 | 選択系列を確定し当該系列だけを管理する。 | AC-94 |
| publication.view | 公開管理閲覧 | 認可済み・正規系列 | 実際の資料IDごとに自身の設定と実効公開状態を区別して表示する。実効公開は保持公開版の有無、現在の自身の公開設定・時刻、公開版上の全祖先の現在の公開条件で決まる。下書き親へ移動しても明示公開前は公開版上の所属を参照する。 | PB-03、PB-13〜18、AC-94 |
| publication.filter | 公開絞込 | 作者が公開/非公開/未公開稿/すべてを選ぶ | 公開は実効公開中、非公開は実効公開でない対象、未公開稿は保持公開版のない対象、すべては当該系列の全対象を表示する。未公開稿・自身非公開・日時未設定・公開前・祖先非公開・公開中の状態表示と矛盾しない。 | AC-94 |
| publication.visibility | 公開設定変更 | 認可・所属・改訂が有効で対象を変更 | 対象自身の公開設定・公開日時を更新する。非公開祖先は子のフラグに勝り、他系列・他対象の個別設定は変更しない。失敗・競合を成功扱いしない。 | PB-01、AC-94 |
| publication.batch | 一括公開設定変更 | 認可済み作者が同一系列の複数資料の変更を確定 | 各対象の所属・改訂を検証し、対象ごとの成功・競合・失敗を区別して読戻す。失敗を成功扱いせず、非対象・他系列の設定を変えない。一括操作を無条件の全成功としない。 | AC-94 |
| publication.publish | 明示公開版更新 | 認可・所属・改訂が有効で対象を明示公開 | 対象の現在下書きを公開版に反映する。下書き保存だけでは公開版・公開祖先関係を変えない。競合・失敗では更新されない。 | PB-18、AC-69 |

## 残る形式化

実際の境界値、関係・効果の完全な式、操作別出力Presence、到達可能性を確定したうえでclosedを要求する。現行Compiler未対応の箇所は未証明として扱い、旧真偽判定に戻さない。
