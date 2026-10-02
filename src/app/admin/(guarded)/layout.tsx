import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, Clock, LogOut, FileText, Settings, Key, TableProperties } from "lucide-react";
import { clearAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  
  if (!session) {
    redirect("/admin/login");
  }

  async function handleLogout() {
    "use server";
    await clearAdminSession();
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-gray-900 border-r border-gray-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-800 gap-3">
          <Image
            src="/images/dashy-home-icon.svg"
            alt="Dashy Logo"
            width={32}
            height={32}
          />
          <span className="font-bold text-lg text-teal-400">Dashy Admin</span>
        </div>
        
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-900/50 flex items-center justify-center text-teal-400 font-bold border border-teal-500/30">
            {session.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">{session.username}</p>
            <p className="text-xs text-gray-500">{session.is_primary ? "Primary Admin" : "Admin"}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-800 transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-800 transition-colors">
            <Users className="w-5 h-5" />
            Staff & PINs
          </Link>
          <Link href="/dashy/roster" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-800 transition-colors">
            <TableProperties className="w-5 h-5" />
            Rosters
          </Link>
          <Link href="/dashy/attendance" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-800 transition-colors">
            <Clock className="w-5 h-5" />
            Live Attendance
          </Link>
          <Link href="/admin/logs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-800 transition-colors">
            <FileText className="w-5 h-5" />
            Audit Logs
          </Link>
          
          <div className="pt-4 mt-4 border-t border-gray-800">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Settings
            </p>
            {session.is_primary && (
              <Link href="/admin/settings/admins" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-800 transition-colors">
                <Key className="w-5 h-5" />
                Admin Accounts
              </Link>
            )}
            <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-800 transition-colors">
              <Settings className="w-5 h-5" />
              System Settings
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <form action={handleLogout}>
            <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-gray-100">Admin Console</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashy" className="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors">
              Exit to Dashy →
            </Link>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
