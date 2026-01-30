# PostcodeJP - 郵便番号API

日本郵便の郵便番号データを活用した**完全無料**の検索APIシステム

[![Deploy to Cloudflare Workers](https://github.com/Yorihito/postcodejp/actions/workflows/deploy.yml/badge.svg)](https://github.com/Yorihito/postcodejp/actions/workflows/deploy.yml)

## 特徴

- 🆓 **完全無料** - Cloudflare Workers無料枠で運用
- 🔍 郵便番号から住所を検索
- 🏠 住所から郵便番号を検索
- 🏢 事業所の個別郵便番号検索
- ⚡ 高速レスポンス（エッジで実行）
- 🔄 毎月自動データ更新（GitHub Actions）

## API エンドポイント

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/postal-codes/{code}` | 郵便番号から住所取得 |
| GET | `/api/postal-codes/search?q=...` | 住所で検索 |
| GET | `/api/prefectures` | 都道府県一覧 |
| GET | `/api/prefectures/{code}/cities` | 市区町村一覧 |
| GET | `/api/offices/{code}` | 事業所郵便番号取得 |
| GET | `/api/offices/search?q=...` | 事業所名検索 |
| GET | `/api/stats` | データ統計 |

## 使用例

```bash
# 郵便番号から住所取得
curl https://postcodejp-api.YOUR_SUBDOMAIN.workers.dev/api/postal-codes/1000001

# 住所から検索
curl "https://postcodejp-api.YOUR_SUBDOMAIN.workers.dev/api/postal-codes/search?q=千代田"
```

## セットアップ

### 1. Cloudflareアカウント作成

[Cloudflare](https://dash.cloudflare.com/sign-up) でアカウントを作成

### 2. Wranglerでログイン

```bash
cd workers
npm install
npx wrangler login
```

### 3. KVネームスペース作成

```bash
npx wrangler kv:namespace create POSTAL_CODES
npx wrangler kv:namespace create POSTAL_CODES --preview
```

表示されたIDを `wrangler.toml` に設定

### 4. 初期データインポート

```bash
# データ生成
pip install httpx
python scripts/import_to_kv.py

# KVにアップロード
for f in ../kv_data/*.json; do
  npx wrangler kv:bulk put --namespace-id=YOUR_NS_ID "$f"
done
```

### 5. デプロイ

```bash
npx wrangler deploy
```

## GitHub設定

### Secrets設定

| Secret名 | 説明 |
|---------|------|
| `CLOUDFLARE_API_TOKEN` | CloudflareのAPIトークン（Workers編集権限） |

### Variables設定

| Variable名 | 説明 |
|------------|------|
| `KV_NAMESPACE_ID` | KVネームスペースID |

## 技術スタック

- **Runtime**: Cloudflare Workers
- **Storage**: Cloudflare KV
- **CI/CD**: GitHub Actions
- **データソース**: [日本郵便](https://www.post.japanpost.jp/zipcode/download.html)

## 無料枠の範囲

| リソース | 無料枠 |
|---------|-------|
| Workerリクエスト | 100,000/日 |
| KVリード | 100,000/日 |
| KVストレージ | 1GB |

## ライセンス

MIT License

郵便番号データは日本郵便株式会社が提供しています。
