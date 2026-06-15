import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getLeads() {
  return prisma.consultation.findMany({
    orderBy: { createdAt: "desc" },
    include: { generationLog: { select: { jobTitle: true, companyName: true } } },
  });
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          問い合わせ一覧
          <span className="ml-2 text-base font-normal text-gray-400">({leads.length}件)</span>
        </h1>
        <a
          href="/api/admin/leads/export"
          className="inline-flex items-center gap-2 rounded-lg bg-[#e84730] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c73020] transition-colors"
        >
          CSV ダウンロード
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">申込日時</th>
              <th className="text-left px-4 py-3 font-medium">氏名</th>
              <th className="text-left px-4 py-3 font-medium">会社名</th>
              <th className="text-left px-4 py-3 font-medium">メール</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">希望連絡時間</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">生成した職種</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  まだ問い合わせはありません
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">{lead.name ?? "—"}</td>
                  <td className="px-4 py-3">{lead.companyName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${lead.email}`} className="text-[#e84730] hover:underline">
                      {lead.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{lead.preferredTime ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead.generationLog
                      ? `${lead.generationLog.jobTitle}（${lead.generationLog.companyName}）`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
