import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getGenerations() {
  return prisma.generationLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { consultations: true } } },
    take: 200,
  });
}

export default async function GenerationsPage() {
  const logs = await getGenerations();

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">
        AI生成ログ
        <span className="ml-2 text-base font-normal text-gray-400">({logs.length}件)</span>
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">日時</th>
              <th className="text-left px-4 py-3 font-medium">企業名</th>
              <th className="text-left px-4 py-3 font-medium">職種</th>
              <th className="text-left px-4 py-3 font-medium">給与</th>
              <th className="text-left px-4 py-3 font-medium">勤務地</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">相談申込</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  まだ生成ログはありません
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.companyName}</td>
                  <td className="px-4 py-3">{log.jobTitle}</td>
                  <td className="px-4 py-3 text-gray-500">{log.salary ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{log.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    {log._count.consultations > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        あり
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
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
