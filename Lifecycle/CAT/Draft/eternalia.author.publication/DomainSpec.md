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
| publication.snapshot.commit | 明示公開版更新の確定作用と結果観測 | 作用が確定した対象ID x の保持公開版は、改訂が一致した時点の保存済み下書きの内容全体（タイトル・本文・詳細・章ページ等の既存要素）、所属親、元改訂を保持する。他資料の公開内容は不変。Tipの明示的カテゴリ切替は採用順序へ反映する。非公開を選んだ単語の公開設定は保持し、他種別の既存公開操作、公開開始日時が未設定の場合の既存時刻設定規則を維持する。認可拒否・対象不正・改訂競合・確定失敗には確定作用がない。成功表示は応答と読戻しが確認できたときのみ。更新済みでも読戻し不能なら確認不能であり、通信断では未更新と断定しない。観測したID・系列・改訂と確定作用は同一資料・同一実行の実値に由来する。 | 実HTTP/DBで公開版全体・元改訂・公開親・日時・非対象を更新前後比較し、正規編集/公開管理の成功・競合・読戻し失敗時の実表示を照合。 |
| publication.visibility.relation | 実効公開状態と公開管理一覧の観測 | tを現在時刻、xを資料ID、P(x)を保持公開版上の親参照から最上位まで辿ったxを含む実祖先列とする。V(x,t)はP(x)の全資料yについて、保持公開版あり・自身公開設定が公開・公開開始日時が存在してt以下、かつ公開版祖先が正規系列へ到達する場合に限り真。下書き親をP(x)に使用しない。各管理行のeffectivelyPublic=V(x,t)。状態表示は自身の公開版不在→自身非公開→日時未設定→公開前→祖先非公開→公開中の区別を保持する。 | 保存済み公開版/下書きの親・自身設定・時刻から独立にVを計算し、公開管理の表示と匿名取得を同時刻・同一IDで比較 |
| publication.filter.relation | 選択系列と公開絞込の表示結果 | 選択系列の実下書き祖先系列・選択区分・現在の検索条件に合う資料を候補とする。公開ならV(x,t)、非公開なら否定V(x,t)、未公開稿なら保持公開版なし、すべてなら公開状態による除外なし。検索/区分/公開絞込は独立条件であり一方の変更で他方を解除しない。表示行のID・自身設定・実効状態・日時は同一資料に由来する。 | 同一系列の正負対象・別系列・複数区分/検索・未来時刻・公開版なし・下書き移動の実DOM/API照合 |
| publication.visibility.commit | 公開設定変更の確定作用と結果観測 | 有効な公開設定要求 (x, b, t) の対象ID x、実改訂、所属系列、認可と保持公開版の存在は同一対象・同一評価断面から得る。bが真かつ保持公開版がない場合は拒否する。確定作用がある場合、x自身のisPublic=b、publicSinceは bが真かつtがなしなら同一保存処理の評価時刻（観測.設定評価時刻）、それ以外はt。作用.保存公開日時はこの実保存値であり、要求の指定値tとは区別する。公開版内容・公開版親・下書き内容・他資料の個別公開設定は不変。改訂競合・確定失敗は作用なし。成功表示は応答と読戻しの成立時のみ、確認不能は確定作用の有無を断定しない。非公開祖先による実効非公開は常に維持する。JST入力の解釈・現行APIのUTC epochミリ秒整数と瞬間値との対応はPB-05に従い、不正書式は保存要求に変換しない。 | 実HTTP/DBの前後値と画面表示、公開版なし・公開/非公開・日時指定/解除・他系列・改訂競合・読戻し失敗を照合。 |
| publication.batch.relation | 同一系列の一括操作前後 | 選択ID列と現在の表示対象ID集合の共通部分を、表示順で重複なく処理する。各対象の保存済み改訂を使用し、公開版更新は明示公開の関係、公開化/非公開化は自身公開フラグと既存公開日時を使用する（日時の一括指定ではない）。公開版なしの公開化は確定作用なし。選択外・他系列・確定拒否対象は変更しない。途中失敗でそれ以前の適法な成功を取り消さず、通信断は確定の有無を推定しない。作用列は実際に確定したID・設定値と一致する。UIには応答成功件数（正常読戻しが成立した場合）、エラーとして得た対象の名称列、読戻し不能を区別して表示する。現行UIが公開していない個別の競合コード列を利用者PIとして要求しない。対象ごとの応答と確定効果は別途実HTTP/DBで観測する。 | 実選択ID/表示ID、各要求・応答、DB前後、部分失敗・他系列・表示条件変更・公開版なし・読戻し失敗を対照 |
| publication.visibility.frame | trigger-frame-footprint {"trigger":"公開設定変更","pi":"eternalia.author.publication.pi","accept":"update-visibility","peer":"eternalia.actor.author","cases":[{"when":"観測.認証役割 == \"作者\" かつ 観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID かつ 観測.公開対象改訂 == 入力.改訂 かつ (否定(入力.公開フラグ) または 観測.保持公開版あり) かつ 入力.公開フラグ かつ 否定(is_present(入力.公開日時))","provide":"update-visibility-view","required":["出力.更新結果"],"allowed":["出力.更新結果","作用.公開設定更新対象","作用.公開設定フラグ","作用.保存公開日時"]},{"when":"観測.認証役割 == \"作者\" かつ 観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID かつ 観測.公開対象改訂 == 入力.改訂 かつ (否定(入力.公開フラグ) または 観測.保持公開版あり) かつ is_present(入力.公開日時)","provide":"update-visibility-view","required":["出力.更新結果"],"allowed":["出力.更新結果","作用.公開設定更新対象","作用.公開設定フラグ","作用.保存公開日時"]},{"when":"観測.認証役割 == \"作者\" かつ 観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID かつ 観測.公開対象改訂 == 入力.改訂 かつ (否定(入力.公開フラグ) または 観測.保持公開版あり) かつ 否定(入力.公開フラグ) かつ 否定(is_present(入力.公開日時))","provide":"update-visibility-view","required":["出力.更新結果"],"allowed":["出力.更新結果","作用.公開設定更新対象","作用.公開設定フラグ","作用.保存公開日時"]},{"when":"否定(観測.認証役割 == \"作者\")","provide":"update-visibility-view","required":["出力.更新結果"],"allowed":["出力.更新結果"]},{"when":"観測.認証役割 == \"作者\" かつ 否定(観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID)","provide":"update-visibility-view","required":["出力.更新結果"],"allowed":["出力.更新結果"]},{"when":"観測.認証役割 == \"作者\" かつ 観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID かつ 否定(観測.公開対象改訂 == 入力.改訂)","provide":"update-visibility-view","required":["出力.更新結果"],"allowed":["出力.更新結果"]},{"when":"観測.認証役割 == \"作者\" かつ 観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID かつ 観測.公開対象改訂 == 入力.改訂 かつ 入力.公開フラグ かつ 否定(観測.保持公開版あり)","provide":"update-visibility-view","required":["出力.更新結果"],"allowed":["出力.更新結果"]}]} | @cat:trigger-frame-footprint/v1 | cat:intrinsic-model/v1 |
| publication.publish.frame | trigger-frame-footprint {"trigger":"明示公開版更新","pi":"eternalia.author.publication.pi","accept":"publish","peer":"eternalia.actor.author","cases":[{"when":"観測.認証役割 == \"作者\" かつ 観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID かつ 観測.公開対象改訂 == 入力.改訂","provide":"publish-view","required":["出力.更新結果"],"allowed":["出力.更新結果","作用.公開版更新"]},{"when":"否定(観測.認証役割 == \"作者\")","provide":"publish-view","required":["出力.更新結果"],"allowed":["出力.更新結果"]},{"when":"観測.認証役割 == \"作者\" かつ 否定(観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID)","provide":"publish-view","required":["出力.更新結果"],"allowed":["出力.更新結果"]},{"when":"観測.認証役割 == \"作者\" かつ 観測.公開対象ID == 入力.対象ID かつ 観測.公開対象系列ID == 入力.シリーズID かつ 否定(観測.公開対象改訂 == 入力.改訂)","provide":"publish-view","required":["出力.更新結果"],"allowed":["出力.更新結果"]}]} | @cat:trigger-frame-footprint/v1 | cat:intrinsic-model/v1 |

publication.visibility.frame は管理文脈を保持する確定更新断面と出力・作用の許容範囲のみを扱う。作用の値、確定保存・応答・読戻し・公開親鎖の関係は既存の publication.snapshot.commit / publication.visibility.commit を維持する。
publication.publish.frame は管理文脈を保持する確定更新断面と出力・作用の許容範囲のみを扱う。作用の値、確定保存・応答・読戻し・公開親鎖の関係は既存の publication.snapshot.commit / publication.visibility.commit を維持する。

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
