"use client";

import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full pt-8 pb-4">
      <div className="flex justify-center mb-8">
        <Image
          src="/logo_mixjob.svg"
          alt="MixJob"
          width={280}
          height={70}
          priority
        />
      </div>
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <p className="text-brand text-2xl md:text-3xl font-bold mb-2">
          無料でAIコンサルタントが求人を作成します！
        </p>
        <p className="text-gray-500 text-lg">
          プロの求人ノウハウを凝縮した次世代AI。あなたの会社の魅力を瞬時に言語化します。
        </p>
      </div>
    </header>
  );
}
