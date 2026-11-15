---
cat_version: '0.3'
kind: domain-spec
id: eternalia.reader.public-tree-volume-privacy
status: draft
process: eternalia.reader
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/9d5fc1b91b15995dc440ca3e3340fb7733701a22/packages/contracts/src/novel.ts
refs: []
semantic_contract: markdown-v2
language: ja
---

# 多数ノードを持つ公開ツリーと新着の投影・非漏洩回帰（Draft）

## 根拠・範囲

現行要件PB-10は非公開祖先の配下を匿名の一覧・検索から遮断する。PB-06は公開新着表示を継承する。現行αの共有ドメイン`publicTree`/`publicRecent`/`toReader`は同じ公開祖先・公開版の判定を用いる。小規模フィクスチャでは試験済みだが、同一カテゴリ・言語下に多数の公開・未公開・予約公開項目が混在する件数増加時の**投影の欠落や非漏洩**は独立して検査できる。

本Workでは件数を固定した**決定的な中規模合成データ**で、系列間隔離と公開ツリー/新着の機能的な不変条件を試験する。目標レスポンス時間や性能SLAの数値は採用しない。実PostgreSQL/HTTP/ブラウザでの大規模運用の性能を立証するものではない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.reader.volume.complete | 表示条件を満たす公開版ノードは件数にかかわらず対象シリーズの投影に欠落なく存在する |
| eternalia.reader.volume.private | 未来予約・非公開祖先・未公開稿・作者下書きが投影に混入しない |
| eternalia.reader.volume.recent | 新着の既定件数/上限は安全に制限され、選択対象に未公開ノードを混入させない |
| eternalia.reader.volume.isolation | 別シリーズの公開項目は対象シリーズのツリーへ混ざらない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| READER-VOLUME-01 | 一つのシリーズに多数の公開設定・単語がある | 公開ツリーは公開中の各IDを欠落なく1回ずつ返し、別シリーズのIDは含めない | Node領域試験 |
| READER-VOLUME-02 | 非公開親・未来予約親・未公開の子が同じデータ集合にある | 非公開の親・子孫・未公開稿をツリーと新着の両方で遮断し、公開版の旧内容を維持する | Node領域試験 |
| READER-VOLUME-03 | 呼出者が過大な新着limitを指定する | 現行`publicRecent`の上限50を維持し、公開可能な最新項目だけを返す | Node領域試験 |
| READER-VOLUME-04 | データ増量回帰試験が成功する | サーバー/DB/ブラウザの実運用性能SLAや正式CAT Gate、人間受入を成功判定しない | 試験報告 |

## 決定境界

既存の`newLibrary`・`createNode`・`publishNode`・`editNode`・`setVisibility`で生成したドメインデータだけを使用する。過去ソース版の意味を規範仕様へ昇格しない。実ネットワーク遅延・PostgreSQL実データ量・CDNキャッシュなどは後続の別Workで検証する。
