import Image from "next/image";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <Image src="/logo_mixjob.svg" alt="MixJob" width={130} height={32} />
          <p className="brand-blurb" style={{ maxWidth: 420 }}>
            採用のプロフェッショナルが監修した、求人原稿の生成AIサービス。1,200社の利用実績から学んだ「採用に効く言葉」を、3分で。
          </p>
        </div>
        <div>
          <h5>SERVICE</h5>
          <ul>
            <li><a>AI求人作成</a></li>
            <li><a>採用コンサル</a></li>
            <li><a>媒体運用代行</a></li>
          </ul>
        </div>
      </div>
      <div className="foot-copy">
        <span>© {new Date().getFullYear()} MixJob Inc. All rights reserved.</span>
      </div>
    </footer>
  );
}
