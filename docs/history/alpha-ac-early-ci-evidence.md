# α版AC台帳の初期ヘッダーと時点別CI証拠（履歴）

このファイルはAC台帳に累積されていた当時の実装/CI照合の原文を保管する。**現行ACの判定正本ではなく、履歴としてのみ参照**する。最新の判断は[AC台帳](../alpha-ac-traceability.md)の各行と現行コミットのActionsに従う。

---

# α版 AC-01〜AC-78 受入証拠トレーサビリティ（初期台帳）

- 正本: `forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md`（78件のACを欠落なく抽出）。この表は正本を置き換えない。
- 対象: `surumeneco/Eternalia_Novel` / `develop`（2026-11-10のα版PR #3マージ以降）。本台帳の初期作成元は旧feature HEAD `a9fe1fd9597689447ee3c0806487c0e084799563`。個々の証拠は各行の対象コミット/CIで区別する。
- 環境: GitHub Actions の Node 22 / PostgreSQL 17 / Nuxt+Nest / Chromium (ubuntu-24.04)。本番・実Discord OAuth・実端末の成功を含まない。
- 検証済み基準: `e6299061f3445207a599d9d1fbde7e1b397f5829` の [CI #41213396614](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41213396614) は4ジョブsuccess、Chromiumブラウザ15件・HTTP/SSR6件が全件成功。後続のスクリーンショット収集/実機確認/CAT Gateは別証拠。
- 追加の実測証拠: `e49e7ab` の [CI #41275393712](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41275393712) は4ジョブsuccess、Chromium 17/17・HTTP 6/6・PostgreSQL統合10/10。後続HEADの新規試験は別途CI照合が必要。
- 追加の実測証拠: `f44425d3` の [CI #41275713765](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41275713765) は4ジョブsuccess、Chromium 20/20・HTTP 7/7。後続HEADのタグ横断試験は別途CI照合が必要。
- 2026-11-01追加の探索的受入証拠: `7039a5aaf` の [CI #41293650480](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41293650480)、`eaea98d1c` の [CI #41293701037](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41293701037)、`048698945` の [CI #41293843303](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41293843303)、`3e3d6e589` の [CI #41293919427](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41293919427) はそれぞれ4ジョブ成功。個別ACの全体passや正式CAT Gateを意味しない。
- 追加の実測証拠: `77a6b99e` の [CI #41276226834](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41276226834) は4ジョブsuccess、Chromium 21/21・HTTP 7/7・PostgreSQL統合10/10。これはCAT正式Gateや人間の受入を代替しない。
- 追加の実測証拠: `93ddf22d3ccd9549f47d583040da2c1b3d72363c` の [CI #41296684451](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41296684451) は4ジョブsuccess、Chromium 35/35・HTTP 14/14・探索的Domain 72/72。AC-02の部順序/部章改名、AC-06の関連Tip祖先秘匿・順序/削除・別シリーズ拒否の部分証拠。正式CAT Gate、実Discord OAuth、人間受入は含まない。
- 旧PR #3途中HEAD `7c2a24edc4015620d06afc2675ef4e3a0158b3d7` の [CI #41301522908](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41301522908) は当時4ジョブ成功。ただし下記の別PR #6/#7の追加検査はこのHEADに含まれず、AC全体のpassとはしない。
- 2026-11-01 late branch-specific evidence（**PR #3への統合前・別HEAD**）:
  - AC-03/15/33: [PR #6](https://github.com/surumeneco/Eternalia_Novel/pull/6) HEAD `05fffd3c78267c64593e24fe38998d4635c96d51`、[CI #41319432331](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41319432331) success。Nodeの原稿挿入回帰はUTF-16、CRLF、ルビ・ページマーカー、Unicode grapheme境界を検査。実Android日本語IME/Undo・実ブラウザ全操作は未検証。
  - AC-12/16/17: [PR #7](https://github.com/surumeneco/Eternalia_Novel/pull/7) HEAD `c31fad235d84b511b5ee71c58090656923aaaf6c`、[CI #41313228546](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41313228546) success。合成作者セッションと実PostgreSQL/HTTPで公開・可視性のstale revision 409と公開稿不変を検証。実Discord OAuth2/PKCEは未検証。
- 2026-11-10 AC-68部分証拠: `develop` への [PR #34](https://github.com/surumeneco/Eternalia_Novel/pull/34) 統合前HEAD `0a67a6e7cf83b0618ec7e2a5b6d92360d312d0e0` の Push [CI #42790204301](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42790204301)・PR [CI #42790273108](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42790273108) は各4ジョブ全成功。ブラウザ新規1件のJUnitログで `ok 1`、0失敗を確認。実機・CAT正式Gate・年代区分間換算の受入判定ではない。
- 2026-11-14 現行証拠照合: `develop`統合済みのPR #38〜#67から、公開・検索・関連・キャッシュ・時刻等号・表示日時・UI水和・API RequestIdの実装/試験証拠を該当AC行へ統合。最新統合HEAD `fb68788fa4cf87f0dcfff6ef074e4370ab82d05d`。PR #67最終Push [CI #43556288845](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43556288845)・PR [CI #43556348249](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43556348249) は各4/4成功。AC-45/54の日時条件、AC-59/75のja/en、AC-76の論理削除は決定済み。年代区分換算式（AC-10/42）・作者UI視覚判断（AC-78）は決定待ち。探索的HTTP/Chromium/CI成功はCAT規範Gate・実機/人間受入のpassではない。
- 2026-11-13 追加実装証拠: PR #46（設定下書きのカテゴリ間移動）、PR #47（非公開済み対象の論理削除）、PR #48（年0/負年の整数入力・年代区分RelativeYears保持）が`develop`へ統合済み。各AC行にCI実測と未受入境界を追記した。**TL-03の区分間換算式自体は未決**。CAT Draftの構文検査と正式規範Gate、人間実機受入を混同しない。
- 判定: `not-run` は**AC全体を受け入れるだけの網羅的証拠がまだない**ことを示す。右欄のB/H/DB/CIは探索的な**部分証拠候補**であり、該当ACのpassを意味しない。`pending-decision` は設計決定が必要。`scope-excluded` は明示除外。失敗は実測した場合のみ `fail` にする。
- 各ACのpassへ更新する前に `テストID / コード箇所 / 環境 / 同一HEAD / CI run / 手動証拠 / 判定` を照合する。現在の本表はACを欠落させないための基線であり、CAT正式Gateやユーザー受入ではない。
