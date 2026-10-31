# α版 AC-01〜AC-78 受入証拠トレーサビリティ（初期台帳）

- 正本: `forGPT/Eternalia_Novel/40_開発・検証/400_受入検証計画.md`（78件のACを欠落なく抽出）。この表は正本を置き換えない。
- 対象: `surumeneco/Eternalia_Novel` / `feature/alpha-reimplementation-20261029`。作成時HEAD `a9fe1fd9597689447ee3c0806487c0e084799563`。
- 環境: GitHub Actions の Node 22 / PostgreSQL 17 / Nuxt+Nest / Chromium (ubuntu-24.04)。本番・実Discord OAuth・実端末の成功を含まない。
- 検証済み基準: `e6299061f3445207a599d9d1fbde7e1b397f5829` の [CI #41213396614](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41213396614) は4ジョブsuccess、Chromiumブラウザ15件・HTTP/SSR6件が全件成功。後続のスクリーンショット収集/実機確認/CAT Gateは別証拠。
- 判定: `not-run` は**AC全体を受け入れるだけの網羅的証拠がまだない**ことを示す。右欄のB/H/DB/CIは探索的な**部分証拠候補**であり、該当ACのpassを意味しない。`pending-decision` は設計決定が必要。`scope-excluded` は明示除外。失敗は実測した場合のみ `fail` にする。
- 各ACのpassへ更新する前に `テストID / コード箇所 / 環境 / 同一HEAD / CI run / 手動証拠 / 判定` を照合する。現在の本表はACを欠落させないための基線であり、CAT正式Gateやユーザー受入ではない。

| AC | 受入シナリオ | コード/テスト箇所（部分証拠のみ） | 現在の部分証拠・未検証境界 | AC全体の判定 |
| --- | --- | --- | --- | --- |
| AC-01 | シリーズ内で編・部・章を作成し本文を書いて保存・再読込 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 章の下書き保存・再読込（階層全体のUI操作は未検証） | not-run |
| AC-02 | シリーズ内の編・部・章の名称・表示順を変更 | 未特定 | — | not-run |
| AC-03 | 本文にルビ等の書式を付して保存 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: semantic ruby/page boundary; IME実機未検証 | not-run |
| AC-04 | 本文編集中に設定・辞書を検索・参照 | 未特定 | — | not-run |
| AC-05 | カテゴリ・設定・項目・プリセット・タグを作成・編集 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: category preset editor; タグ・所属変更の全件未検証 | not-run |
| AC-06 | 設定を相互参照し、改名・削除する | 未特定 | — | not-run |
| AC-07 | 同じスペルを異なる言語に登録 | 未特定 | — | not-run |
| AC-08 | 複数の意味・品詞・語源を登録・辿る | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: word meaning/etymology published snapshot | not-run |
| AC-09 | 音韻規則・重複規則に違反する単語を入力 | 未特定 | — | not-run |
| AC-10 | 異なる年代区分で同じ出来事を表示 | 未特定 | — | pending-decision |
| AC-11 | 編集失敗・通信切断・再接続を発生させる | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: メモ読戻し失敗・未保存遷移（通信断の全条件未検証） | not-run |
| AC-12 | 同一レコードを複数編集元から更新 | apps/web/browser-acceptance/browser-acceptance.test.mjs、apps/api/tests/postgres-alpha.test.mjs | B/DB: 2タブ競合、保存済み本文維持、未保存入力保持（実端末は未検証） | not-run |
| AC-13 | 保留：ゴミ箱・ゴミ箱からの復元（当面実装・受入試験の対象外） | 未特定 | — | scope-excluded |
| AC-14 | 検証エラー・API失敗・権限不足を発生させる | 未特定 | — | not-run |
| AC-15 | 非ASCII文字、長文、特殊文字、改行、多言語テキストを編集 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 長文・日本語・アクセント・異体字・絵文字・改行を保存/再読込/公開（正規化全件未検証） | not-run |
| AC-16 | 作者が本文・設定・辞書・年表の公開対象を指定して公開する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 5種の明示公開（最新CI待ち、全画面表示未検証） | not-run |
| AC-17 | 各領域の公開対象を非公開へ戻し、匿名読者が再取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 章/TipSection/単語/文法/出来事の非公開→再公開を検証（検索/直URL全経路は未網羅） | not-run |
| AC-18 | Discord連携でログイン・ログアウトを行う | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 合成作者セッションのログアウトと独立セッション維持（実Discord OAuthは未検証） | not-run |
| AC-19 | Discord認証済みだが権限のない利用者が編集・公開操作を行う | 未特定 | — | not-run |
| AC-20 | 未ログイン読者が本文・設定集・辞書・年表の公開・未公開データを取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 匿名公開API・非公開拒否（全経路未網羅） | not-run |
| AC-21 | Discordログインしていない状態で公開データを閲覧する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: anonymous mobile reading | not-run |
| AC-22 | 読者がDiscordログイン後に編集・公開APIを呼び出す | 未特定 | — | not-run |
| AC-23 | 未ログイン状態で編集・公開APIを呼び出す | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: anonymous author workspace protection | not-run |
| AC-24 | 異なるシリーズA・Bを作成して編・部・章・本文をそれぞれ登録 | 未特定 | — | not-run |
| AC-25 | 両シリーズに設定・言語・出来事を登録し切り替える | 未特定 | — | not-run |
| AC-26 | 異なるシリーズで同名設定・単語・年代を使う | 未特定 | — | not-run |
| AC-27 | 公開／非公開を混在させたシリーズA・Bを匿名閲覧する | 未特定 | — | not-run |
| AC-28 | 公開済みの編・部・章・本文がある状態で上位の編またはシリーズを非公開にする | apps/api/tests/postgres-alpha.test.mjs | H/DB: ancestor publication guard（子孫経路の網羅未検証） | not-run |
| AC-29 | 設定カテゴリ・言語・年表の上位要素を非公開にする | apps/api/tests/postgres-alpha.test.mjs | H/DB: ancestor publication guard（検索等の網羅未検証） | not-run |
| AC-30 | 親が公開、子が非公開の状態と、親が非公開、子が公開の状態を比較する | 未特定 | — | not-run |
| AC-31 | 公開済み親を非公開へ変更し、一覧・検索・直接URL・関連リンク・キャッシュを再取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: related setting links exclude hidden targets | not-run |
| AC-32 | 非公開化した親を再公開する | 未特定 | — | not-run |
| AC-33 | 章の本文を任意位置で複数ページに分割し、章を公開する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: semantic page boundaries（保存・公開全件未検証） | not-run |
| AC-34 | 公開済み章を非公開にする | 未特定 | — | not-run |
| AC-35 | 公開カテゴリ・公開設定の一部項目のみ非公開にする | 未特定 | — | not-run |
| AC-36 | 設定またはカテゴリを非公開にし、配下の設定項目を公開指定のままにする | 未特定 | — | not-run |
| AC-37 | 新規単語を通常登録する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 新規単語のisPublic=trueを検証（実作者UIの初期表示は未検証） | not-run |
| AC-38 | 新規単語を非公開指定で登録し編集する | 未特定 | — | not-run |
| AC-39 | 公開言語で単語のみ非公開にする | 未特定 | — | not-run |
| AC-40 | 非公開言語・シリーズに公開設定の単語を登録する | 未特定 | — | not-run |
| AC-41 | 公開単語の意味・語源を編集する | 未特定 | — | not-run |
| AC-42 | 同じシリーズに複数年代区分と出来事を登録し、区分ごと／統合表示を切り替える | 未特定 | — | pending-decision |
| AC-43 | 年代区分を非公開にし、所属出来事が公開のまま読者アクセスする | 未特定 | — | not-run |
| AC-44 | 公開年代区分で一部出来事のみ非公開にする | 未特定 | — | not-run |
| AC-45 | 年代区分・出来事の公開日時を設定し、時刻境界の前後で取得する | 未特定 | — | pending-decision |
| AC-46 | 一つのカテゴリに複数の設定を登録し、ある設定の所属先を変更する | 未特定 | — | not-run |
| AC-47 | カテゴリを作成・編集し、カテゴリの中へさらにカテゴリを追加しようとする | 未特定 | — | not-run |
| AC-48 | 異なるカテゴリの設定に同一のタグを付け、タグに基づいて横断的に分類する | 未特定 | — | not-run |
| AC-49 | カテゴリに項目プリセットの見出し・表示順・テンプレートテキストを登録・変更し設定作成に利用する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: category preset editor（全変更系列未検証） | not-run |
| AC-50 | 既存設定AをプリセットP1で作成・編集した後、カテゴリ側プリセットをP2へ変更し新規設定Bを作成する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: category preset editor（P1→P2の全条件未検証） | not-run |
| AC-51 | 公開中の設定で一部TipSectionだけを非公開にする | 未特定 | — | not-run |
| AC-52 | 公開言語の文法項目Aだけ公開・文法項目Bを非公開にし、その後に親の言語を非公開にする | 未特定 | — | not-run |
| AC-53 | 同一単語に同じ品詞の異なる複数意味を登録し、意味ごとに語源を関連付ける | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: meaning-scoped etymology（複数同品詞は未検証） | not-run |
| AC-54 | 各領域で未来公開日時を指定し、指定時刻の前後に匿名閲覧する | 未特定 | — | pending-decision |
| AC-55 | 新着投稿表示・ジャンプ・公開管理の一覧を匿名読者で使う | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: anonymous search excludes unpublished text（新着全件未検証） | not-run |
| AC-56 | 作者がホーム・一覧・詳細・管理トップから作成・編集画面へ移動する | 未特定 | — | not-run |
| AC-57 | 章本文・TipSection・単語意味と語源を編集し保存して再取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 意味別語源と長文の下書き保存/再読込（他領域の全フィールド未検証） | not-run |
| AC-58 | 公開情報一覧・新着表示・タグ・区分マスタ・作者用メモを確認する | 未特定 | — | not-run |
| AC-59 | 画面の読込中とローカライズ対象の固定文言を確認する | 未特定 | — | pending-decision |
| AC-60 | DS-01、v0.3 VisualDesignConcept、200/220 | 未特定 | — | not-run |
| AC-61 | DS-02、旧FE `_pallet/_color.scss` | 未特定 | — | not-run |
| AC-62 | DS-02、旧FE `_font-size/_margin/_radius.scss` | 未特定 | — | not-run |
| AC-63 | DS-03、旧FE `layouts/default.vue` と `components/app/common` | 未特定 | — | not-run |
| AC-64 | DS-04、CM-01/05/08 | 未特定 | — | not-run |
| AC-65 | DS-05、WR-02/05 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 読者390/768/1280px・作者320/390px・ルビ選択範囲（実IME未検証） | not-run |
| AC-66 | v0.3共通、PB-06、CM-09 | 未特定 | — | not-run |
| AC-67 | v0.3設定・辞書、ST-03/05/06/09、LG-05〜08 | 未特定 | — | not-run |
| AC-68 | v0.3 Timeline、TL-01〜06 | 未特定 | — | not-run |
| AC-69 | PB-18、215承認済み公開更新方式 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 章/TipSection/単語/文法/出来事の下書き・再読込・明示公開・非公開/復帰（実UI全経路未網羅） | not-run |
| AC-70 | PB-10〜17、PB-18 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: unpublished search/hidden link（全経路未網羅） | not-run |
| AC-71 | 旧Backend develop/920 | 未特定 | — | not-run |
| AC-72 | 215・210 | .github/workflows/alpha-checks.yml | CI: Node22/Nuxt/Nest/PG17/Chromium 4ジョブ成功、実Discord OAuth未検証 | not-run |
| AC-73 | 010 UI構造試験導入 | 未特定 | — | not-run |
| AC-74 | 910/920継承監査 | 未特定 | — | not-run |
| AC-75 | CM-02/03/08/09 | 未特定 | — | pending-decision |
| AC-76 | CM-10、v0.3全体共通「非公開済データの削除」 | 未特定 | — | pending-decision |
| AC-77 | CM-11、v0.3全体共通「無効化フラグ」 | 未特定 | — | pending-decision |
| AC-78 | DS-01、200/220、旧UI・v0.3デザイン | 未特定 | — | pending-decision |

## 次の検証単位

1. 最新HEADの4 CIジョブを照合し、Bの対象テスト名と結果を記録する。失敗時は実際のログから修正。
2. AC-69/17/16の4領域＋Grammarのブラウザー保存・公開・非公開・再公開証拠を部分合格からAC全体の境界へ精査する。
3. AC-18/19/22/72の実Discord本人・非本人認可、AC-65のIME/端末、AC-60〜64の旧UI画像比較は別証拠を要求する。
