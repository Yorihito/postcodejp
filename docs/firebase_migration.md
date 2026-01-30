# Firebase移行 実装計画書

PostgreSQL + FastAPI構成からFirebase（無料枠）への移行計画。

---

## Firebase無料枠（Spark Plan）の制限

| サービス | 無料枠 |
|---------|-------|
| **Firestore** | 1GB保存、50K読み取り/日、20K書き込み/日 |
| **Cloud Functions** | 2M呼び出し/月、400K GB-秒 |
| **Hosting** | 10GB保存、360MB/日転送 |

> [!NOTE]
> 郵便番号データは約12万件で、Firestoreに格納すると約50-100MB程度。無料枠内で運用可能。

---

## 技術スタック変更

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| データベース | PostgreSQL | **Firestore** |
| API | FastAPI (Python) | **Cloud Functions (Node.js)** |
| ホスティング | Docker | **Firebase Hosting** |
| スケジューラ | APScheduler | **Cloud Scheduler** (有料) or 手動 |

> [!WARNING]
> ### 自動更新について
> Cloud Schedulerは有料のため、無料運用では**手動更新**または**GitHub Actions**での定期実行を推奨。

---

## Firestoreデータモデル

```
postal_codes (collection)
├── {postal_code} (document)
│   ├── postal_code: "1000001"
│   ├── prefecture: "東京都"
│   ├── city: "千代田区"
│   ├── addresses: [
│   │   {town: "千代田", town_kana: "チヨダ", ...},
│   │   ...
│   ]
│   └── updated_at: timestamp

offices (collection)
├── {postal_code} (document)
│   ├── postal_code: "1000001"
│   ├── offices: [
│   │   {office_name: "...", office_kana: "...", ...}
│   ]
│   └── updated_at: timestamp

prefectures (collection)
├── {code} (document)
│   ├── code: "13"
│   ├── name: "東京都"
│   ├── name_kana: "トウキョウト"
│   └── cities: [{code: "13101", name: "千代田区", ...}, ...]

metadata (collection)
├── sync_status (document)
│   ├── last_sync: timestamp
│   ├── postal_codes_count: 124000
│   └── offices_count: 20000
```

---

## プロジェクト構成

```
postcodejp/
├── firebase/
│   ├── functions/
│   │   ├── src/
│   │   │   ├── index.ts          # Cloud Functions エントリー
│   │   │   ├── postalCodes.ts    # 郵便番号API
│   │   │   ├── offices.ts        # 事業所API
│   │   │   └── admin.ts          # 管理API
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── firebase.json
├── scripts/
│   ├── import_to_firestore.py    # データインポート
│   └── download_data.py          # データダウンロード（既存流用）
└── docs/
    └── requirements.md
```

---

## API エンドポイント（Cloud Functions）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/postal-codes/{code}` | 郵便番号から住所取得 |
| GET | `/api/postal-codes/search?q=...` | 住所で検索 |
| GET | `/api/prefectures` | 都道府県一覧 |
| GET | `/api/prefectures/{code}/cities` | 市区町村一覧 |
| GET | `/api/offices/{code}` | 事業所検索 |
| GET | `/api/offices/search?q=...` | 事業所名検索 |

---

## 実装手順

### 1. Firebase プロジェクト作成
```bash
firebase login
firebase init
# Firestore, Functions, Hostingを選択
```

### 2. Cloud Functions 実装
```bash
cd firebase/functions
npm install
npm run build
```

### 3. データインポート
```bash
# ローカルでCSV→Firestoreインポート
python scripts/import_to_firestore.py
```

### 4. デプロイ
```bash
firebase deploy
```

---

## 検証計画

1. **API動作確認**: Firebase Emulatorでローカルテスト
2. **データ確認**: Firestoreコンソールでデータ件数確認
3. **パフォーマンス**: 郵便番号検索 < 100ms目標

---

## 制限事項

1. **検索機能**: Firestoreは全文検索に弱い → 前方一致のみサポート
2. **自動更新**: 無料では手動更新のみ
3. **大量アクセス**: 1日50K読み取りを超えると課金発生
