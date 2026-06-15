import Link from "next/link";
import AdminLogoutButton from "../LogoutButton";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 flex-wrap">
        <span className="font-bold text-[#e84730] text-lg">MixJob 管理</span>
        <Link href="/admin" className="text-sm text-gray-600 hover:text-[#e84730] transition-colors">
          ダッシュボード
        </Link>
        <Link href="/admin/leads" className="text-sm text-gray-600 hover:text-[#e84730] transition-colors">
          問い合わせ一覧
        </Link>
        <Link href="/admin/generations" className="text-sm text-gray-600 hover:text-[#e84730] transition-colors">
          生成ログ
        </Link>
        <Link href="/admin/articles" className="text-sm text-gray-600 hover:text-[#e84730] transition-colors">
          ブログ記事
        </Link>
        <div className="ml-auto">
          <AdminLogoutButton />
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
