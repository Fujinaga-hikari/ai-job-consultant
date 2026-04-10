"use client";

import Image from "next/image";

export default function Header({ showBanner = true }: { showBanner?: boolean }) {
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
      {showBanner && (
        <div className="rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-brand text-2xl md:text-[1.7rem] lg:text-3xl font-bold mb-2 whitespace-nowrap">
            無料でAIコンサルタントが求人を作成します！
          </p>
          <p className="text-gray-500 text-lg">
            プロの求人ノウハウを凝縮した次世代AI。
            <br />
            あなたの会社の魅力を瞬時に言語化します。
          </p>
        </div>
      )}
    </header>
  );
}
