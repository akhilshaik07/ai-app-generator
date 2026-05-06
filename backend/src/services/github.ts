import { Octokit } from "@octokit/rest";

export class GithubService {
  static async exportToRepo(
    token: string, 
    repoName: string, 
    isPrivate: boolean, 
    description: string | undefined,
    licenseTemplate: string | undefined,
    files: Map<string, string>
  ): Promise<{ repoUrl: string }> {
    const octokit = new Octokit({ auth: token });

    // 1. Create repo
    let repoUrl = "";
    let defaultBranch = "main";
    try {
      const { data: repo } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: isPrivate,
        description: description,
        license_template: licenseTemplate,
        auto_init: true
      });
      repoUrl = repo.html_url;
      defaultBranch = repo.default_branch;
    } catch (e: any) {
      if (e.status === 422) {
        throw new Error("repo_exists");
      }
      throw e;
    }

    // Since auto_init is true, there is a first commit. Get reference to branch
    const { data: { login: owner } } = await octokit.users.getAuthenticated();
    
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${defaultBranch}`
    });
    
    const baseTreeSha = refData.object.sha;

    // 2. Create blobs and gather tree structure
    const tree: any[] = [];
    for (const [path, content] of files) {
        const { data: blobInfo } = await octokit.git.createBlob({
            owner,
            repo: repoName,
            content,
            encoding: "utf-8"
        });
        tree.push({
            path,
            mode: "100644",
            type: "blob",
            sha: blobInfo.sha
        });
    }

    // 3. Create tree
    const { data: treeData } = await octokit.git.createTree({
        owner,
        repo: repoName,
        tree,
        base_tree: baseTreeSha
    });

    // 4. Create commit
    const { data: commitData } = await octokit.git.createCommit({
        owner,
        repo: repoName,
        message: "Initial commit by AI App Generator",
        tree: treeData.sha,
        parents: [baseTreeSha]
    });

    // 5. Update ref
    await octokit.git.updateRef({
        owner,
        repo: repoName,
        ref: `heads/${defaultBranch}`,
        sha: commitData.sha
    });

    return { repoUrl };
  }
}