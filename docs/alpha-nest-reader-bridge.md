# α版 NestJS 公開読取ブリッジ

**状態: 実装ドラフト / CAT Gate・UI実機未実施。** Nuxt / Nestのビルドと型検査はCI実行記録を参照し、未確認の成功をここでは宣言しない。

このブリッジは、旧ローカルプレビューのJSON保存データをNuxt 4の読者UIへ接続する一時的な読み取りアダプタです。**PostgreSQL実装・Discord OAuth2の代替として本番採用しないでください。** 既存Nodeプレビューの管理APIに作者操作を残し、NestJS側は匿名公開APIだけを提供します。作者の下書きやプリセットは公開APIのDTOに含めません。

- 入力: `.local/preview-data.json`（必要なら `ALPHA_LIBRARY_FILE` を設定）
- `GET /api/public/series`
- `GET /api/public/series/:id/tree`
- `GET /api/public/items/:id`
- 公開判定: `@eternalia/contracts` の `publicSeries / publicTree / toReader`
- キャッシュ: `no-store`。非公開祖先、予約日時、未公開スナップショットを各取得時にサーバー側で判定
- Nuxt側は `server/api/[...path].ts` のサーバープロキシを利用。転送先は非公開の `NUXT_API_INTERNAL_URL`。ユーザー入力で転送先ホストを選ばない

## ローカル試行

ルートで依存導入後、`npm run build:contracts`、別ターミナルで `npm run dev:api` と `npm run dev:web` を実行。旧プレビューは別途 `npm run alpha:offline` で作者編集可能ですが、Nodeプレビューはデータの書き込み主体、Nestは読み取り主体です。両者が同じ `.local/preview-data.json` を見ていることを確認してください。

次工程: PostgreSQLのスキーマ・トランザクション・公開スナップショット、Discord本人認可、Nest管理APIへ置換し、旧プレビューへの依存を除去。採用済みスタックの統合完了は未達成。
