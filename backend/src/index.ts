import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Routes imports
import configRouter from "./routes/config";
import dynamicRouter from "./routes/dynamic";
import appsRouter from "./routes/apps";
import exportRouter from "./routes/export";
import csvRouter from "./routes/csv";
import authRouter from "./routes/auth";
import formsRouter from "./routes/forms";
import activityRouter from "./routes/activity";

const app = express();

const port = process.env.BACKEND_PORT || process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));

// We are assuming a dev environment mostly, unless NODE_ENV specifies otherwise
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsers with 10MB limit for large configs + CSV
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Root route
app.get("/", (req, res) => {
  res.status(200).json({ message: "AI Studio Backend API - use /api/v1/* endpoints" });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Mounted routes
app.use("/api/v1/config", configRouter);
app.use("/api/v1/dynamic", dynamicRouter);
app.use("/api/v1/forms", formsRouter);
app.use("/api/v1/apps", appsRouter);
app.use("/api/v1/export", exportRouter);
app.use("/api/v1/csv", csvRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", activityRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Error Handler caught an error:", err);
  
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Bad Request", message: "Malformed JSON body" });
  }

  // Handle Supabase/Postgrest errors generically if needed
  if (err.code && typeof err.code === "string" && err.code.startsWith("22")) {
     return res.status(400).json({ error: "Database Error", message: err.message, detail: err.details });
  }
  
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Unauthorized", message: err.message });
  }

  return res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message || "An unexpected error occurred",
    detail: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
