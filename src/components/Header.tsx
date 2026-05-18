import Image from "next/image";

export default function Header() {
  return (
    <nav className="nav">
      <div className="logo">
        <Image src="/logo_mixjob.svg" alt="MixJob" width={150} height={38} priority />
      </div>
    </nav>
  );
}
