// sample/index.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();

// allow CORS from GUI origin(s)
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(express.json());

// Load expected token from env.json (fallback to a hardcoded value)
function loadExpectedToken() {
  try {
    const p = path.join(process.cwd(), "env.json");
    if (fs.existsSync(p)) {
      const o = JSON.parse(fs.readFileSync(p, "utf-8"));
      if (typeof o.ACCESS_TOKEN !== "undefined") return o.ACCESS_TOKEN;
    }
  } catch (e) {
    console.warn("⚠️ Could not read env.json:", e.message);
  }
  return "my-secret-token-987"; // fallback expected token
}
const EXPECTED_TOKEN = loadExpectedToken();

// Helper to mask tokens in logs
function mask(t) {
  if (!t || typeof t !== "string") return String(t);
  if (t.length <= 8) return t;
  return `${t.slice(0, 3)}…${t.slice(-3)}`;
}

// Auth middleware
function authMiddleware(req, res, next) {
  const bodyToken = req.body && req.body.token;
  let headerToken = null;

  const authHeader = req.headers && req.headers.authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) headerToken = parts[1];
    else headerToken = authHeader;
  }

  const token = bodyToken || headerToken;

  console.log(
    `[auth] bodyToken=${mask(bodyToken)} headerToken=${mask(
      headerToken
    )} expected=${mask(EXPECTED_TOKEN)}`
  );

  if (!token) {
    return res.status(401).json({
      error:
        "Missing token (provide in request body as { token: '...' } or header Authorization: Bearer <token>)",
    });
  }

  if (token !== EXPECTED_TOKEN) {
    return res.status(401).json({ error: "Invalid token" });
  }

  next();
}

/* --------------------
   API routes
   -------------------- */

// Profile (works for both POST + GET now)
app.post("/profile", authMiddleware, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }
  res.json({
    userId,
    name: "Alice Example",
    email: "alice@example.com",
  });
});

app.get("/profile", authMiddleware, (req, res) => {
  // support query param like /profile?details=full
  const details = req.query.details || "basic";
  const baseUser = {
    id: 1,
    name: "Alice Example",
    email: "test@example.com",
  };

  if (details === "full") {
    return res.json({ ...baseUser, theme: "dark", role: "admin" });
  }
  res.json(baseUser);
});

// Settings
app.post("/settings", authMiddleware, (req, res) => {
  const { userId, theme } = req.body || {};
  if (!userId || !theme) {
    return res.status(400).json({ error: "Missing userId or theme" });
  }
  res.json({
    message: `Settings updated for user ${userId}`,
    theme,
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// Login (returns same token as env.json)
app.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  if (email === "test@example.com" && password === "Passw0rd!") {
    return res.json({
      message: "Login successful",
      token: EXPECTED_TOKEN,
      user: { id: 1, name: "Alice Example", email },
    });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

// Signup
app.post("/signup", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing name, email, or password" });
  }
  res.json({
    message: "Signup successful",
    user: { id: Date.now(), username, email },
  });
});

// --- New: Example with route param + query param
app.get("/users/:id", authMiddleware, (req, res) => {
  const userId = req.params.id;
  const expand = req.query.expand || "false";

  const base = { id: userId, name: `User${userId}` };
  if (expand === "true") {
    return res.json({ ...base, email: `user${userId}@example.com`, role: "tester" });
  }
  res.json(base);
});

/* --------------------
   Start server
   -------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dummy API running at http://localhost:${PORT}`);
  console.log(
    `ℹ️ Expected token for body/header auth (from env.json or fallback): ${mask(
      EXPECTED_TOKEN
    )}`
  );
});
