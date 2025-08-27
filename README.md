# AIカウンセリングシステム - 認証機能

## 🔐 概要
包括的なユーザー認証システムを実装したAIカウンセリングアプリケーション。JWT認証、セッション管理、セキュリティ機能を含む完全な認証ソリューションです。

## ✨ 機能

### 認証機能
- ✅ ユーザー登録（メール確認付き）
- ✅ ログイン/ログアウト
- ✅ JWT + リフレッシュトークン
- ✅ パスワードリセット
- ✅ プロフィール管理
- ✅ マルチデバイスセッション管理
- ✅ アカウント削除

### セキュリティ機能
- 🔒 パスワードハッシュ化（bcrypt）
- 🔒 レート制限
- 🔒 アカウントロック機能
- 🔒 CSRF保護
- 🔒 XSS保護（Helmet.js）
- 🔒 セッション管理

## 🛠️ 技術スタック

### バックエンド
- Node.js + Express.js
- MongoDB + Mongoose
- JWT認証
- bcrypt（パスワードハッシュ）
- Nodemailer（メール送信）

### フロントエンド
- React 18
- React Router v6
- Zustand（状態管理）
- React Hook Form
- Tailwind CSS
- Axios

## 📦 インストール

### 前提条件
- Node.js 16以上
- MongoDB
- npm または yarn

### セットアップ手順

1. **リポジトリのクローン**
```bash
git clone [repository-url]
cd AIカウンセリング
```

2. **バックエンドのセットアップ**
```bash
cd backend
npm install
cp .env.example .env
# .envファイルを編集して環境変数を設定
```

3. **フロントエンドのセットアップ**
```bash
cd frontend
npm install
```

4. **MongoDBの起動**
```bash
mongod
```

5. **開発サーバーの起動**

バックエンド:
```bash
cd backend
npm run dev
```

フロントエンド:
```bash
cd frontend
npm run dev
```

## 🔧 環境変数

`.env.example`を`.env`にコピーして以下を設定:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai_counseling

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASSWORD=your-app-password

# Frontend
CLIENT_URL=http://localhost:5173
```

## 📚 API エンドポイント

### 認証エンドポイント

| メソッド | エンドポイント | 説明 | 認証要否 |
|---------|---------------|------|----------|
| POST | `/api/auth/register` | 新規登録 | ❌ |
| POST | `/api/auth/login` | ログイン | ❌ |
| POST | `/api/auth/logout` | ログアウト | ✅ |
| POST | `/api/auth/logout-all` | 全デバイスからログアウト | ✅ |
| POST | `/api/auth/refresh-token` | トークン更新 | ❌ |
| GET | `/api/auth/verify-email/:token` | メール確認 | ❌ |
| POST | `/api/auth/password-reset` | パスワードリセット要求 | ❌ |
| POST | `/api/auth/password-reset/:token` | パスワードリセット実行 | ❌ |
| GET | `/api/auth/profile` | プロフィール取得 | ✅ |
| PUT | `/api/auth/profile` | プロフィール更新 | ✅ |
| POST | `/api/auth/change-password` | パスワード変更 | ✅ |
| DELETE | `/api/auth/account` | アカウント削除 | ✅ |
| GET | `/api/auth/check` | 認証状態確認 | ✅ |

## 🧪 テスト

```bash
cd backend
npm test
```

## 📝 使用例

### 登録
```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    username: 'user123',
    firstName: '太郎',
    lastName: '山田'
  })
});
```

### ログイン
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  })
});

const { accessToken, user } = await response.json();
localStorage.setItem('accessToken', accessToken);
```

### 認証が必要なリクエスト
```javascript
const response = await fetch('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

## 🚀 本番環境へのデプロイ

1. 環境変数を本番用に設定
2. HTTPSを有効化
3. MongoDBのレプリケーションセットを設定
4. Redis（オプション）でセッション管理を強化
5. ロードバランサーの設定

## 📄 ライセンス
MIT

## 🤝 コントリビューション
プルリクエスト歓迎です！

## 📧 サポート
問題が発生した場合は、Issueを作成してください。