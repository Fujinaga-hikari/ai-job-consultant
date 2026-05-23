import Image from "next/image";

export default function Header() {
  return (
    <nav className="nav">
      <div className="logo">
        <a href="https://mixjob.co.jp/" target="_blank" rel="noopener noreferrer">
          <Image src="/logo_mixjob.svg" alt="MixJob" width={150} height={38} priority />
        </a>
      </div>
    </nav>
  );
}
