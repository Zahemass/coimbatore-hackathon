// filename: index.js
import express from "express";

const app = express();
app.use(express.json());

// Middleware to check token
function authMiddleware(req, res, next) {
  const { token } = req.body;
  if (token !== "my-secret-token-987") {
    return res.status(401).json({ error: "Invalid or missing token" });
  }
  next();
}

// Profile API
app.post("/profile", authMiddleware, (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }
  res.json({
    userId,
    name: "Alice Example",
    email: "alice@example.com",
  });
});

// Settings API
app.post("/settings", authMiddleware, (req, res) => {
  const { userId, theme } = req.body;
  if (!userId || !theme) {
    return res.status(400).json({ error: "Missing userId or theme" });
  }
  res.json({
    message: `Settings updated for user ${userId}`,
    theme,
  });
});



// Simple health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// Dummy login API
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  if (email === "test@example.com" && password === "Passw0rd!") {
    return res.json({
      message: "Login successful",
      token: "dummy-jwt-token-123",
      user: { id: 1, name: "Alice Example", email },
    });
  }

  res.status(401).json({ error: "Invalid credentials" });
});

// Dummy signup API
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing name, email, or password" });
  }

  res.json({
    message: "Signup successful",
    user: { id: Date.now(), name, email },
  });
});

// Profile API (requires dummy token)
app.get("/profile", (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== "Bearer dummy-jwt-token-123") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({
    id: 1,
    name: "Alice Example",
    email: "test@example.com",
    theme: "dark",
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dummy API running at http://localhost:${PORT}`);
});
