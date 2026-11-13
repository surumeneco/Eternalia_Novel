---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.related-tip-http-privacy
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開設定から関連設定へのリンク投影のHTTP秘匿（Draft）

## 確定仕様と既存自動試験

ST-05により関連設定は同一シリーズ内の設定を参照し、公開稿へ明示反映する。PB-05/10〜12、AC-06/31/69/70により、匿名読者の関連リンクは参照元・参照先・各祖先が実効公開中の場合のみ提示する。下書き改名・予約日時前・親の非公開が、参照先のタイトル・ID・存在を関連リンク経由で漏洩させてはならない。

純粋なdomainテスト `related-tip-ancestor-privacy.test.mjs` は一部を検証しているが、実PostgreSQL→Nest公開API→Nuxt proxyを通じた変更後のリンク再投影は独立して未検証。今回のWorkは新たな公開契約を採用せず、採用済み規則の実HTTP経路を検査する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.publication.related.visible | 公開ソース設定から同じシリーズの公開ターゲット設定への関連リンクを返す |
| eternalia.publication.related.draft | 参照先の未公開改名は公開リンク表示を変えない |
| eternalia.publication.related.schedule | 参照先・参照先カテゴリの予約公開中は関連リンクと名称/IDを秘匿する |
| eternalia.publication.related.restore | 予約を解除すると元の公開稿がリンク先として復帰する |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| RELATED-HTTP-01 | 同一シリーズの公開中の設定が他の公開設定を参照 | Nuxt/Nest両APIで関連先の公開タイトルとIDを順序付き投影 | RELATED-HTTP-01 |
| RELATED-HTTP-02 | 関連先の作者下書きのタイトル/本文を未公開更新 | 匿名公開リンクは変更前の公開稿だけを返し、未公開値を返さない | RELATED-HTTP-02 |
| RELATED-HTTP-03 | 関連先自身または祖先カテゴリを未来日時へ予約 | 関連先リンクが消え、参照先の直接APIは404。参照元の公開稿は維持 | RELATED-HTTP-03 |
| RELATED-HTTP-04 | 予約解除の後、参照先の公開稿を明示更新 | 予約解除では旧公開稿が戻り、明示更新後にのみ新公開タイトルへ切替 | RELATED-HTTP-04 |

## CAT境界

現行採用仕様を引用した探索的HTTP検証Draftであり、Confirmed仕様・正規CAT Gateを自動成立させない。Synthetic作者セッション/使い捨てPGは実Discordアカウントや人間受入の証拠ではない。
