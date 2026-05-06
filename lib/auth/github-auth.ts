import { supabase } from "../supabase-client";
import { apiClient } from "../api-client";

export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: "repo", // Request repo scope for GitHub export
    },
  });
  if (error) throw error;
  return data;
}

export async function exportToGitHub(
  appId: string,
  repoName: string,
  isPrivate: boolean,
  description: string,
  licenseTemplate?: string
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const providerToken = session?.provider_token;

  if (!providerToken) {
    throw new Error(
      "No GitHub access token found in session. Please sign in with GitHub."
    );
  }

  const res = await apiClient.post("/export/github", {
    appId,
    repoName,
    isPrivate,
    description,
    licenseTemplate,
    userGithubToken: providerToken,
  });

  return res.data;
}
