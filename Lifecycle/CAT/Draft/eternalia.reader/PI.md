---
cat_version: '0.3'
kind: pi
id: eternalia.reader.pi
status: draft
process: eternalia.reader
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

# PI: eternalia.reader.pi

利用者が区別する値・操作・結果の意味上の境界。レコードは境界上の必要な射影であり、HTTP DTOやDOMタグの形を固定しない。値の有無は操作ごとに区別する。未形式化の結果PresenceはTCEの契約と合わせて確定する。

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.actor.reader | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.シリーズID | 受信 | string | 任意 |
| 入力.言語ID | 受信 | string | 任意 |
| 入力.カテゴリID | 受信 | string | 任意 |
| 入力.資料ID | 受信 | string | 任意 |
| 入力.検索語 | 受信 | string | 任意 |
| 入力.品詞ID | 受信 | nullable<string> | 任意 |
| 入力.タグID | 受信 | nullable<string> | 任意 |
| 入力.並び | 受信 | enum{名称順,既定順} | 任意 |
| 出力.単語列 | 送信 | sequence<record<id:string,spelling:string>> | 任意 |
| 出力.設定列 | 送信 | sequence<record<id:string,title:string>> | 任意 |
| 出力.意味品詞列 | 送信 | sequence<record<meaningId:string,classId:nullable<string>,label:nullable<string>>> | 任意 |
| 出力.本文列 | 送信 | sequence<record<id:string,body:string>> | 任意 |
| 出力.文法リンクID列 | 送信 | sequence<string> | 任意 |
| 出力.章一覧の部ID | 送信 | string | 任意 |
| 出力.表示対象ID | 送信 | string | 任意 |
| 出力.拒否 | 送信 | enum{対象なし} | 任意 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| open-language | 受付 | 言語閲覧 |
| open-settings | 受付 | カテゴリ閲覧 |
| search | 受付 | 検索条件変更 |
| filter-pos | 受付 | 品詞絞込 |
| filter-tag | 受付 | タグ絞込 |
| sort-settings | 受付 | 設定並び変更 |
| open-detail | 受付 | 詳細閲覧 |
| chapter-index | 受付 | 章一覧へ戻る |

## 操作別存在
| 操作 | 項目 | 存在 |
| --- | --- | --- |
| open-language | 入力.シリーズID | 必須 |
| open-language | 入力.言語ID | 必須 |
| open-settings | 入力.シリーズID | 必須 |
| open-settings | 入力.カテゴリID | 必須 |
| search | 入力.検索語 | 必須 |
| filter-pos | 入力.品詞ID | 必須 |
| filter-tag | 入力.タグID | 必須 |
| sort-settings | 入力.並び | 必須 |
| open-detail | 入力.資料ID | 必須 |

## 制約
| 式 |
| --- |

実IDの所属、対象の同一性、操作に固有の結果Presenceは未形式化のTCEおよび領域別関係を参照する。適合/不適合はPIの値でない。
