import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeClient from "@/components/HomeClient";

export default function Home() {
  return (
    <div className="screen">
      <Header />

      {/* Static hero — server-rendered for SEO */}
      <section className="hero-static">
        <div className="hero-static-inner">
          <h1 className="hero-static-title">
            AIが求人原稿を<span className="accent">無料</span>で自動生成
          </h1>
          <p className="hero-static-desc">
            会社名・職種・業務内容を入力するだけで、応募者の心を掴む求人原稿をAIが3分で作成。
            採用担当者の工数を削減し、より多くの応募を集めましょう。
          </p>
          <ul className="hero-static-features">
            <li>
              <span className="feature-icon">✓</span>
              <span>完全無料・登録不要</span>
            </li>
            <li>
              <span className="feature-icon">✓</span>
              <span>職種・業種を問わず対応</span>
            </li>
            <li>
              <span className="feature-icon">✓</span>
              <span>採用のプロによる無料相談つき</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Interactive form — client component */}
      <HomeClient />

      {/* Static benefits — server-rendered for SEO */}
      <section className="benefits-static">
        <div className="benefits-inner">
          <h2 className="benefits-title">なぜAI求人作成コンサルタントが選ばれるのか</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>採用担当者の工数を大幅削減</h3>
              <p>
                求人原稿の作成に平均2〜3時間かかっていた作業を、AIが3分で完了。
                空いた時間を面接や候補者対応に充てられます。
              </p>
            </div>
            <div className="benefit-card">
              <h3>応募者に刺さるコピーをAIが生成</h3>
              <p>
                1,200社の採用実績データから学んだAIが、職種・ターゲットに合わせた
                表現で求人原稿を最適化。応募数の改善が期待できます。
              </p>
            </div>
            <div className="benefit-card">
              <h3>プロのコンサルタントに無料相談</h3>
              <p>
                AI生成後にワンクリックで採用のプロに相談依頼できます。
                媒体選びから採用戦略まで、初回相談は完全無料です。
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
