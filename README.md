# Eternalia_Novel — α版ローカル検証パッケージ

**ローカル実行可能・ユーザー確認用α版（2026-10-28）**。Nuxt 4 / NestJS / PostgreSQLの採用は確定済みですが、現在それらの正式なインストール・統合・動作検証は未完了です。α版はNode.js標準ライブラリで動作する独立プレビューを使用しています。

## すぐに動作確認

- **Windows:** `start-alpha.cmd` をダブルクリック（Node.js 22+）
- **macOS/Linux:** `./start-alpha.sh`
- 読者用URL、作者用URLは起動したターミナルに表示されます。**作者URLには認証キーのハッシュフラグメントが付属するため、全文をコピー**してください。
- サンプル: 空の状態なら `node apps/preview/src/seed.mjs` を実行してから起動。

詳しい操作シナリオ: [`docs/alpha-setup.md`](docs/alpha-setup.md)

## 内容

- `apps/preview/`: localhostのみで稼働する検証用Web UI / HTTP API、ローカルJSONデータストア。**本番向け認証ではありません**。
- `packages/contracts/`: 階層管理、下書き/公開スナップショット、親非公開・公開日時、編集競合などの純粋なTypeScriptドメインロジック（テスト実施）。
- `apps/web/`: Nuxt 4の現行採用構成の最小骨格（未統合/未ビルド）。
- `apps/api/`: NestJSの現行採用構成の最小骨格（未統合/未ビルド）。
- `compose.yaml`: PostgreSQL開発コンテナ構成（未稼働）。
- `docs/`: α版確認手順、開発工程・仕様境界。

### 採用済み要件からα版に実装した主な範囲

- シリーズ→編→部→章、設定カテゴリ→Tip→TipSection、言語→単語/文法、年代区分→出来事の所属関係
- 下書き保存と明示公開の分離。公開版スナップショットの保存
- 匿名読者に対する祖先の公開可否/開始日時の遮断、編集・公開APIの区別
- 更新競合409、カテゴリ別TipSectionプリセットを新規Tipに一度だけコピー
- ルビ・ページ分割を文字列マーカーから読者画面で表示する暫定仕様

### CAT-TDDについて

`cat-tdd-chatgpt` の `issue-work` フローを適用し、仕様と実装、実測可能な探索的テストを分離しています。現環境では正規ランタイムのdoctor・handoff guard・TestModel生成・Queue/Red/Green/Conformanceが実行できなかったため、**このパッケージはCATの正式完了成果ではありません**。`CAT-HANDOFF.md` から作業を再開してください。

正式なGitHub `surumeneco/Eternalia_Novel` mainへのPR/マージも未実施です。
