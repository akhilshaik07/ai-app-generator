import { Router, Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase";

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password required'
      })
    }

    // Use Supabase Auth directly — don't insert manually
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(201).json({
      success: true,
      user: data.user,
      message: 'Account created successfully'
    })

  } catch (err: any) {
    console.error('Register error:', err)
    return res.status(500).json({ error: err.message })
  }
})

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
