# PostcodeJP - GitHub Copilot Instructions

このリポジトリは日本の郵便番号データを提供するREST APIシステムです。

## 技術スタック

### Azure Functions API (メイン)
- **言語**: TypeScript 5.0+
- **ランタイム**: Node.js 20.x
- **フレームワーク**: Azure Functions v4
- **データベース**: Azure Table Storage
- **ビルドツール**: TypeScript Compiler (tsc)
- **パッケージマネージャー**: npm

### FastAPI Backend (代替実装)
- **言語**: Python 3.12+
- **フレームワーク**: FastAPI 0.109+
- **ORM**: SQLAlchemy 2.0+
- **データベース**: PostgreSQL (psycopg2-binary)
- **バリデーション**: Pydantic 2.5+

### Frontend
- **言語**: TypeScript 5.9+
- **フレームワーク**: React 19.2+
- **ビルドツール**: Vite 7.x
- **スタイリング**: Tailwind CSS 4.x
- **アイコン**: Lucide React
- **リンター**: ESLint 9.x

## プロジェクト構造

```
postcodejp/
├── azure-functions/      # Azure Functions (TypeScript) - メインAPI
│   ├── src/             # TypeScript ソースコード
│   ├── scripts/         # データインポートスクリプト (Python)
│   └── package.json
├── app/                 # FastAPI backend (Python)
│   ├── models/          # SQLAlchemy モデル
│   ├── routers/         # API エンドポイント
│   ├── services/        # ビジネスロジック
│   └── schemas/         # Pydantic スキーマ
├── frontend/            # React フロントエンド
│   ├── src/             # React コンポーネント
│   └── package.json
├── scripts/             # データ管理スクリプト (Python)
├── database/            # データベーススキーマ
└── .github/
    └── workflows/       # CI/CD パイプライン
```

## コーディング規約

### TypeScript (Azure Functions)
- **型定義**: 明示的な型注釈を使用（型推論のみに依存しない）
- **非同期処理**: async/await を使用（Promise チェーンは避ける）
- **エラーハンドリング**: try-catch ブロックで適切にハンドル
- **命名規則**: 
  - 関数: camelCase
  - インターフェース/型: PascalCase
  - 定数: UPPER_SNAKE_CASE

### Python (FastAPI/Scripts)
- **スタイル**: PEP 8 準拠
- **型ヒント**: 関数シグネチャに型ヒントを必ず使用
- **バリデーション**: Pydantic モデルを使用
- **非同期**: FastAPI の async def を優先
- **命名規則**: snake_case

### React/TypeScript (Frontend)
- **コンポーネント**: 関数コンポーネント + Hooks
- **型定義**: Props と State に明示的な型
- **スタイリング**: Tailwind CSS ユーティリティクラス
- **命名規則**:
  - コンポーネント: PascalCase
  - Hooks/関数: camelCase

## ビルドとテスト

### Azure Functions
```bash
cd azure-functions
npm install
npm run build     # TypeScript コンパイル
npm start         # ローカル実行
```

### FastAPI
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # 開発サーバー
npm run build     # プロダクションビルド
npm run lint      # ESLint 実行
```

## データ管理

- **データソース**: 日本郵便公式データ (https://www.post.japanpost.jp/zipcode/download.html)
- **更新頻度**: 月次（毎月1日に自動同期）
- **インポート**: `azure-functions/scripts/import_to_table.py`

## 環境変数

### Azure Functions
- `AZURE_STORAGE_CONNECTION_STRING`: Table Storage 接続文字列

### FastAPI
- `DATABASE_URL`: PostgreSQL 接続文字列
- `AZURE_STORAGE_CONNECTION_STRING`: オプション

## CI/CD

- **デプロイ**: `.github/workflows/deploy.yml`
  - `azure-functions/**` への push で自動デプロイ
  - Node.js 20.x 使用
- **データ同期**: `.github/workflows/sync-data.yml`
  - 毎月1日に自動実行
  - Python 3.12 使用

## セキュリティとベストプラクティス

### 必須事項
- ✅ シークレットは環境変数で管理（コードにハードコードしない）
- ✅ Azure 接続文字列は GitHub Secrets に保存
- ✅ ビルド成果物（`dist/`, `node_modules/`, `__pycache__/`）はコミットしない
- ✅ API キーやトークンは `.env` ファイルで管理（`.gitignore` に追加）

### 禁止事項
- ❌ プロダクション設定ファイルを直接編集しない
- ❌ `main` ブランチに直接コミットしない
- ❌ Azure リソースの設定を手動で変更しない（IaCを使用）
- ❌ テストなしで破壊的変更を行わない

## API エンドポイント

主要エンドポイント:
- `GET /api/postal-codes/{code}` - 郵便番号から住所取得
- `GET /api/postal-codes/search?q=...` - 住所で検索
- `GET /api/prefectures` - 都道府県一覧
- `GET /api/offices/{code}` - 事業所郵便番号取得
- `GET /api/stats` - API統計情報

## 開発の注意点

1. **Azure Functions の変更**
   - `azure-functions/src/` ディレクトリのみ編集
   - ビルド後に `dist/` を確認
   - ローカルで `func start` でテスト

2. **Python スクリプト**
   - データインポートは慎重に実行
   - 本番環境への影響を考慮

3. **Frontend**
   - API エンドポイントは環境変数で管理
   - レスポンシブデザインを維持
   - アクセシビリティを考慮

4. **データベース**
   - Azure Table Storage は NoSQL
   - PartitionKey/RowKey の設計を理解する

## ライセンスと著作権

- コード: MIT License
- 郵便番号データ: 日本郵便株式会社提供（利用規約に従う）
