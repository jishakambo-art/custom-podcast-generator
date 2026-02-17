"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getGeneration } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface RSSEntry {
  title: string;
  summary: string;
  content?: string;
  link: string;
}

interface RSSSource {
  feed_url: string;
  feed_name: string;
  entries: RSSEntry[];
}

interface TopicSource {
  topic: string;
  summary: string;
}

interface Generation {
  id: string;
  scheduled_at: string;
  status: "scheduled" | "fetching" | "generating" | "complete" | "failed";
  sources_used?: {
    details?: {
      rss?: RSSSource[];
      topics?: TopicSource[];
    };
  };
}

export default function SourcesPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const { data: generation, isLoading } = useQuery<Generation>({
    queryKey: ["generation", params.id],
    queryFn: () => getGeneration(params.id),
  });

  const rssources = generation?.sources_used?.details?.rss || [];
  const topics = generation?.sources_used?.details?.topics || [];

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href={`/generations/${params.id}`}
            className="text-gray-700 hover:text-gray-900"
          >
            ← Back to Generation Details
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {generation && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sources Used
              </h1>
              <p className="text-gray-700">
                Generated on{" "}
                {new Date(generation.scheduled_at).toLocaleDateString("en-US", {
                  timeZone: "America/Los_Angeles",
                  dateStyle: "long",
                })}
              </p>
            </div>

            {/* RSS Sources */}
            {rssources.length > 0 && (
              <div className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    RSS Feeds ({rssources.length})
                  </h2>
                </div>
                <div className="divide-y">
                  {rssources.map((source, idx) => (
                    <div key={idx} className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        {source.feed_name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-4 font-mono break-all">
                        {source.feed_url}
                      </p>
                      {source.entries.length > 0 ? (
                        <div className="space-y-4">
                          {source.entries.map((entry, entryIdx) => (
                            <div
                              key={entryIdx}
                              className="pl-4 border-l-2 border-gray-200"
                            >
                              <h4 className="font-medium text-gray-900 mb-2">
                                {entry.title}
                              </h4>
                              {entry.summary && (
                                <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                                  {entry.summary}
                                </div>
                              )}
                              {entry.content && (
                                <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap prose prose-sm max-w-none">
                                  {entry.content}
                                </div>
                              )}
                              {entry.link && (
                                <a
                                  href={entry.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-block mt-2"
                                >
                                  Read more →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 italic">
                          No entries from this feed
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* News Topics */}
            {topics.length > 0 && (
              <div className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    News Topics ({topics.length})
                  </h2>
                </div>
                <div className="divide-y">
                  {topics.map((topic, idx) => (
                    <div key={idx} className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        {topic.topic}
                      </h3>
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                        {topic.summary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rssources.length === 0 && topics.length === 0 && (
              <div className="bg-white p-8 rounded-lg border text-center">
                <p className="text-gray-700">
                  No detailed source information available for this generation.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
