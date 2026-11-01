# α版 AC-01〜AC-78 受入証拠トレーサビリティ（初期台帳）

- 正本: `forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md`（78件のACを欠落なく抽出）。この表は正本を置き換えない。
- 対象: `surumeneco/Eternalia_Novel` / `feature/alpha-reimplementation-20261029`。作成時HEAD `a9fe1fd9597689447ee3c0806487c0e084799563`。
- 環境: GitHub Actions の Node 22 / PostgreSQL 17 / Nuxt+Nest / Chromium (ubuntu-24.04)。本番・実Discord OAuth・実端末の成功を含まない。
- 検証済み基準: `e6299061f3445207a599d9d1fbde7e1b397f5829` の [CI #41213396614](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41213396614) は4ジョブsuccess、Chromiumブラウザ15件・HTTP/SSR6件が全件成功。後続のスクリーンショット収集/実機確認/CAT Gateは別証拠。
- 追加の実測証拠: `e49e7ab` の [CI #41275393712](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41275393712) は4ジョブsuccess、Chromium 17/17・HTTP 6/6・PostgreSQL統合10/10。後続HEADの新規試験は別途CI照合が必要。
- 追加の実測証拠: `f44425d3` の [CI #41275713765](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41275713765) は4ジョブsuccess、Chromium 20/20・HTTP 7/7。後続HEADのタグ横断試験は別途CI照合が必要。
- 2026-11-01追加の探索的受入証拠: `7039a5aaf` の [CI #41293650480](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41293650480)、`eaea98d1c` の [CI #41293701037](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41293701037)、`048698945` の [CI #41293843303](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41293843303)、`3e3d6e589` の [CI #41293919427](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41293919427) はそれぞれ4ジョブ成功。個別ACの全体passや正式CAT Gateを意味しない。
- 追加の実測証拠: `77a6b99e` の [CI #41276226834](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41276226834) は4ジョブsuccess、Chromium 21/21・HTTP 7/7・PostgreSQL統合10/10。これはCAT正式Gateや人間の受入を代替しない。
- 追加の実測証拠: `93ddf22d3ccd9549f47d583040da2c1b3d72363c` の [CI #41296684451](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41296684451) は4ジョブsuccess、Chromium 35/35・HTTP 14/14・探索的Domain 72/72。AC-02の部順序/部章改名、AC-06の関連Tip祖先秘匿・順序/削除・別シリーズ拒否の部分証拠。正式CAT Gate、実Discord OAuth、人間受入は含まない。
- 判定: `not-run` は**AC全体を受け入れるだけの網羅的証拠がまだない**ことを示す。右欄のB/H/DB/CIは探索的な**部分証拠候補**であり、該当ACのpassを意味しない。`pending-decision` は設計決定が必要。`scope-excluded` は明示除外。失敗は実測した場合のみ `fail` にする。
- 各ACのpassへ更新する前に `テストID / コード箇所 / 環境 / 同一HEAD / CI run / 手動証拠 / 判定` を照合する。現在の本表はACを欠落させないための基線であり、CAT正式Gateやユーザー受入ではない。

| AC | 受入シナリオ | コード/テスト箇所（部分証拠のみ） | 現在の部分証拠・未検証境界 | AC全体の判定 |
| --- | --- | --- | --- | --- |
| AC-01 | シリーズ内で編・部・章を作成し本文を書いて保存・再読込 | apps/web/browser-acceptance/browser-acceptance.test.mjs; docs/cat/ac01-author-hierarchy-draft.md | B: 作者UIでシリーズ→編→部→章を作成し日本語本文の下書き保存・再読込を検証（CI #41286577405 success、正式CAT Gate/人間受入は未実施） | not-run |
| AC-02 | シリーズ内の編・部・章の名称・表示順を変更 | apps/web/browser-acceptance/browser-acceptance.test.mjs; docs/cat/ac02-volume-order-and-rename-draft.md; docs/cat/ac02-part-chapter-order-rename-draft.md | B: 編の順序・改名・再読込はCI #41286577405成功。部の順序・改名、章の改名・親ID保持をChromiumで検証（CI #41296684451 success）。章の兄弟順序変更は既存ブラウザー試験で検証。正式CAT Gate・全公開稿境界は未検証 | not-run |
| AC-03 | 本文にルビ等の書式を付して保存 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: semantic ruby/page boundary; IME実機未検証 | not-run |
| AC-04 | 本文編集中に設定・辞書を検索・参照 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 同一シリーズの未公開設定・単語を参照中も未保存原稿を保持（CI #41275713765 success） | not-run |
| AC-05 | カテゴリ・設定・項目・プリセット・タグを作成・編集 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: category preset editor; タグ・所属変更の全件未検証 | not-run |
| AC-06 | 設定を相互参照し、改名・削除する | packages/contracts/exploratory/related-tip-ancestor-privacy.test.mjs; apps/web/browser-acceptance/browser-acceptance.test.mjs; apps/api/http-acceptance/http-acceptance.test.mjs; docs/cat/ac06-related-ancestor-privacy-draft.md | Domain/B/H: 同一シリーズ・異カテゴリの関連Tip、祖先非公開時の参照秘匿、別シリーズ参照拒否、未公開改名の秘匿、関連順序/除去後の明示公開を検証（CI #41296684451 success）。設定そのものの削除操作・正式CAT Gate・人間受入は未検証 | not-run |
| AC-07 | 同じスペルを異なる言語に登録 | apps/web/browser-acceptance/browser-acceptance.test.mjs、apps/api/tests/postgres-alpha.test.mjs | B/DB: 同綴語の言語別選択・固有ID/本文分離（CI #41275393712 success） | not-run |
| AC-08 | 複数の意味・品詞・語源を登録・辿る | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 同品詞2意味・意味別語源の独立保存と明示公開（CI #41275713765 success） | not-run |
| AC-09 | 音韻規則・重複規則に違反する単語を入力 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 同言語重複綴り警告の表示/消去/再表示（CI #41275713765 success） | not-run |
| AC-10 | 異なる年代区分で同じ出来事を表示 | 未特定 | — | pending-decision |
| AC-11 | 編集失敗・通信切断・再接続を発生させる | apps/web/browser-acceptance/browser-acceptance.test.mjs; docs/cat/ac11-save-network-retry-draft.md | B: 作者下書きPATCHの合成通信断→入力保持・DB未変更→再送・再読込成功（CI #41286691284 success、実回線・全条件は未検証） | not-run |
| AC-12 | 同一レコードを複数編集元から更新 | apps/web/browser-acceptance/browser-acceptance.test.mjs、apps/api/tests/postgres-alpha.test.mjs | B/DB: 2タブ競合、保存済み本文維持、未保存入力保持（実端末は未検証） | not-run |
| AC-13 | 保留：ゴミ箱・ゴミ箱からの復元（当面実装・受入試験の対象外） | 未特定 | — | scope-excluded |
| AC-14 | 検証エラー・API失敗・権限不足を発生させる | apps/api/http-acceptance/http-acceptance.test.mjs | H: 不正意味JSONの400拒否・下書き/公開稿非破壊（CI #41275713765 success） | not-run |
| AC-15 | 非ASCII文字、長文、特殊文字、改行、多言語テキストを編集 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 長文・日本語・アクセント・異体字・絵文字・改行を保存/再読込/公開（正規化全件未検証） | not-run |
| AC-16 | 作者が本文・設定・辞書・年表の公開対象を指定して公開する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 5種の明示公開（最新CI待ち、全画面表示未検証） | not-run |
| AC-17 | 各領域の公開対象を非公開へ戻し、匿名読者が再取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 章/TipSection/単語/文法/出来事の非公開→再公開を検証（検索/直URL全経路は未網羅） | not-run |
| AC-18 | Discord連携でログイン・ログアウトを行う | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 合成作者セッションのログアウトと独立セッション維持（実Discord OAuthは未検証） | not-run |
| AC-19 | Discord認証済みだが権限のない利用者が編集・公開操作を行う | apps/api/http-acceptance/http-acceptance.test.mjs; apps/web/browser-acceptance/browser-acceptance.test.mjs; docs/cat/ac19-22-non-author-guard-draft.md | B+H: 別Discord主体の有効な合成セッションで作者画面を開いても編集UIは表示されず公開閲覧は可能（CI #41294000373 success）。管理GET/POST/PATCH・公開・可視性・並べ替えはNuxt/Nest両経路から401拒否し、DB/公開稿不変（CI #41293650480 success）。実Discord OAuthは未実施 | not-run |
| AC-20 | 未ログイン読者が本文・設定集・辞書・年表の公開・未公開データを取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 匿名公開API・非公開拒否（全経路未網羅） | not-run |
| AC-21 | Discordログインしていない状態で公開データを閲覧する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: anonymous mobile reading | not-run |
| AC-22 | 読者がDiscordログイン後に編集・公開APIを呼び出す | apps/api/http-acceptance/http-acceptance.test.mjs; docs/cat/ac19-22-non-author-guard-draft.md | H: 合成された非作者セッションで8種類の管理要求をNuxt proxy・Nest直接APIの両方から401拒否（CI #41293650480 success）。実Discord OAuthでの受入は未実施 | not-run |
| AC-23 | 未ログイン状態で編集・公開APIを呼び出す | apps/api/http-acceptance/http-acceptance.test.mjs; apps/web/browser-acceptance/browser-acceptance.test.mjs | H+B: 匿名で管理GET/POST/PATCH・公開・可視性・並べ替えを両HTTP経路から401拒否し、匿名ブラウザに作者編集UIを表示しない（CI #41293879283 push success、実OAuth不要な匿名境界の部分証拠） | not-run |
| AC-24 | 異なるシリーズA・Bを作成して編・部・章・本文をそれぞれ登録 | apps/web/browser-acceptance/browser-acceptance.test.mjs; docs/cat/ac24-27-cross-series-story-isolation-draft.md | B: A/Bに同名の編・部・章と異なる本文を登録し匿名公開ツリー・直URLの独立性を検証（CI #41286928693 success） | not-run |
| AC-25 | 両シリーズに設定・言語・出来事を登録し切り替える | apps/web/browser-acceptance/browser-acceptance.test.mjs; apps/api/http-acceptance/http-acceptance.test.mjs; docs/cat/ac25-cross-series-multidomain-isolation-draft.md | B+H: A/B同名のカテゴリ/Tip・言語/Word・年代/Eventを別IDで公開し、両公開ツリーの非混入とBカテゴリ非公開後のA・B他領域の維持を検証（CI #41293612935 success）。作者UIの全切替導線は別途精査 | not-run |
| AC-26 | 異なるシリーズで同名設定・単語・年代を使う | apps/api/tests/postgres-alpha.test.mjs | DB: 別シリーズ同名語をID/所属で分離（CI #41275393712 success） | not-run |
| AC-27 | 公開／非公開を混在させたシリーズA・Bを匿名閲覧する | apps/api/tests/postgres-alpha.test.mjs; apps/web/browser-acceptance/browser-acceptance.test.mjs | DB+B: 公開Aを維持しBを非公開にするとBツリー・章が匿名404、Aは200（CI #41286928693 success、全ドメイン未網羅） | not-run |
| AC-28 | 公開済みの編・部・章・本文がある状態で上位の編またはシリーズを非公開にする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: シリーズ非公開時に章を含む全領域の子孫を匿名API/直URLから遮断（CI #41275269669 success） | not-run |
| AC-29 | 設定カテゴリ・言語・年表の上位要素を非公開にする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 設定・言語・年代区分の非公開が子孫に伝播（CI #41275269669 success） | not-run |
| AC-30 | 親が公開、子が非公開の状態と、親が非公開、子が公開の状態を比較する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 子自身の非公開と祖先非公開を区別、親再公開でも子自身の設定維持（CI #41275269669 success） | not-run |
| AC-31 | 公開済み親を非公開へ変更し、一覧・検索・直接URL・関連リンク・キャッシュを再取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs、apps/api/http-acceptance/http-acceptance.test.mjs | B/H: 直URL/検索/関連リンクでの非公開遮断（CI #41275269669 success、キャッシュ全経路未網羅） | not-run |
| AC-32 | 非公開化した親を再公開する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 祖先再公開で子の独立した非公開設定を保持（CI #41275269669 success） | not-run |
| AC-33 | 章の本文を任意位置で複数ページに分割し、章を公開する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: semantic page boundaries（保存・公開全件未検証） | not-run |
| AC-34 | 公開済み章を非公開にする | apps/web/browser-acceptance/browser-acceptance.test.mjs; apps/api/http-acceptance/http-acceptance.test.mjs; docs/cat/ac34-chapter-visibility-toggle-draft.md | B+H: 章単独非公開で匿名直API/ツリーから消失、兄弟章は維持、再公開後は未公開の新稿ではなく旧公開版を復元（CI #41293550881 success）。ページ別の全経路は未網羅 | not-run |
| AC-35 | 公開カテゴリ・公開設定の一部項目のみ非公開にする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: TipSection A非公開でも兄弟Bは公開（CI #41275269669 success） | not-run |
| AC-36 | 設定またはカテゴリを非公開にし、配下の設定項目を公開指定のままにする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: Tip非公開で配下TipSectionが匿名404（CI #41275269669 success） | not-run |
| AC-37 | 新規単語を通常登録する | apps/web/browser-acceptance/browser-acceptance.test.mjs; packages/contracts/exploratory/word-initial-visibility.test.mjs | B+Domain: 作者UIの初期公開設定=true、作成時は公開版なし・匿名404（CI #41286577405 success、正式CAT Gate未実施） | not-run |
| AC-38 | 新規単語を非公開指定で登録し編集する | apps/web/browser-acceptance/browser-acceptance.test.mjs; packages/contracts/exploratory/word-initial-visibility.test.mjs; docs/cat/ac37-38-word-initial-visibility-draft.md | B+Domain: 非公開指定作成→公開版反映後も非公開→明示公開で匿名200、非公開Wordの再公開でも状態保持（CI #41286577405/#41286623382 success、全編集条件は未検証） | not-run |
| AC-39 | 公開言語で単語のみ非公開にする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 単語自身の非公開と他言語資料の公開維持（CI #41275269669 success、意味/語源全経路未網羅） | not-run |
| AC-40 | 非公開言語・シリーズに公開設定の単語を登録する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 言語/シリーズ非公開時に公開指定の単語を匿名404（CI #41275269669 success） | not-run |
| AC-41 | 公開単語の意味・語源を編集する | apps/web/browser-acceptance/browser-acceptance.test.mjs; docs/cat/ac08-53-multi-meaning-etymology-draft.md | B: 同品詞の2意味と各語源を保存・公開後、第1義のみ改訂し、下書き保存時の公開稿不変と明示公開後の第2義/語源ID保持を確認（CI #41287408802 success）。実Discord/全編集操作は未検証 | not-run |
| AC-42 | 同じシリーズに複数年代区分と出来事を登録し、区分ごと／統合表示を切り替える | 未特定 | — | pending-decision |
| AC-43 | 年代区分を非公開にし、所属出来事が公開のまま読者アクセスする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 年代区分非公開時に配下Eventが匿名404（CI #41275269669 success） | not-run |
| AC-44 | 公開年代区分で一部出来事のみ非公開にする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: Event A非公開でも兄弟Event Bは公開（CI #41275269669 success） | not-run |
| AC-45 | 年代区分・出来事の公開日時を設定し、時刻境界の前後で取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 年代区分の未来公開日時による配下Event遮断（CI #41275713765 success・境界値未検証） | pending-decision |
| AC-46 | 一つのカテゴリに複数の設定を登録し、ある設定の所属先を変更する | 未特定 | — | not-run |
| AC-47 | カテゴリを作成・編集し、カテゴリの中へさらにカテゴリを追加しようとする | apps/web/browser-acceptance/browser-acceptance.test.mjs; apps/api/http-acceptance/http-acceptance.test.mjs; docs/cat/ac47-category-nesting-boundary-draft.md | B+H: カテゴリ編集・再読込、子作成UIにTipのみ表示、カテゴリ内カテゴリのPOSTは400かつDB全体不変（CI #41293701037 success）。正式CAT Gate未実施 | not-run |
| AC-48 | 異なるカテゴリの設定に同一のタグを付け、タグに基づいて横断的に分類する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 同タグの公開Tipを複数カテゴリ横断検索し個別非公開を検証（CI #41276226834 success） | not-run |
| AC-49 | カテゴリに項目プリセットの見出し・表示順・テンプレートテキストを登録・変更し設定作成に利用する | apps/web/browser-acceptance/browser-acceptance.test.mjs; apps/api/http-acceptance/http-acceptance.test.mjs; packages/contracts/exploratory/category-preset-create.test.mjs | B+H+Domain: プリセット編集後の新規Tipへの適用と、無効JSON更新の400拒否・既存DB不変を検証（CI #41293843303 success）。全表示順/テンプレート操作は未網羅 | not-run |
| AC-50 | 既存設定AをプリセットP1で作成・編集した後、カテゴリ側プリセットをP2へ変更し新規設定Bを作成する | apps/web/browser-acceptance/browser-acceptance.test.mjs; apps/api/http-acceptance/http-acceptance.test.mjs; packages/contracts/exploratory/category-preset-nonpropagation.test.mjs; docs/cat/ac50-category-preset-nonpropagation-draft.md | B+H+Domain: P1既存TipSectionのID/本文/順序を保持し、P2は新規Tipのみへ適用。無効なプリセット更新は改訂番号も進めない（CI #41293843303 success）。正式CAT Gate未実施 | not-run |
| AC-51 | 公開中の設定で一部TipSectionだけを非公開にする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: TipSection個別非公開・兄弟公開のUI/API確認（CI #41275269669 success） | not-run |
| AC-52 | 公開言語の文法項目Aだけ公開・文法項目Bを非公開にし、その後に親の言語を非公開にする | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 文法個別非公開/兄弟公開と親言語の非公開伝播（CI #41275269669 success） | not-run |
| AC-53 | 同一単語に同じ品詞の異なる複数意味を登録し、意味ごとに語源を関連付ける | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 同品詞の複数意味・意味別語源の独立IDと公開稿（CI #41275713765 success） | not-run |
| AC-54 | 各領域で未来公開日時を指定し、指定時刻の前後に匿名閲覧する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: シリーズ未来公開日時による全4領域遮断（CI #41275269669 success、時刻境界未検証） | pending-decision |
| AC-55 | 新着投稿表示・ジャンプ・公開管理の一覧を匿名読者で使う | apps/web/browser-acceptance/browser-acceptance.test.mjs; apps/api/http-acceptance/http-acceptance.test.mjs; packages/contracts/exploratory/public-recent-privacy.test.mjs; docs/cat/ac55-public-recent-privacy-draft.md | B+H+Domain: 公開章リンク・非公開後除外、Tip/Word/Eventの新着、非公開祖先・未公開下書きの遮断を確認（CI #41293919427 success）。未来公開日時のWordは新着から除外、解除後は旧公開稿が復帰（CI #41294048995 success）。予約時刻の厳密境界・全ジャンプ導線は未網羅 | not-run |
| AC-56 | 作者がホーム・一覧・詳細・管理トップから作成・編集画面へ移動する | apps/web/browser-acceptance/browser-acceptance.test.mjs; docs/cat/ac56-author-navigation-boundary-draft.md | B: 公開ページの共通作者導線から書斎へ遷移し、匿名では作者UIと管理APIを拒否（CI #41287408802 success）。全画面/項目直編集リンクは未網羅 | not-run |
| AC-57 | 章本文・TipSection・単語意味と語源を編集し保存して再取得する | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 意味別語源と長文の下書き保存/再読込（他領域の全フィールド未検証） | not-run |
| AC-58 | 公開情報一覧・新着表示・タグ・区分マスタ・作者用メモを確認する | apps/web/browser-acceptance/browser-acceptance.test.mjs; apps/api/http-acceptance/http-acceptance.test.mjs; apps/api/tests/author-memos.test.mjs | B/H/DB: 公開新着、カテゴリ横断タグ検索、作者メモのタグ保存・再取得と読み戻し障害時の表示を個別に試験。区分マスタ・全画面導線・実Discord本人認可を含むAC全体は未検証 | not-run |
| AC-59 | 画面の読込中とローカライズ対象の固定文言を確認する | 未特定 | — | pending-decision |
| AC-60 | DS-01、v0.3 VisualDesignConcept、200/220 | apps/web/app/assets/css/eternalia.css、apps/web/tests/legacy-design-tokens.test.mjs | CI: 11枚の画面撮影・旧色トークン照合（旧v0.3画像との人間の比較は未実施） | not-run |
| AC-61 | DS-02、旧FE `_pallet/_color.scss` | apps/web/tests/legacy-design-tokens.test.mjs | CI: v0.3 palette SCSSの色値・意味ロールを稼働CSSと照合（旧UI実画面の比較は未実施） | not-run |
| AC-62 | DS-02、旧FE `_font-size/_margin/_radius.scss` | apps/web/tests/legacy-design-tokens.test.mjs | CI: v0.3の文字サイズ6段階・余白・角丸を稼働CSSと照合（画面幅別の視覚確認は未実施） | not-run |
| AC-63 | DS-03、旧FE `layouts/default.vue` と `components/app/common` | apps/web/browser-acceptance/browser-acceptance.test.mjs | CI: 11枚の読者/作者スクリーンショット取得（旧Header/SideMenu等との画像比較は未実施） | not-run |
| AC-64 | DS-04、CM-01/05/08 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 競合アラート・未保存保護・読者ルート（全状態と多言語は未検証） | not-run |
| AC-65 | DS-05、WR-02/05 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 4公開領域を320/390/768/1280pxで実ブラウザ検証し水平はみ出しなし、320/390/1280pxのスクリーンショットを保存。作者Studioは320/390pxで検証（CI #41294267990 success）。実IME・人間の視覚評価は未検証 | not-run |
| AC-66 | v0.3共通、PB-06、CM-09 | 未特定 | — | not-run |
| AC-67 | v0.3設定・辞書、ST-03/05/06/09、LG-05〜08 | 未特定 | — | not-run |
| AC-68 | v0.3 Timeline、TL-01〜06 | 未特定 | — | not-run |
| AC-69 | PB-18、215承認済み公開更新方式 | apps/web/browser-acceptance/browser-acceptance.test.mjs | B: 章/TipSection/単語/文法/出来事の下書き・再読込・明示公開・非公開/復帰（実UI全経路未網羅） | not-run |
| AC-70 | PB-10〜17、PB-18 | apps/web/browser-acceptance/browser-acceptance.test.mjs、apps/api/http-acceptance/http-acceptance.test.mjs | B/H: 全4領域の祖先/子非公開、未来予定、直URL/検索（CI #41275269669 success、全経路未網羅） | not-run |
| AC-71 | 旧Backend develop/920 | 未特定 | — | not-run |
| AC-72 | 215・210 | .github/workflows/alpha-checks.yml | CI: Node22/Nuxt/Nest/PG17/Chromium 4ジョブ成功、実Discord OAuth未検証 | not-run |
| AC-73 | 010 UI構造試験導入 | 未特定 | — | not-run |
| AC-74 | 910/920継承監査 | 未特定 | — | not-run |
| AC-75 | CM-02/03/08/09 | 未特定 | — | pending-decision |
| AC-76 | CM-10、v0.3全体共通「非公開済データの削除」 | 未特定 | — | pending-decision |
| AC-77 | CM-11、v0.3全体共通「無効化フラグ」 | 未特定 | — | pending-decision |
| AC-78 | DS-01、200/220、旧UI・v0.3デザイン | apps/web/app/assets/css/eternalia.css、apps/web/browser-acceptance/browser-acceptance.test.mjs | CI: 作者3画面幅のスクリーンショット取得（編集キャンバスの設計承認は未実施） | pending-decision |

検証追加: [CI #41214098597](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41214098597) のbuild-and-testでv0.3デザイントークン3テスト成功。[CI #41213912611 の11画像artifact](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41213912611/artifacts/13047567293) は撮影済みだが視覚比較は未実施。画像artifactは7日保持。

## 次の検証単位

1. 最新HEADの4 CIジョブを照合し、Bの対象テスト名と結果を記録する。失敗時は実際のログから修正。
2. AC-69/17/16の4領域＋Grammarのブラウザー保存・公開・非公開・再公開証拠を部分合格からAC全体の境界へ精査する。
3. AC-18/19/22/72の実Discord本人・非本人認可、AC-65のIME/端末、AC-60〜64の旧UI画像比較は別証拠を要求する。
