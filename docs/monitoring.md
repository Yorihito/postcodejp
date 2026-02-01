# API監視ガイド

Azure API Managementは高機能ですが高コストです。
現段階では、Azure Function App標準のモニタリング機能（Azure Monitor / Application Insights）で十分にトラフィックを確認できます。

## 1. 簡易チェック（Stats API）
APIがどれくらい呼び出されているかを簡易的に知るために、訪問者数（Visitor Count）を返すエンドポイントを用意しました。

```bash
curl https://func-postcodejp.azurewebsites.net/api/stats
```

レスポンス例:
```json
{
  "name": "PostcodeJP API",
  "version": "1.0.0",
  "visitor_count": 12345,
  ...
}
```

## 2. Azure Portal での詳細確認
より詳細なアクセス数やエラー数を確認するには、Azure Portalを利用します。

1. [Azure Portal](https://portal.azure.com/) にログイン
2. 作成した Function App (`func-postcodejp`) を開く
3. 左側メニューの **[監視]** > **[概要]** または **[メトリック]** をクリック

### チェックすべき項目
- **関数の実行回数 (Function Execution Count)**: APIが何回呼ばれたか
- **HTTP Server Errors**: 500エラーなどの発生数
- **Data In/Out**: 通信量（課金に関わりますが、テキストデータのみなので通常は微々たるものです）

## レート制限の判断基準
もし「関数の実行回数」が **1日10万回** を超えるような異常なスパイクが見られた場合や、特定のIPからの攻撃的なアクセスがログ (Application Insights) で確認された場合に、レート制限の導入（Azure API Management や Front Door）を検討してください。
