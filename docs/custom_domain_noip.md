# No-IP を使用したカスタムドメイン設定手順

No-IP (noip.com) で取得・管理しているホスト名（例: `myapp.ddns.net`）やドメインを、Azure Static Web Apps に割り当てる手順です。

## 前提条件
- No-IP のアカウントを持っていること
- No-IP でホスト名（Hostname）を作成可能、またはドメイン管理が可能であること
- Azure Static Web Apps のデフォルトURL（`ashy-beach-...azurestaticapps.net`）を確認済みであること

## 手順 1: Azure Portal での情報確認

1. **Azure Portal** で対象の **Static Web Apps** を開きます。
2. 「概要 (Overview)」にある **URL** をコピーします。
    - 例: `ashy-beach-0927f3600.1.azurestaticapps.net`

## 手順 2: No-IP 側での CNAME 設定

No-IPの管理画面で、Azure Static Web Apps へ転送するための **CNAME (DNS Alias)** レコードを設定します。

1. **No-IP** (noip.com) にログインし、ダッシュボードへ移動します。
2. 左メニューの **「Dynamic DNS」** -> **「No-IP Hostnames」**（または「My Services」->「DNS Records」）を選択します。
3. **「Create Hostname」**（または既存のホスト名の「Modify」）をクリックします。
4. 以下の通り設定します：
    - **Hostname**: 使用したいホスト名を入力（例: `postcode-app` . `ddns.net`）
    - **Host Type**: **「DNS Alias (CNAME)」** を選択します。
        - ※無料版の場合、CNAMEが選択できない場合があります。その場合は「Web Redirect」ではなく、DNS設定が可能なプランか確認してください（通常のDynamic DNSはAレコードですが、Azure SWAはCNAME推奨です）。
    - **Target Host**: 手順1でコピーした Azure Static Web Apps の URL を貼り付けます。
        - 例: `ashy-beach-0927f3600.1.azurestaticapps.net`
5. **「Add Hostname」**（または「Update Hostname」）をクリックして保存します。

## 手順 3: Azure Static Web Apps でのドメイン追加

1. **Azure Portal** の Static Web Apps 画面に戻ります。
2. 左メニューの **「カスタム ドメイン (Custom domains)」** を選択します。
3. **「＋追加 (Add)」** -> **「その他の DNS 上のカスタム ドメイン (Custom domain on other DNS)」** を選択します。
4. **「ドメイン名」** に、No-IP で設定したホスト名を入力します（例: `postcode-app.ddns.net`）。
5. **「次へ」** をクリックすると、検証情報の生成が行われます。
6. 設定が正しければ自動的に CNAME レコードが検出され、所有権が検証されます。
    - ※DNSの反映には数分～数時間かかる場合があります。「検証に失敗しました」と出る場合は、少し待ってから再度「追加」を試してください。

## 補足: ルートドメイン (example.com) の場合
ルートドメイン（サブドメインなし）を使用する場合、No-IP の Managed DNS で **TXT レコード** による検証が必要になることがあります。Azure Portal の指示に従い、No-IP の DNS レコード編集画面で `TXT` レコード（ホスト名 `@`）を追加してください。
