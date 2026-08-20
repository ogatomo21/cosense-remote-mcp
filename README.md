# cosense-mcp-worker

Cosense（旧Scrapbox）の単一プロジェクトを操作する、stateless構成のRemote MCPサーバーです。Cloudflare Workers上で動作し、HTTPルーティングにはHono、MCPにはCloudflare Agentsの`createMcpHandler()`とMCP SDK v2を使用します。OAuthの実装はWorkerに持たせず、Cloudflare Access Managed OAuthへ委譲します。

1つのWorkerは、1つのCosenseプロジェクトと1つの`connect.sid`に固定されます。MCPツールの引数から、別プロジェクトや認証情報を指定・変更することはできません。

## 各種MCPツールから使う方法

- 名前 Cosense
- MCPエンドポイント `https://<worker-host>/mcp`
- 認証 OAuth

## Cloudflareへワンクリックデプロイ

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ogatomo21/cosense-remote-mcp)

このボタンから利用者自身のCloudflareアカウントへWorkerを作成・ビルド・デプロイできます。セットアップ画面ではWorker名と、`COSENSE_PROJECT_NAME`、`CF_ACCESS_TEAM_DOMAIN`、`CF_ACCESS_AUD`、Secretの`COSENSE_SID`を入力します。

Cloudflare Access Applicationの作成、Managed OAuthの有効化、Access Policyの設定は、デプロイ後に利用者自身が行う必要があります。

## 提供するエンドポイント

| エンドポイント | 内容 |
| --- | --- |
| `GET /` | サービス概要を返します。プロジェクト名や秘密情報は返しません。 |
| `GET /health` | 認証不要のヘルスチェックです。 |
| `ALL /mcp` | Cloudflare Accessで保護されたStreamable HTTP MCPエンドポイントです。 |

## MCPツール

| ツール | 入力 | 内容 |
| --- | --- | --- |
| `get_page` | `title` | ページ本文、直接リンク、1-hop・2-hop関連ページ、外部・他プロジェクトリンクを取得します。 |
| `list_pages` | なし | 更新日時順で最大100件のページを、説明と更新日時つきで取得します。 |
| `search_pages` | `query` | 設定済みプロジェクト内でCosense全文検索を実行します。 |
| `insert_lines` | `title`、`targetLineText`、`text` | 最初に完全一致した行の直後へ挿入します。一致がなければ末尾へ追加します。`text`には改行を含められます。 |

## ローカルセットアップ

必要なものは、Node.js 20以降、Corepack、Cloudflare Zero Trustを利用できるCloudflareアカウント、対象Cosenseプロジェクトへの権限を持つセッションIDです。

```bash
git clone <リポジトリURL> cosense-mcp-worker
cd cosense-mcp-worker
corepack enable
pnpm install
```

秘密情報ではない値を`wrangler.jsonc`で設定します。

```jsonc
"vars": {
  "COSENSE_PROJECT_NAME": "your-project",
  "CF_ACCESS_TEAM_DOMAIN": "https://your-team.cloudflareaccess.com",
  "CF_ACCESS_AUD": "YOUR_ACCESS_APPLICATION_AUDIENCE_TAG"
}
```

セッションIDは必ずWorker Secretとして設定してください。`wrangler.jsonc`、ソースコード、Gitへ保存してはいけません。

```bash
pnpm wrangler secret put COSENSE_SID
```

ローカル開発専用では、コミットしない`.dev.vars`へ設定します。

```dotenv
COSENSE_SID=your-connect.sid-value
```

検証とローカル実行は以下のとおりです。`pnpm check` はLint、型検証、ユニットテスト、Worker binding型の同期確認、デプロイ前バンドル検証をまとめて実行します。

```bash
pnpm check
pnpm wrangler dev --local
```

## Cloudflare Access Managed OAuthの設定

デプロイする準備ができた段階でのみ、次のコマンドを実行します。

```bash
pnpm run deploy
```

続いてCloudflare Zero Trustダッシュボードで、Workerのホスト名に対するAccess Applicationを作成します。

1. Workerのドメインおよび`/mcp`パスを対象に、**MCP server application**を作成します。
2. 対象Cosenseプロジェクトの利用を許可するユーザーまたはIDグループでAccess Policyを設定します。
3. Application Audience（AUD）Tagをコピーし、`CF_ACCESS_AUD`へ設定します。
4. Zero TrustのTeam Domainが`CF_ACCESS_TEAM_DOMAIN`と一致することを確認します。
5. ApplicationのAdvanced settingsで**Managed OAuth**を有効にします。
6. MCPクライアントへ`https://<worker-host>/mcp`を登録します。

Authorization Code Flow、PKCE、ログイン、リフレッシュトークン、OAuth discovery、Access PolicyはすべてCloudflare Accessが担当します。Worker自身はOAuthサーバーを実装しません。

Workerは`Cf-Access-Jwt-Assertion`を受け取り、TeamのJWKSエンドポイントを使ってRS256署名・issuer・AUDを検証した後にのみ、`/mcp`への要求をMCPハンドラーへ渡します。

Managed OAuth利用時のOAuth discovery情報はAccess層からクライアントへ返されます。Worker内にOAuthエンドポイントや独自の認可サーバーを追加しないでください。

## セキュリティ上の性質

- `COSENSE_SID`はSecret bindingとして扱い、JSONレスポンスやログに含めません。
- `/mcp`はAccess assertionがない、または無効な要求を`401`で拒否します。
- Access JWTは`https://<team-domain>/cdn-cgi/access/certs`で署名を検証し、issuerとAUDも検証します。
- `/mcp`のOriginは全許可です。Remote MCPクライアントとの互換性を優先しており、アクセス制御はCloudflare AccessのOAuthトークンとWorker内のJWT検証で行います。
- MCPツールのスキーマは未定義の入力を拒否するため、呼び出し側からプロジェクトや認証情報を上書きできません。
- Cosense側の任意のエラー内容をそのまま返さず、操作単位のエラーへ限定します。
- 意図せず巨大なレスポンスを返さないよう、ツール出力は100,000文字で上限を設けています。


## ディレクトリ構成

```text
src/
  config.ts                 Worker bindingの検証
  index.ts                  Honoルートとstateless MCP HTTP transport
  middleware/access-auth.ts Access JWTの検証
  mcp/server.ts             MCP SDK v2 server factory
  mcp/tools/                ツールごとのスキーマと登録処理
  cosense/client.ts         Cosense adapter
  cosense/formatter.ts      LLM向けページ整形
  cosense/insert-lines.ts   純粋な挿入位置計算
test/                       外部Cosense APIを呼ばないユニットテスト
```

## 参考資料

- [Cloudflare Agents MCP handler APIs](https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/)
- [Cloudflare Access Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/)
- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Cosense APIヘルプ](https://scrapbox.io/help-jp/API)

[yosider/cosense-mcp-server](https://github.com/yosider/cosense-mcp-server)に着想を得ています。本プロジェクトは同リポジトリのコードをコピーせず、Cloudflare Workers向けに新規実装したものです。
