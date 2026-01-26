"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

interface NotebookLMStatus {
  authenticated: boolean;
  credentials?: {
    user_id: string;
    authenticated_at: string;
  };
}

async function getNotebookLMStatus(): Promise<NotebookLMStatus> {
  const response = await fetch("http://localhost:8000/auth/notebooklm/status");
  if (!response.ok) {
    throw new Error("Failed to check NotebookLM status");
  }
  return response.json();
}

async function authenticateNotebookLM(): Promise<any> {
  const response = await fetch(
    "http://localhost:8000/auth/notebooklm/authenticate",
    {
      method: "POST",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to authenticate with NotebookLM");
  }
  return response.json();
}

async function revokeNotebookLM(): Promise<any> {
  const response = await fetch("http://localhost:8000/auth/notebooklm/revoke", {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to revoke NotebookLM authentication");
  }
  return response.json();
}

export default function NotebookLMPage() {
  const queryClient = useQueryClient();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["notebooklm-status"],
    queryFn: getNotebookLMStatus,
  });

  const authMutation = useMutation({
    mutationFn: authenticateNotebookLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooklm-status"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeNotebookLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooklm-status"] });
    },
  });

  async function handleAuthenticate() {
    setIsAuthenticating(true);
    try {
      await authMutation.mutateAsync();
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            NotebookLM Connection
          </h1>
          <p className="text-gray-700 mt-1">
            Connect your Google account to generate podcasts via NotebookLM
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {!isLoading && status && (
          <div className="bg-white p-6 rounded-lg border">
            {!status.authenticated ? (
              <>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Connect to NotebookLM
                  </h2>
                  <p className="text-gray-700 mb-6">
                    Authenticate with your Google account to enable podcast
                    generation using NotebookLM's AI.
                  </p>

                  <button
                    onClick={handleAuthenticate}
                    disabled={isAuthenticating || authMutation.isPending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAuthenticating || authMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Authenticating...
                      </span>
                    ) : (
                      "Connect with Google"
                    )}
                  </button>

                  {authMutation.isError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      Authentication failed. Please try again.
                    </div>
                  )}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    What happens next?
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>A browser window will open for Google login</li>
                    <li>Sign in with your Google account</li>
                    <li>Grant NotebookLM access permissions</li>
                    <li>Your credentials will be stored securely</li>
                    <li>You can then generate podcasts automatically</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Connected to NotebookLM
                      </h2>
                      <p className="text-sm text-gray-700">
                        Your Google account is connected and ready to generate
                        podcasts
                      </p>
                    </div>
                  </div>
                </div>

                {status.credentials && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Connection Details
                    </h3>
                    <dl className="text-sm">
                      <div className="flex justify-between py-1">
                        <dt className="text-gray-700">Status:</dt>
                        <dd className="text-gray-900 font-medium">Active</dd>
                      </div>
                      <div className="flex justify-between py-1">
                        <dt className="text-gray-700">Connected:</dt>
                        <dd className="text-gray-900">
                          {new Date(
                            status.credentials.authenticated_at
                          ).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => revokeMutation.mutate()}
                    disabled={revokeMutation.isPending}
                    className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {revokeMutation.isPending
                      ? "Disconnecting..."
                      : "Disconnect Account"}
                  </button>
                </div>

                {revokeMutation.isSuccess && (
                  <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                    Account disconnected successfully
                  </div>
                )}

                {revokeMutation.isError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    Failed to disconnect account
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
