---
cat_version: '0.3'
kind: process
id: eternalia.reader
status: draft
process: eternalia.reader
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.reader.pi", "eternalia.reader.tce", "eternalia.reader.relations"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Process: eternalia.reader

匿名読者を含む利用者がシリーズのストーリー・設定集・辞書を正規階層で閲覧する境界。実際の資料ID、表示列、本文、リンクを観測する。年表その他の既存要件は削除しないが、今回のW07再配置対象は従来Confirmedの読者関連差分。

本DraftはW07の採用済み差分を再配置する。全機能をこの部分仕様だけで閉包したとは扱わない。相手は実際の利用者という外部Processであり、検証用の論理サービスを捏造しない。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.reader.pi |

## 仕様状態
| ID | Domain |
| --- | --- |
| 状態.閲覧種別 | enum{辞書一覧,設定一覧,章詳細,章一覧,その他} |
| 状態.選択シリーズ | nullable<string> |
| 状態.選択言語 | nullable<string> |
| 状態.選択カテゴリ | nullable<string> |
| 状態.表示章 | nullable<string> |
| 状態.所属部 | nullable<string> |
| 状態.検索語 | string |
| 状態.選択品詞名 | nullable<string> |
| 状態.選択タグ名 | nullable<string> |
| 状態.設定並び | enum{名称順,既定順,公開更新順} |

## 観測能力
| ID | 情報源 | Domain |
| --- | --- | --- |
| 観測.現在時刻 | 匿名APIで公開判定する時刻（読者端末の時計を信頼する要求ではない） | instant |
| 観測.公開階層 | 匿名APIで取得した公開版上の資料・祖先関係（系列IDは取得元の系列から解決） | sequence<record<id:string,parentId:nullable<string>,seriesId:string,kind:string,title:string,order:integer,publishedAt:instant,body:string>> |
| 観測.公開単語 | 公開言語の語と意味 | sequence<record<id:string,languageId:string,spelling:string,body:string,meanings:sequence<record<id:string,classId:nullable<string>,publicClassName:nullable<string>,definition:string,etymologies:sequence<record<id:string,languageId:nullable<string>,wordId:nullable<string>,note:string>>>>>> |
| 観測.公開品詞 | 言語ごとの公開マスタ | sequence<record<languageId:string,id:string,name:string>> |
| 観測.公開設定 | 公開Tipと公開項目・タグ | sequence<record<id:string,categoryId:string,title:string,tagNames:sequence<string>,sectionIds:sequence<string>,body:string,order:integer,publishedAt:instant>> |
| 観測.公開本文 | 公開章・設定項目の内容 | sequence<record<id:string,body:string>> |

## 作用能力
| ID | 対象 | Domain |
| --- | --- | --- |

## 起点
| ID | 由来 |
| --- | --- |
| 言語閲覧 | eternalia.reader.pi/open-language |
| カテゴリ閲覧 | eternalia.reader.pi/open-settings |
| 検索条件変更 | eternalia.reader.pi/search |
| 品詞絞込 | eternalia.reader.pi/filter-pos |
| タグ絞込 | eternalia.reader.pi/filter-tag |
| 設定並び変更 | eternalia.reader.pi/sort-settings |
| 詳細閲覧 | eternalia.reader.pi/open-detail |
| 章一覧へ戻る | eternalia.reader.pi/chapter-index |
| 章一覧閲覧 | eternalia.reader.pi/open-chapter-index |

## 適用範囲
品詞絞込とタグ絞込の受付値は読者が選ぶ公開名称である。単語の保存参照・公開名の解決は安定IDを用いるが、公開名による選択操作をID入力に読み替えない。公開名の重複がある場合は同名の公開品詞を持つ語が絞込対象となる。公開ツリーと詳細応答は実際の匿名APIの取得値を用い、その取得が公開条件を満たすことは別途同じ保存状態・時刻で照合する。未公開データを読者側の観測能力として要求しない。
比較済みの左前/右前、検索適合、文法導線適合等を入力・出力にしない。章一覧への復帰は部IDと系列IDの同一性として観測する。章詳細のリンク操作による遷移要求と、遷移先（直接URLアクセスも含む）の公開資料読込み・表示を別の起点とする。前者は公開章の既知の所属に基づくリンク先を定め、後者で公開状態を再評価する。公開条件が変化した場合に旧章の状態から表示成功を推測しない。

未形式化のEffect・Condition・外部観測関係をTCE・領域別仕様に保持する。Compilerの対応範囲に合わせて要求を削らず、正式Gateは未完了。
