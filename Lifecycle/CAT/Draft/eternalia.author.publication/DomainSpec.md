---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.publication.relations
status: draft
process: eternalia.author.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.author.publication.pi", "eternalia.author.publication.tce"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Domain Specification: eternalia.author.publication.relations

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author.publication | 複数実行間の関係・実DOM構造・状態不変性（適用する規則に限定） |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| publication.move.trace | Tipが公開親Aに属し下書きのみ親Bへ移動する実行列 | 公開前はAの公開条件、明示公開後はBの公開条件が実効公開可否を決める。作者画面の実効状態と匿名読者の実際の可視性を同じ時刻・同じ公開版で照合する。 | A/Bの可視条件を逆転させたChromium・匿名HTTP・DBの公開版前後観測 |
| publication.snapshot.frame | 下書き保存と公開版更新の区別 | 下書きだけを保存した前後では匿名の公開内容・所属・公開判定は不変。明示公開後のみ許可された公開版差が生じる。 | 公開スナップショット前後と一覧・詳細・検索の比較 |
| publication.visibility.relation | 実効公開状態と公開管理一覧の観測 | tを現在時刻、xを資料ID、P(x)を保持公開版上の親参照から最上位まで辿ったxを含む実祖先列とする。V(x,t)はP(x)の全資料yについて、保持公開版あり・自身公開設定が公開・公開開始日時が存在してt以下、かつ公開版祖先が正規系列へ到達する場合に限り真。下書き親をP(x)に使用しない。各管理行のeffectivelyPublic=V(x,t)。状態表示は自身の公開版不在→自身非公開→日時未設定→公開前→祖先非公開→公開中の区別を保持する。 | 保存済み公開版/下書きの親・自身設定・時刻から独立にVを計算し、公開管理の表示と匿名取得を同時刻・同一IDで比較 |
| publication.filter.relation | 選択系列と公開絞込の表示結果 | 表示候補は選択系列の管理対象に限り、公開ならV(x,t)、非公開なら否定V(x,t)、未公開稿なら保持公開版なし、すべてなら状態による除外なし。領域・既存検索条件などの独立条件は保持する。表示行のIDとその自身設定・実効状態が別資料と混在しない。 | 同一系列内の正負対象と別系列、未来時刻・公開版なし・下書き移動の実DOM/API照合 |
| publication.batch.relation | 同一系列の一括公開設定更新の前後 | 入力対象列の各IDと改訂を保持し、対象ごとの適法な成功だけがその自身公開設定・日時に反映される。他ID・他系列の設定と保持公開版本文は不変。競合・失敗と読戻し不能は成功と区別し、全成功と推定しない。 | 実DB前後と各対象の応答・読戻し、部分失敗・他系列混入対照 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
