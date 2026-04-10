# AI 求人作成コンサルタント

企業がフォームに入力するだけで、Google Gemini が魅力的な求人原稿（Markdown）を自動生成するWebアプリです。  
生成後に無料相談（リード獲得）への導線を設置し、申込データをDBに保存、メール通知を送信します。

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド & API | **Next.js 16** (App Router, Route Handlers) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| DB | **PostgreSQL** (Vercel Postgres / Neon) |
| ORM | **Prisma** |
| AI | **Google Gemini** (サーバーサイドのみ) |
| メール | **Resend** |
| ホスティング | **Vercel** |

## ローカル起動

### 前提条件

- Node.js 20+
- PostgreSQL（ローカルまたはクラウド）

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/<your-org>/ai-job-consultant.git
cd ai-job-consultant

# 2. 依存関係をインストール（Prisma Client も自動生成されます）
npm install

# 3. 環境変数を設定
cp .env.example .env
# .env を編集して実際の値を入力

# 4. DBマイグレーション
npx prisma migrate dev --name init

# 5. 開発サーバー起動
npm run dev
```

`http://localhost:3000` でアプリにアクセスできます。

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `aiconsul_DATABASE_URL` | PostgreSQL 接続文字列 | Yes |
| `GEMINI_API_KEY` | Google Gemini API キー | Yes |
| `RESEND_API_KEY` | Resend API キー | Yes |
| `EMAIL_FROM` | 送信元メールアドレス（Resend で検証済み） | No (default: `noreply@resend.dev`) |
| `NOTIFY_EMAIL` | 社内通知先メールアドレス | No |

すべてのシークレットは **サーバー側専用** です。クライアントには一切露出しません。

## DBマイグレーション

```bash
# 開発環境：マイグレーションファイルを作成して適用
npx prisma migrate dev --name <migration_name>

# 本番環境（Vercel）：マイグレーションを適用
npx prisma migrate deploy

# スキーマを直接 push（プロトタイピング用）
npx prisma db push

# DB GUI
npx prisma studio
```

### スキーマ概要

- **GenerationLog** — 求人生成の入力と結果を記録
- **Consultation** — 無料相談の申込情報（GenerationLog に紐付け可能）

## Vercel へのデプロイ

### 1. Vercel プロジェクト作成

```bash
# Vercel CLI でデプロイ
npx vercel
```

または Vercel ダッシュボードから GitHub リポジトリを接続。

### 2. 環境変数の設定

Vercel ダッシュボード > Settings > Environment Variables で以下を設定：

- `aiconsul_DATABASE_URL`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NOTIFY_EMAIL`

または CLI で設定：

```bash
vercel env add aiconsul_DATABASE_URL
vercel env add GEMINI_API_KEY
vercel env add RESEND_API_KEY
```

### 3. データベースのセットアップ

**Vercel Postgres を使う場合：**

1. Vercel ダッシュボード > Storage > Create Database > Postgres
2. プロジェクトに接続すると `aiconsul_DATABASE_URL` が自動設定される

**Neon を使う場合：**

1. [neon.tech](https://neon.tech) でプロジェクト作成
2. 接続文字列を `aiconsul_DATABASE_URL` に設定

### 4. マイグレーション実行

```bash
# ローカルから本番DBに対してマイグレーション
aiconsul_DATABASE_URL="<production_url>" npx prisma migrate deploy
```

### 5. Node.js バージョン

Vercel のデフォルト Node.js バージョン（20.x）で動作します。特別な `vercel.json` は不要です。

## メール送信

- **Resend** を使用（サンドボックスモードでは `onboarding@resend.dev` から送信可能）
- 社内通知メール：`NOTIFY_EMAIL` を設定すると、相談申込時に通知
- ユーザー自動返信：申込完了時に確認メールを送信
- メール送信失敗はリクエスト自体を失敗させません（`Promise.allSettled`）

## プロジェクト構成

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts    # 求人生成 API
│   │   └── consultation/route.ts # 相談申込 API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # メインページ
├── components/
│   ├── Header.tsx
│   ├── JobForm.tsx              # 入力フォーム
│   ├── JobResult.tsx            # 生成結果表示
│   └── ConsultationForm.tsx     # 相談申込フォーム
├── lib/
│   ├── prisma.ts                # Prisma クライアント
│   ├── gemini.ts                # Gemini API 呼び出し
│   ├── email.ts                 # Resend メール送信
│   └── validations.ts           # Zod バリデーション
└── generated/prisma/            # Prisma 生成コード（gitignore）

prisma/
├── schema.prisma                # DBスキーマ定義
└── migrations/                  # マイグレーションファイル
```
