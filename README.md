# AI 求人作成コンサルタント — MixJob

企業がフォームに入力するだけで Google Gemini が魅力的な求人原稿（Markdown）を自動生成する Web アプリ。  
生成後に無料相談（リード獲得）への導線を設置し、申込データを DB に保存・メール通知を送信します。

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド & API | Next.js 16（App Router / Route Handlers） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| DB | PostgreSQL（Vercel Postgres / Neon） |
| ORM | Prisma |
| AI | Google Gemini 2.5 Flash（サーバーサイド専用） |
| メール | Resend |
| アクセス解析 | Vercel Analytics + 自前 PV/UU 計測（PageView テーブル） |
| ホスティング | Vercel |

---

## システム構成

```
ユーザー
 │
 ├─ [求人フォーム入力]
 │       ↓
 │   POST /api/generate
 │       ├─ IP レートリミット（3回/日、バースト1秒制限）
 │       ├─ Zod バリデーション
 │       ├─ 国別制限チェック（x-vercel-ip-country）
 │       ├─ Gemini API 呼び出し（サーバー側のみ）
 │       └─ GenerationLog を DB に保存
 │
 ├─ [相談フォーム入力]
 │       ↓
 │   POST /api/consultation
 │       ├─ Zod バリデーション（メール形式・同意チェック必須）
 │       ├─ Consultation を DB に保存
 │       └─ Resend でメール2通送信（管理者通知 + ユーザー自動返信）
 │               ※ メール失敗してもリクエスト成功（Promise.allSettled）
 │
 └─ [ページ表示]
         ↓
     POST /api/track（PV/UU 記録）
         └─ IP + UA を SHA-256 でハッシュ → PageView テーブルに保存

管理者
 └─ /admin（ログイン認証あり）
         ├─ ダッシュボード（KPI・グラフ）
         ├─ 問い合わせ一覧（CSV ダウンロード）
         └─ AI生成ログ一覧
```

---

## DB スキーマ

| モデル | 用途 |
|--------|------|
| `GenerationLog` | 求人生成の入力値と AI 出力結果 |
| `Consultation` | 無料相談申込（GenerationLog に紐付け可） |
| `RateLimit` | IP × 日付ごとのリクエスト数管理 |
| `PageView` | 日別 PV/UU 計測（IP+UA を SHA-256 でハッシュ化） |

---

## セキュリティポリシー

### 1. レートリミット（AI 生成 API）

| 制限 | 値 |
|------|----|
| 日次上限（IP 単位） | **3回 / 日** |
| バースト防止 | **1秒以内の連続リクエストをブロック** |
| 超過時のレスポンス | HTTP 429、日本語エラーメッセージ |

実装: `src/lib/rate-limit.ts` — PostgreSQL の `RateLimit` テーブルを使って IP × 日付で管理。
`x-forwarded-for` → `x-real-ip` の順でクライアント IP を取得。

### 2. 入力バリデーション

全 API エンドポイントで **Zod スキーマ**によるサーバーサイドバリデーションを実施。

- `generateSchema`: 企業名・職種・業務内容が必須。その他任意項目は空文字列にデフォルト。
- `consultationSchema`: メール形式チェック＋プライバシーポリシー同意（`agreed: true`）必須。

バリデーション失敗時は HTTP 400 とフィールド別エラーを返す。クライアント側の値は信頼しない。

### 3. 地域制限（Geo Restriction）

`ALLOWED_COUNTRIES` 環境変数（カンマ区切り ISO 3166-1 alpha-2）に国コードを設定すると、  
API ルート（`/api/*`）への海外アクセスを HTTP 403 で拒否。

- デフォルト値: `JP`（日本のみ）
- Vercel が付与する `x-vercel-ip-country` ヘッダーを使用（ローカル開発では判定をスキップ）

### 4. 管理画面認証

| 項目 | 仕様 |
|------|------|
| 認証方式 | Cookie ベース（httpOnly / Secure / SameSite=Lax） |
| セッション有効期限 | 7日間 |
| パスワード検証 | `crypto.timingSafeEqual` でタイミング攻撃を防止 |
| セッショントークン | `ADMIN_TOKEN`（ランダム 64 文字推奨）を Cookie 値として使用 |
| 未認証アクセス | `/admin/login` にリダイレクト |

`ADMIN_TOKEN` は `openssl rand -hex 32`（または PowerShell 等）で生成した推測不可能な文字列を使用すること。

### 5. 環境変数の分離

- `NEXT_PUBLIC_` プレフィックスを持つ変数のみブラウザに公開（現在は `NEXT_PUBLIC_SITE_URL` のみ）
- API キー・DB 接続文字列・管理者認証情報はすべてサーバーサイド専用
- Vercel ダッシュボードで機密変数を **Sensitive** に設定すること

### 6. プライバシー（PV/UU 計測）

PV/UU トラッキングは IP アドレスをそのまま保存せず、  
`SHA-256(IP + UserAgent)` のハッシュ値（`visitorId`）のみを保存する。  
個人を特定できる生の IP は DB に残らない。

---

## 悪意あるアクセスへの対応

### 無料求人生成の乱用防止

| 脅威 | 対策 |
|------|------|
| 同一 IP による大量生成 | 日次 3 回制限（`RateLimit` テーブル） |
| スクリプトによる連続リクエスト | 1秒バースト制限 |
| 海外ボットからのアクセス | 国別 IP 制限（`ALLOWED_COUNTRIES=JP`） |
| 不正な入力値（XSS・インジェクション） | Zod スキーマ検証 + Prisma パラメタライズドクエリ |

> **Gemini API コスト保護**: レートリミットが突破された場合でも、Gemini 側でもプロジェクト単位のクォータ制限を設定しておくことを推奨。

### 管理画面への不正アクセス防止

| 脅威 | 対策 |
|------|------|
| ブルートフォース攻撃 | `timingSafeEqual` でタイミング攻撃を防止 |
| セッション固定攻撃 | ログイン時に新規 Cookie を発行 |
| Cookie 盗聴 | `httpOnly` + `Secure`（本番のみ HTTPS 強制） |
| CSRF | `SameSite=Lax` + POST メソッド限定 |
| 検索エンジンインデックス | `/admin/*` に `robots: { index: false }` を設定 |

### リリース前の一時的なアクセス制限

本番公開前は **Basic 認証**（`BASIC_AUTH_USER` / `BASIC_AUTH_PASS`）でサイト全体をロック。  
木曜リリース時にこれらの環境変数を削除し Redeploy することで一般公開となる。  
管理画面の認証は Basic 認証とは独立して動作するため、リリース後も保護が継続される。

---

## ローカル起動

### 前提条件

- Node.js 20+
- PostgreSQL（ローカルまたはクラウド接続文字列）

### 手順

```bash
# 1. クローン
git clone https://github.com/<your-org>/ai-job-consultant.git
cd ai-job-consultant

# 2. 依存関係インストール
npm install

# 3. 環境変数を設定
cp .env.example .env
# .env を編集して実際の値を入力

# 4. DB に スキーマを反映
npx prisma db push

# 5. 開発サーバー起動
npm run dev
```

`http://localhost:3000` でアプリにアクセスできます。  
管理画面: `http://localhost:3000/admin`

---

## 環境変数一覧

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `aiconsul_DATABASE_URL` | PostgreSQL 接続文字列 | ✅ |
| `GEMINI_API_KEY` | Google Gemini API キー | ✅ |
| `BREVO_API_KEY` | Brevo API キー | ✅（メール送信時） |
| `EMAIL_FROM` | 送信元メールアドレス（Brevo 検証済み） | — |
| `NOTIFY_EMAIL` | 管理者通知先メールアドレス | — |
| `WEEKLY_REPORT_EMAIL` | 週次レポート送信先（未設定時は `NOTIFY_EMAIL`） | — |
| `CRON_SECRET` | Vercel Cron 認証用（`openssl rand -hex 32`） | ✅（週次レポート） |
| `ADMIN_USER` | 管理画面ログインユーザー名 | ✅ |
| `ADMIN_PASS` | 管理画面ログインパスワード | ✅ |
| `ADMIN_TOKEN` | セッション Cookie 値（ランダム文字列） | ✅ |
| `NEXT_PUBLIC_SITE_URL` | サイト URL（OGP canonical 用） | — |
| `ALLOWED_COUNTRIES` | 許可する国コード（例: `JP`） | — |
| `BASIC_AUTH_USER` | 一時的な全体ロック用ユーザー名 | — |
| `BASIC_AUTH_PASS` | 一時的な全体ロック用パスワード | — |

すべてのシークレットはサーバーサイド専用です（`NEXT_PUBLIC_SITE_URL` を除く）。

### 週次レポート（自動）

毎週月曜 9:00（JST）に Vercel Cron が `/api/cron/weekly-report` を実行します。

1. DB から PV / UU / 生成 / 問い合わせを集計
2. Gemini でサマリー・アクションプラン（A〜D 分類）を生成
3. `WEEKLY_REPORT_EMAIL`（または `NOTIFY_EMAIL`）へメール送信

**Vercel に追加する環境変数:** `CRON_SECRET`（本番・プレビュー両方）

手動実行:

```bash
npm run weekly-report
# または
curl -H "Authorization: Bearer $CRON_SECRET" https://lp.mixjob.co.jp/api/cron/weekly-report
```

メールに **「1はい / 2いいえ / 3保留」** で返信すると、Cursor で [A] 項目の実装に進めます。

---

## プロジェクト構成

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts          # 求人生成 API（レートリミット・Gemini 呼び出し）
│   │   ├── consultation/route.ts      # 相談申込 API（DB 保存・メール送信）
│   │   ├── track/route.ts             # PV/UU トラッキング API
│   │   └── admin/
│   │       ├── auth/login/route.ts    # 管理画面ログイン
│   │       ├── auth/logout/route.ts   # 管理画面ログアウト
│   │       └── leads/export/route.ts  # CSV エクスポート
│   ├── admin/
│   │   ├── layout.tsx                 # 管理画面レイアウト（ナビ）
│   │   ├── page.tsx                   # ダッシュボード（KPI・グラフ）
│   │   ├── login/page.tsx             # ログインページ
│   │   ├── leads/page.tsx             # 問い合わせ一覧
│   │   ├── generations/page.tsx       # AI生成ログ
│   │   ├── LogoutButton.tsx           # ログアウトボタン（Client Component）
│   │   └── components/
│   │       └── DashboardCharts.tsx    # グラフ（recharts）
│   ├── opengraph-image.tsx            # OG画像動的生成（1200×630）
│   ├── layout.tsx                     # ルートレイアウト（SEO・Analytics）
│   └── page.tsx                       # メインページ（SPA）
├── components/
│   ├── Header.tsx                     # ロゴ・バナー
│   ├── JobForm.tsx                    # 求人入力フォーム
│   ├── JobResult.tsx                  # 生成結果（Markdown 表示）
│   ├── ConsultationForm.tsx           # 相談申込フォーム
│   └── TrackPageView.tsx              # PV トラッキング（Client Component）
└── lib/
    ├── prisma.ts                      # Prisma クライアント（シングルトン）
    ├── gemini.ts                      # Gemini API ラッパー
    ├── email.ts                       # Resend メール送信（通知・自動返信）
    ├── rate-limit.ts                  # IP ベースのレートリミット
    └── validations.ts                 # Zod バリデーションスキーマ

prisma/
├── schema.prisma                      # DB スキーマ（4モデル）
└── migrations/                        # マイグレーション履歴
```

---

## Vercel デプロイ

```bash
# ビルドコマンド（Vercel に設定済み）
prisma generate && prisma db push && next build
```

デプロイのたびに `prisma db push` が実行され、スキーマ変更が自動で DB に反映される。

---

## メール送信フロー

```
相談申込
  ↓
POST /api/consultation
  ├─ DB 保存（Consultation レコード）
  └─ Promise.allSettled([
       sendNotificationEmail → NOTIFY_EMAIL 宛に申込内容を通知
       sendAutoReplyEmail    → 申込者に「最短即日ご連絡」の自動返信
     ])
     ※ メール失敗はサイレント（API レスポンスには影響しない）
```
