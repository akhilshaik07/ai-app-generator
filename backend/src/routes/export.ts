import { Router, Request, Response, NextFunction } from "express";
import { AppRegistry } from "../core/app-registry";
import { CodegenService } from "../services/codegen";
import { GithubService } from "../services/github";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/github", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, repoName, isPrivate, description, licenseTemplate, userGithubToken } = req.body;
    
    // Allow fallback to system token if available
    const token = userGithubToken || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
        return res.status(400).json({ error: "invalid_token", message: "Missing GitHub token" });
    }

    const config = await AppRegistry.get(appId);
    if (!config) {
        return res.status(404).json({ error: "Not Found", message: "App not found" });
    }

    const files = CodegenService.generateProjectFiles(config);

    try {
        const { repoUrl } = await GithubService.exportToRepo(token, repoName, isPrivate, description, licenseTemplate, files);
        res.status(200).json({ repoUrl, success: true });
    } catch (e: any) {
        if (e.message === "repo_exists") {
             return res.status(422).json({ error: "repo_exists", suggestion: `${repoName}-${Date.now()}` });
        }
        throw e;
    }
  } catch (error) {
    next(error);
  }
});

export default router;