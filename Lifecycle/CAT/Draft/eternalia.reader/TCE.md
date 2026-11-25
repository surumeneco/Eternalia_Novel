---
cat_version: '0.3'
kind: tce
id: eternalia.reader.tce
status: draft
process: eternalia.reader
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.reader.pi"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# TCE: eternalia.reader.tce

網羅要求: partial

## 振る舞い

ここでは完全な意味上のCondition・Effectを一つの表に保持する。現段階の自由記述は機械式への変換が未完であり、正規Compilerによる規範モデル生成対象として承認されていない。未記述Effectを「不変」や「出力なし」として合格扱いする部分Outcomeを置かない。

| ID | 起点 | 条件 | 結果 | 効果 | 要求 |
| --- | --- | --- | --- | --- | --- |
| reader.language | 言語閲覧 | 実効公開の言語と正規系列が整合する | 1 | その言語の公開単語列を表示する。スペル昇順を保ち、品詞マスタの順や作者手動順を並べ替えキーにしない。異系列・非公開祖先・公開版不在は資料を返さない。 | LG-07、PB-03、AC-80 |
| reader.search | 検索条件変更 | 辞書または設定一覧を閲覧中 | 1 | 辞書では公開単語のスペル・意味、設定では名称・公開設定項目に対して検索条件を適用し、該当する実資料ID列を表示する。検索の細かな一致方式は既存未決範囲を維持。 | LG-07、ST-09 |
| reader.pos | 品詞絞込 | 辞書一覧で品詞IDを選択または解除 | 1 | 該当品詞を参照する公開単語だけを表示し、スペル昇順は維持する。 | LG-07 |
| reader.settings | カテゴリ閲覧 | 正規公開カテゴリを閲覧する | 1 | 実効公開Tipだけを一覧化し、その配下の公開設定項目に検索が適用できる。 | ST-09、PB-03、AC-80 |
| reader.tag | タグ絞込 | 設定一覧でタグを選択または解除 | 1 | 実際のタグ参照に合う公開Tipだけを表示する。 | ST-09 |
| reader.order | 設定並び変更 | 設定一覧で名称順を選択 | 1 | 表示対象の順序を名称順にする。他領域の並べ替えを変更しない。 | ST-09、200 §6.1 |
| reader.detail | 詳細閲覧 | 実効公開対象の正規階層に入る | 1 | 設定詳細には実効公開項目の本文、言語詳細には公開文法の実対象IDへの導線、単語詳細には各意味IDごとに公開マスタの同一安定IDの名称を表示する。公開マスタにないIDや下書き名称は表示しない。章では所属部IDを保持し、その目次への導線を表示する。 | LG-05、PB-03、PB-15、AC-80/95 |
| reader.chapter.index | 章一覧へ戻る | 正規公開章に入場し、章一覧導線を操作 | 1 | 出力.章一覧の部ID = 状態.所属部、出力.表示対象ID = 状態.所属部（所属部は非null）。当該部の実効公開章の列を表示し、状態.閲覧種別を章一覧へ遷移する。他系列・非公開親へ誘導しない。 | 200 §6.3、AC-95 |
| reader.language.unavailable | 言語閲覧 | 指定言語が存在しない、所属系列の不一致または実効非公開 | 1 | 対象の存在・下書き内容・非公開項目やリンクを開示しない。 | PB-03、AC-70/95 |
| reader.settings.unavailable | カテゴリ閲覧 | 指定カテゴリが存在しない、所属系列の不一致または実効非公開 | 1 | 対象の存在・下書き内容・非公開項目やリンクを開示しない。 | PB-03、AC-70/95 |
| reader.detail.unavailable | 詳細閲覧 | 対象不在、指定された種別・系列・祖先列の不一致または実効非公開 | 1 | 対象の存在・下書き内容・非公開項目やリンクを開示しない。 | PB-03、AC-70/95 |

## 残る形式化

自由記述のCondition・Effectを元の意味を保持して機械式へ変換し、操作別出力Presence、起点、到達可能性、例外・不変条件を確定する。未対応は未証明のまま扱い、旧真偽判定や一部EffectのみのOutcomeに戻さない。網羅要求をclosedにする前に残る条件を解消する。
