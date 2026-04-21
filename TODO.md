# Vercel 前提リリース ToDo

採用担当者向け LP（AI 求人ドラフト生成 → 掲載サービス誘導）を **Vercel 上で運用する**ためのタスク一覧。  
DB は **Vercel Postgres / Neon**（接続済み）。メールは **Resend**（契約済み想定）。AI は **Gemini**（サーバー側のみ）。

---

## 1. アプリ／リポジトリ

- [x] Next.js（App Router）＋ API Routes で再構築（既存 `app.py` Streamlit は置き換え済み）
- [x] 本番ビルドが通る状態（`npm run build` 確認済み）
- [x] `README.md`：ローカル起動、環境変数、`vercel` デプロイ、DB マイグレーション手順
- [x] `.env.example`：`GEMINI_API_KEY`、`aiconsul_DATABASE_URL`、`RESEND_API_KEY`、`BASIC_AUTH_*` 等

---

## 2. Vercel プロジェクト

- [x] GitHub リポジトリと Vercel を連携
- [x] **本番・プレビュー**の環境変数を設定（`GEMINI_API_KEY`、`aiconsul_DATABASE_URL`、`BASIC_AUTH_*`）
- [ ] Node バージョンがプロジェクトと一致していることの確認
- [x] ベーシック認証を追加（環境変数で ON/OFF 可能）

---

## 3. データベース（Neon via Vercel）

- [x] Neon で Postgres を作成し、Vercel プロジェクトに接続
- [x] Prisma ORM とマイグレーションをリポジトリに含める（初期マイグレーション適用済み）
- [x] スキーマ：`GenerationLog`（生成ログ）、`Consultation`（リード／相談申込）
- [ ] 接続プーリング／サーバーレス向け設定をドキュメント化

---

## 4. ドメイン（企業サブドメイン）

- [ ] 掲載サービス側と **サブドメイン名** を合意（例：`tool.example.jp`）
- [ ] Vercel の「Domains」にサブドメインを追加し、表示される **DNS レコード** を IT に依頼
- [ ] 検証：HTTPS で LP が開くこと

---

## 5. メール（Resend）

- [ ] Resend で **送信ドメイン**（上記サブドメイン or 親ドメイン）を追加
- [ ] Resend が提示する **SPF / DKIM 等の DNS** を企業 DNS に登録（IT 依頼）
- [x] アプリ側：`RESEND_API_KEY` があるときだけ送信（未設定時は DB のみでリリース可）
- [x] トランザクションメール：受付確認テンプレ実装済み（社内通知 + ユーザー自動返信）
- [ ] マーケメールは受付確認と分離（必要なら別オプトイン）

---

## 6. AI（Gemini）

- [x] サーバー側 API のみで `GEMINI_API_KEY` を使用（クライアントに露出しない）
- [x] プロンプト：Markdown 見出し・太字ルール設定済み
- [ ] 下書きである旨の注意（過大表現を避ける）をプロンプトまたは UI に追加

---

## 7. LP／コンバージョン

- [x] ヒーロー：バナーテキスト＋ブランドカラーで訴求
- [x] 入力フォームは短く、生成は結果画面で読みやすく表示（react-markdown）
- [x] 主 CTA：無料相談への誘導を **生成直後** に配置
- [x] プライバシーポリシー・同意チェック（リードフォーム）
- [ ] 計測：GA4 イベント例 `generate_success` / `lead_submit`、キャンペーン用 **UTM** 運用ルール（任意）

---

## 8. セキュリティ・品質

- [x] 相談／リード API のバリデーション（Zod：メール形式、同意必須）
- [x] レート制限または乱用対策の検討（IP 単位日次3回上限、バースト制御、Geo 制限を実装）
- [ ] 生成文の注意書き（法令・求人票要件を満たす保証ではない等）

---

## 9. オプション（ドメイン／メール前の初期リリース）

- [x] `*.vercel.app` + ベーシック認証で先行リリース可能
- [ ] メール未設定時：Slack / Discord Webhook で社内通知（任意追加）

---

*最終更新: 2026-04-21（方針: Vercel + Neon Postgres + Resend + Gemini）*
