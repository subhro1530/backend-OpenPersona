import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import linksRoutes from "./routes/linksRoutes.js";
import projectsRoutes from "./routes/projectsRoutes.js";
import experienceRoutes from "./routes/experienceRoutes.js";
import educationRoutes from "./routes/educationRoutes.js";
import certificationsRoutes from "./routes/certificationsRoutes.js";
import skillsRoutes from "./routes/skillsRoutes.js";
import socialLinksRoutes from "./routes/socialLinksRoutes.js";
import testimonialsRoutes from "./routes/testimonialsRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : "*";
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get("/", (req, res) => {
  res.json({ message: "OpenPersona API", version: "1.0.0" });
});

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/certifications", certificationsRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/social-links", socialLinksRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
