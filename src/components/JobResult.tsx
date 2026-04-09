"use client";

import ReactMarkdown from "react-markdown";

type Props = {
  markdown: string;
};

export default function JobResult({ markdown }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg font-medium">
        求人原稿が完成しました！
      </div>

      <div className="article-box prose prose-lg max-w-none">
        <ReactMarkdown
          components={{
            h3: ({ children }) => (
              <h3 className="text-brand border-l-4 border-brand pl-4 mt-8 mb-3 text-xl font-bold">
                {children}
              </h3>
            ),
            strong: ({ children }) => (
              <strong className="text-gray-900 highlight-text">{children}</strong>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 space-y-1">{children}</ul>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
