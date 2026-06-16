export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Markdown content から ## よくある質問 セクションの Q&A ペアを抽出する。
 * Gemini に指定したフォーマット:
 *   ### Q: 質問文
 *   A: 回答文
 */
export function parseFaq(content: string): FaqItem[] {
  const sectionMatch = content.match(/## よくある質問\s*([\s\S]*?)(?=\n## |\s*$)/);
  if (!sectionMatch) return [];

  const section = sectionMatch[1];
  const pairs: FaqItem[] = [];
  let currentQ = "";

  for (const line of section.split("\n")) {
    const qMatch = line.match(/^###\s+Q[:：]\s*(.+)/);
    const aMatch = line.match(/^A[:：]\s*(.+)/);
    if (qMatch) {
      currentQ = qMatch[1].trim();
    } else if (aMatch && currentQ) {
      pairs.push({ q: currentQ, a: aMatch[1].trim() });
      currentQ = "";
    }
  }

  return pairs;
}
