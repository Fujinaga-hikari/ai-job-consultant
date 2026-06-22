import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <nav className="nav">
      <div className="logo">
        <a href="https://mixjob.co.jp/" target="_blank" rel="noopener noreferrer">
          <Image src="/logo_mixjob.svg" alt="MixJob" width={150} height={38} priority />
        </a>
      </div>
      <div className="nav-links">
        <Link href="/" className="nav-link">求人を作成</Link>
        <Link href="/blog" className="nav-link">採用コラム</Link>
      </div>
    </nav>
  );
}
