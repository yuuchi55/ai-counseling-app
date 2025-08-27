# AI カウンセリングシステム - デプロイメントガイド

## 概要
このドキュメントでは、AIカウンセリングシステムのデプロイ方法について説明します。

## サポートされているデプロイメント方法

### 1. Docker デプロイメント（推奨）

#### 必要な環境
- Docker 20.10以上
- Docker Compose 2.0以上
- 2GB以上のRAM

#### デプロイ手順
```bash
# 1. 環境変数の設定
cp .env.example .env
# .envファイルを編集して実際の値を設定

# 2. Dockerコンテナのビルドと起動
docker-compose up -d --build

# 3. ヘルスチェック
docker-compose ps
```

#### アクセス方法
- アプリケーション: http://localhost:3000
- MongoDB: mongodb://localhost:27017
- Redis: redis://localhost:6379

### 2. Vercel デプロイメント

#### 必要な環境
- Vercelアカウント
- Vercel CLI

#### デプロイ手順
```bash
# 1. Vercel CLIのインストール
npm install -g vercel

# 2. デプロイ
vercel --prod

# 3. 環境変数の設定（Vercelダッシュボード）
# - JWT_SECRET
# - MONGODB_URI
# - ENCRYPTION_KEY
# - GEMINI_API_KEY
```

### 3. Heroku デプロイメント

#### 必要な環境
- Herokuアカウント
- Heroku CLI

#### デプロイ手順
```bash
# 1. Herokuにログイン
heroku login

# 2. アプリケーションの作成
heroku create ai-counseling-system

# 3. MongoDBアドオンの追加
heroku addons:create mongolab

# 4. デプロイ
git push heroku main

# 5. 環境変数の設定
heroku config:set JWT_SECRET=your-secret-key
heroku config:set GEMINI_API_KEY=your-api-key
```

### 4. VPS デプロイメント

#### 必要な環境
- Ubuntu 20.04以上 または CentOS 8以上
- Node.js 18以上
- MongoDB 7.0以上
- Nginx（リバースプロキシ用）
- PM2（プロセス管理用）

#### デプロイ手順
```bash
# 1. 依存関係のインストール
sudo apt update
sudo apt install nodejs npm nginx mongodb

# 2. PM2のインストール
npm install -g pm2

# 3. アプリケーションのクローン
git clone https://github.com/your-repo/ai-counseling.git
cd ai-counseling

# 4. 依存関係のインストール
npm run install:all

# 5. ビルド
npm run build

# 6. PM2で起動
pm2 start backend/src/server.js --name ai-counseling
pm2 save
pm2 startup

# 7. Nginxの設定
sudo nano /etc/nginx/sites-available/ai-counseling
# 設定内容は下記参照

# 8. Nginxの再起動
sudo systemctl restart nginx
```

#### Nginx設定例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ローカル開発環境

### クイックスタート
```bash
# スクリプトを使用して起動
./scripts/start-local.sh
```

### 手動起動
```bash
# 1. 環境変数の設定
cp .env.example .env

# 2. 依存関係のインストール
npm run install:all

# 3. 開発サーバーの起動
npm run dev
```

## デプロイスクリプト

### 自動デプロイ
```bash
# Docker環境へのデプロイ
./scripts/deploy.sh production docker

# Vercelへのデプロイ
./scripts/deploy.sh production vercel

# Herokuへのデプロイ
./scripts/deploy.sh production heroku

# VPSへのデプロイ
./scripts/deploy.sh production vps
```

## 環境変数

必須の環境変数：
- `NODE_ENV`: 実行環境（development/production）
- `PORT`: サーバーポート番号
- `MONGODB_URI`: MongoDBの接続URL
- `JWT_SECRET`: JWT署名用のシークレットキー
- `ENCRYPTION_KEY`: データ暗号化用のキー
- `GEMINI_API_KEY`: Google Gemini APIキー
- `SESSION_SECRET`: セッション管理用のシークレットキー

## セキュリティ設定

### SSL/TLS設定
本番環境では必ずHTTPSを使用してください：
1. Let's Encryptを使用した無料SSL証明書の取得
2. Cloudflareを使用したSSL/TLSの設定
3. カスタムSSL証明書の設定

### ファイアウォール設定
```bash
# UFWを使用した例
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

## モニタリング

### ヘルスチェック
- エンドポイント: `/health`
- 期待されるレスポンス: `{ "status": "healthy" }`

### ログ管理
- アプリケーションログ: `/logs/app.log`
- エラーログ: `/logs/error.log`
- アクセスログ: `/logs/access.log`

## トラブルシューティング

### よくある問題

1. **MongoDBに接続できない**
   - MongoDB URLが正しいか確認
   - MongoDBサービスが起動しているか確認
   - ファイアウォール設定を確認

2. **ポート3000が既に使用されている**
   ```bash
   # 使用中のプロセスを確認
   sudo lsof -i :3000
   # プロセスを終了
   sudo kill -9 <PID>
   ```

3. **メモリ不足エラー**
   - Node.jsのメモリ制限を増やす
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

## バックアップとリストア

### バックアップ
```bash
# MongoDBのバックアップ
mongodump --uri="mongodb://localhost:27017/ai_counseling" --out=backup/

# アップロードファイルのバックアップ
tar -czf uploads_backup.tar.gz uploads/
```

### リストア
```bash
# MongoDBのリストア
mongorestore --uri="mongodb://localhost:27017/ai_counseling" backup/ai_counseling/

# アップロードファイルのリストア
tar -xzf uploads_backup.tar.gz
```

## サポート
問題が発生した場合は、以下の手順で対応してください：
1. ログファイルを確認
2. このドキュメントのトラブルシューティングセクションを参照
3. GitHubのIssuesで問題を報告