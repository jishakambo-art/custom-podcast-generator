"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUsageData } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface UsageEntry {
  generation_id: string;
  user_id: string;
  user_email: string;
  scheduled_at: string;
  status: string;
  notebook_id?: string;
  sources_used?: any;
  error_message?: string;
  daily_generation_enabled: boolean;
  generation_time: string;
  rss_sources: string[];
  news_topics: string[];
}

interface UsageData {
  total_generations: number;
  total_users: number;
  generations: UsageEntry[];
}

const ADMIN_EMAIL = "iamjishak@gmail.com";

export default function AdminUsagePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push("/");
    }
  }, [user, loading, router]);

  const { data: usageData, isLoading, error } = useQuery<UsageData>({
    queryKey: ["admin-usage"],
    queryFn: getUsageData,
    enabled: user?.email === ADMIN_EMAIL,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading usage data</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Usage Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor all users' podcast generations and settings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-gray-600 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">
              {usageData?.total_users || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-gray-600 text-sm mb-1">Total Generations</p>
            <p className="text-3xl font-bold text-gray-900">
              {usageData?.total_generations || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-gray-600 text-sm mb-1">Users with Daily Schedule</p>
            <p className="text-3xl font-bold text-gray-900">
              {usageData?.generations.filter((g, idx, arr) =>
                g.daily_generation_enabled &&
                arr.findIndex(x => x.user_id === g.user_id) === idx
              ).length || 0}
            </p>
          </div>
        </div>

        {/* Usage Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sources
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageData?.generations.map((entry) => (
                  <tr key={entry.generation_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.user_email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.user_id.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(entry.scheduled_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.scheduled_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          entry.status === "complete"
                            ? "bg-green-100 text-green-800"
                            : entry.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : entry.status === "generating"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.daily_generation_enabled ? (
                          <span className="text-green-600">✓ Enabled</span>
                        ) : (
                          <span className="text-gray-400">✗ Disabled</span>
                        )}
                      </div>
                      {entry.daily_generation_enabled && (
                        <div className="text-xs text-gray-500">
                          {entry.generation_time}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {entry.rss_sources.length > 0 && (
                          <div className="mb-1">
                            <span className="font-medium">RSS:</span>{" "}
                            {entry.rss_sources.slice(0, 2).join(", ")}
                            {entry.rss_sources.length > 2 && ` +${entry.rss_sources.length - 2} more`}
                          </div>
                        )}
                        {entry.news_topics.length > 0 && (
                          <div>
                            <span className="font-medium">Topics:</span>{" "}
                            {entry.news_topics.slice(0, 2).join(", ")}
                            {entry.news_topics.length > 2 && ` +${entry.news_topics.length - 2} more`}
                          </div>
                        )}
                        {entry.rss_sources.length === 0 && entry.news_topics.length === 0 && (
                          <span className="text-gray-400 italic">No sources</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!usageData?.generations || usageData.generations.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              No generation data available
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
