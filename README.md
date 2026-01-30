# PostcodeJP - 郵便番号API

日本郵便の郵便番号データを活用したREST APIシステム

[![Azure Functions](https://img.shields.io/badge/Azure-Functions-blue)](https://func-postcodejp.azurewebsites.net)

## ライブAPI

🔗 **https://func-postcodejp.azurewebsites.net**

## 特徴

- 🔍 郵便番号から住所を検索
- 🏠 住所から郵便番号を検索
- 🏢 事業所の個別郵便番号検索
- ⚡ Azure Functions従量課金プラン（低コスト）
- � 120,000件以上の郵便番号データ

## API エンドポイント

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/postal-codes/{code}` | 郵便番号から住所取得 |
| GET | `/api/postal-codes/search?q=...` | 住所で検索 |
| GET | `/api/prefectures` | 都道府県一覧 |
| GET | `/api/offices/{code}` | 事業所郵便番号取得 |
| GET | `/api/stats` | API情報 |

## 使用例

```bash
# 郵便番号から住所取得
curl https://func-postcodejp.azurewebsites.net/api/postal-codes/1000001

# レスポンス:
# {
#   "postal_code": "1000001",
#   "prefecture": "東京都",
#   "city": "千代田区",
#   "town": "千代田"
# }

# 住所から検索
curl "https://func-postcodejp.azurewebsites.net/api/postal-codes/search?q=東京都"

# 都道府県一覧
curl https://func-postcodejp.azurewebsites.net/api/prefectures
```

## 技術スタック

| コンポーネント | サービス |
|--------------|---------|
| **API** | Azure Functions (Node.js/TypeScript) |
| **データベース** | Azure Table Storage |
| **リージョン** | Japan East |

## Azureリソース

| リソース | 名前 | 説明 |
|---------|------|------|
| Resource Group | rg-postcodejp | すべてのリソースを含む |
| Storage Account | stpostcodejp | Table Storage用 |
| Function App | func-postcodejp | API関数 |

## データ

| テーブル | 件数 | 説明 |
|---------|------|------|
| PostalCodes | 120,675 | 郵便番号データ |
| Offices | 26,356 | 事業所データ |
| Prefectures | 47 | 都道府県マスタ |

データソース: [日本郵便](https://www.post.japanpost.jp/zipcode/download.html)

## コスト目安

| サービス | 月額コスト目安 |
|---------|--------------|
| Azure Functions (従量課金) | ~$0（100万回/月無料） |
| Azure Table Storage | ~$0.05 |
| **合計** | **~$1未満/月** |

## ローカル開発

```bash
cd azure-functions
npm install
func start
```

## デプロイ

```bash
cd azure-functions
npm run build
func azure functionapp publish func-postcodejp
```

## データ更新

```bash
# 環境変数設定
export AZURE_STORAGE_CONNECTION_STRING="..."

# データインポート実行
python3 azure-functions/scripts/import_to_table.py
```

## ライセンス

MIT License

郵便番号データは日本郵便株式会社が提供しています。
