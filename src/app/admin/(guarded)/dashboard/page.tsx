import { getAdminSession } from "@/lib/auth/session";
import { Users, Clock, TableProperties } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getAdminSession();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Welcome back, {session?.username}</h2>
        <p className="text-gray-400 mt-1">Here&apos;s what&apos;s happening at GameKing today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users" className="block group">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 transition-colors group-hover:border-teal-500/50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-200">Staff & PINs</h3>
            <p className="text-sm text-gray-400 mt-1">Manage employee accounts, view PINs, and update roles.</p>
          </div>
        </Link>

        <Link href="/dashy/attendance" className="block group">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 transition-colors group-hover:border-emerald-500/50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-200">Live Attendance</h3>
            <p className="text-sm text-gray-400 mt-1">View the PIN pad, action cards, and floor status.</p>
          </div>
        </Link>

        <Link href="/dashy/roster" className="block group">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 transition-colors group-hover:border-blue-500/50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <TableProperties className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-200">Shift Rosters</h3>
            <p className="text-sm text-gray-400 mt-1">Manage weekly schedules and shift assignments.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
