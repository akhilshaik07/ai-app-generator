import { Router, Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase";
import { localDb } from "../services/db";

const router = Router();

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    await localDb.saveSignup({
      email,
      userId: data.user?.id || null,
      provider: "email",
      metadata: data.user?.user_metadata || {},
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
});

router.post("/logout", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
});

import { requireAuth } from "../middleware/auth";

router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ user: (req as any).user });
    } catch (error) {
      next(error);
    }
});

export default router;
