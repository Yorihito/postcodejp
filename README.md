# PostcodeJP - 郵便番号API

日本郵便の郵便番号データを活用した無料の検索APIシステム

[![Deploy to Firebase](https://github.com/YOUR_USERNAME/postcodejp/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/postcodejp/actions/workflows/deploy.yml)

## 機能

- 🔍 郵便番号から住所を検索
- 🏠 住所から郵便番号を検索
- 🏢 事業所の個別郵便番号検索
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
curl https://YOUR_PROJECT.web.app/api/postal-codes/1000001

# 住所から検索
curl "https://YOUR_PROJECT.web.app/api/postal-codes/search?q=千代田"
```

## セットアップ

### 1. Firebaseプロジェクト作成

```bash
# Firebase CLIインストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクト初期化
firebase use --add
```

### 2. 初期データインポート

```bash
# Python依存パッケージインストール
pip install firebase-admin httpx

# サービスアカウントキーを設定
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# データインポート実行
python scripts/import_to_firestore.py
```

### 3. デプロイ

```bash
# Functions依存パッケージインストール
cd functions && npm install && cd ..

# デプロイ
firebase deploy
```

## GitHub設定

### Secrets設定

| Secret名 | 説明 |
|---------|------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebaseサービスアカウントキー（JSON） |

### Variables設定

| Variable名 | 説明 |
|------------|------|
| `FIREBASE_PROJECT_ID` | FirebaseプロジェクトID |

## 技術スタック

- **Database**: Cloud Firestore
- **API**: Cloud Functions (Node.js/TypeScript)
- **Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions
- **データソース**: [日本郵便](https://www.post.japanpost.jp/zipcode/download.html)

## ライセンス

MIT License

郵便番号データは日本郵便株式会社が提供しています。
