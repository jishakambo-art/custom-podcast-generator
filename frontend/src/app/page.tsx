"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">DailyBrief</h1>
          <span className="text-sm text-gray-700 font-medium">Demo Mode</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Personalized Daily Podcast
          </h2>
          <p className="text-gray-700">
            Configure your sources and generate your briefing
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/sources/substack"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">📰</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">Substack</h2>
            <p className="text-gray-700 text-sm">
              Manage your newsletter subscriptions
            </p>
          </Link>
          <Link
            href="/sources/rss"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">📡</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">RSS Feeds</h2>
            <p className="text-gray-700 text-sm">Add and manage RSS feeds</p>
          </Link>
          <Link
            href="/sources/topics"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">News Topics</h2>
            <p className="text-gray-700 text-sm">
              Track companies and topics
            </p>
          </Link>
          <Link
            href="/sources/notebooklm"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">🎙️</div>
            <h2 className="font-semibold text-lg mb-2 text-gray-900">NotebookLM</h2>
            <p className="text-gray-700 text-sm">
              Connect your Google account
            </p>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-lg text-gray-900">Recent Generations</h2>
            <div className="flex gap-3">
              <button
                onClick={() => {/* Dummy button - does nothing */}}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Generate Daily
              </button>
              <Link
                href="/generate"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm"
              >
                Generate Now
              </Link>
            </div>
          </div>
          <Link
            href="/generations"
            className="text-blue-600 hover:underline text-sm"
          >
            View all generations →
          </Link>
        </div>
      </div>
    </main>
  );
}
