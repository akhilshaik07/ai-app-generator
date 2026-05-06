import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized", message: "Missing Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const token = authHeader.replace("Bearer ", "");
    supabase.auth.getUser(token).then(({ data: { user } }) => {
        if (user) {
            (req as any).user = user;
        }
        next();
    }).catch(() => next());
}