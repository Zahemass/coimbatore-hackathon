// filename: utils/api.js
const API_BASE = "http://localhost:5000";

export async function fetchProjectFlow() {
  const res = await fetch(`${API_BASE}/api/flow/project`);
  if (!res.ok) throw new Error("Failed to fetch project flow");
  return res.json();
}

export async function fetchFileFlow(path) {
  const url = `${API_BASE}/api/flow/file?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch file flow");
  return res.json();
}

export async function fetchExplanation(code) {
  const res = await fetch(`${API_BASE}/api/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Backend explanation error:", text);
    throw new Error("Failed to fetch explanation");
  }

  return res.json();
}

// ✅ AI Suggestion (complexity + one-line improvement)
export async function fetchSuggestion(code) {
  const res = await fetch(`${API_BASE}/api/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Backend suggestion error:", text);
    throw new Error("Failed to fetch suggestion");
  }

  const data = await res.json();
  console.log("📩 Suggestion response from backend:", data);
  return data;
}

// ✅ AI Refactor (returns optimized code only)
export async function fetchRefactor(code) {
  const res = await fetch(`${API_BASE}/api/refactor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Backend refactor error:", text);
    throw new Error("Failed to fetch refactored code");
  }

  const data = await res.json();
  console.log("📩 Refactor response from backend:", data);
  return data; // { refactoredCode: "optimized code here" }
}

export async function updateCode(filePath, newCode) {
  console.log("🔧 updateCode called:", filePath);
  const res = await fetch(`${API_BASE}/api/code/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath, newCode }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Backend updateCode error:", text);
    throw new Error("Failed to update code");
  }

  return res.json();
}

export async function undoCode(filePath) {
  console.log("↩️ undoCode called:", filePath);
  const res = await fetch(`${API_BASE}/api/code/undo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Backend undoCode error:", text);
    throw new Error("Failed to undo code");
  }

  return res.json();
}

export async function fetchFileFunctions(fileId) {
  const res = await fetch(`${API_BASE}/api/functions?file=${encodeURIComponent(fileId)}`);
  const data = await res.json();
  return data.functions;
}

// =============================
// ✅ NEW: GitHub Integration APIs
// =============================

// Pull latest repo files from GitHub (GET with query params ✅)
export async function githubPull(owner, repo, branch = "main") {
  const res = await fetch(
    `${API_BASE}/api/github/pull?owner=${owner}&repo=${repo}&branch=${branch}`
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Backend githubPull error:", text);
    throw new Error("Failed to pull from GitHub");
  }

  return res.json(); // { files: [...] }
}

// Push code changes to GitHub
export async function githubPush({ owner, repo, path, message, content, sha }) {
  const res = await fetch(`${API_BASE}/api/github/push`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner, repo, path, message, content, sha }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Backend githubPush error:", text);
    throw new Error("Failed to push to GitHub");
  }

  return res.json(); // { success: true, commit }
}
