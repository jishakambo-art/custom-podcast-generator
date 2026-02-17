"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSchedulePreferences, updateSchedulePreferences, triggerGeneration } from "@/lib/api";

// Admin email - only this user sees admin features
const ADMIN_EMAIL = "iamjishak@gmail.com";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch current schedule status
  const { data: schedule } = useQuery({
    queryKey: ["schedule"],
    queryFn: getSchedulePreferences,
    enabled: !!user,
  });

  // Update local state when schedule data loads
  useEffect(() => {
    if (schedule) {
      setScheduleEnabled(schedule.daily_generation_enabled);
    }
  }, [schedule]);

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: updateSchedulePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    },
  });

  // Generate now mutation
  const generateMutation = useMutation({
    mutationFn: triggerGeneration,
    onSuccess: () => {
      router.push("/generations");
    },
  });

  const handleScheduleToggle = (checked: boolean) => {
    setScheduleEnabled(checked);
    updateScheduleMutation.mutate({
      daily_generation_enabled: checked,
      generation_time: "07:00",
      timezone: "America/Los_Angeles",
    });
  };

  const handleGenerateNow = () => {
    generateMutation.mutate();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-purple-gradient">
      <nav className="bg-white/90 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">DailyBrief 🎙️</h1>
          <div className="flex items-center gap-2">
            {user?.email && user.email === ADMIN_EMAIL && (
              <Link
                href="/admin/usage"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium px-4 py-2 rounded-lg hover:bg-purple-50 transition"
              >
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={signOut}
              className="text-sm text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Your Personalized Daily Podcast
          </h2>
          <p className="text-white/90">
            Configure your sources and generate your briefing
          </p>
        </div>

        {/* Step 1: Configuration */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
              1
            </div>
            <h2 className="font-semibold text-xl text-gray-900">Configure Your Sources</h2>
          </div>
          <p className="text-gray-600 text-sm mb-4 ml-11">
            Add RSS feeds and news topics to customize your daily podcast content
          </p>
          <div className="grid md:grid-cols-2 gap-4 ml-11">
            <Link
              href="/sources/rss"
              className="bg-white border-2 border-gray-200 p-4 rounded-lg shadow hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="text-2xl mb-2">📡</div>
              <h3 className="font-semibold text-gray-900 mb-1">RSS Feeds</h3>
              <p className="text-gray-600 text-sm">Add and manage RSS feeds</p>
            </Link>
            <Link
              href="/sources/topics"
              className="bg-white border-2 border-gray-200 p-4 rounded-lg shadow hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-1">News Topics</h3>
              <p className="text-gray-600 text-sm">Track companies and topics</p>
            </Link>
          </div>
        </div>

        {/* Step 2: NotebookLM Connection */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
              2
            </div>
            <h2 className="font-semibold text-xl text-gray-900">Connect to NotebookLM</h2>
          </div>
          <p className="text-gray-600 text-sm mb-4 ml-11">
            Download the desktop app to connect your NotebookLM account
          </p>
          <div className="ml-11">
            <Link
              href="/sources/notebooklm"
              className="inline-block bg-white border-2 border-gray-200 p-4 rounded-lg shadow hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="text-2xl mb-2">🎙️</div>
              <h3 className="font-semibold text-gray-900 mb-1">NotebookLM</h3>
              <p className="text-gray-600 text-sm">Connect your Google account</p>
            </Link>
          </div>
        </div>

        {/* Step 3: Generate & Schedule */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
              3
            </div>
            <h2 className="font-semibold text-xl text-gray-900">Generate Your Podcast</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6 ml-11">
            Generate a podcast now or schedule daily generation at 7:00 AM PST
          </p>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="ml-11 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-800 text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Schedule updated successfully!
              </div>
            </div>
          )}

          <div className="ml-11 space-y-4">
            {/* Generate Now Button */}
            <button
              onClick={handleGenerateNow}
              disabled={generateMutation.isPending}
              className="w-full btn-purple-gradient p-4 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">⚡</span>
                <span className="text-lg">
                  {generateMutation.isPending ? "Generating..." : "Generate Now"}
                </span>
              </div>
            </button>

            {/* Schedule Toggle */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-gray-900 mb-1">Schedule Daily at 7:00 AM PST</div>
                  <div className="text-sm text-gray-600">
                    Automatically generate a podcast every day at 7:00 AM Pacific Time
                  </div>
                </div>
                <div className="relative ml-4">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => handleScheduleToggle(e.target.checked)}
                    disabled={updateScheduleMutation.isPending}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-purple-600 transition peer-focus:ring-2 peer-focus:ring-purple-500 peer-focus:ring-offset-2 peer-disabled:opacity-50">
                    <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition peer-checked:translate-x-6"></div>
                  </div>
                </div>
              </label>
              {scheduleEnabled && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start text-sm text-gray-700">
                    <svg className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Your podcast will be automatically generated daily at 7:00 AM Pacific Time</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generation History */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg text-gray-900">Generation History</h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            View the history of your podcast generations and their status.
          </p>
          <Link
            href="/generations"
            className="text-purple-600 hover:text-purple-700 hover:underline text-sm font-medium"
          >
            View all generations →
          </Link>
        </div>
      </div>
    </main>
  );
}
