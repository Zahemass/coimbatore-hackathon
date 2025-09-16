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

export async function updateCode(filePath, newCode) {
  console.log("🔧 updateCode called:", filePath); // debug log
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
  console.log("↩️ undoCode called:", filePath); // debug log
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
