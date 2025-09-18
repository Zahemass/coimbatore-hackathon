// filename: HeaderBar.jsx
import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { githubPull, githubPush } from "../utils/api";

export default function HeaderBar({
  showBack,
  onBack,
  onReloadFlow,
  currentFile,
  currentCode,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [statusMsg, setStatusMsg] = useState(""); // ✅ status message
  const [statusType, setStatusType] = useState("info"); // success | error

  const showStatus = (msg, type = "info") => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(""), 5000); // ✅ auto-hide after 5s
  };

  const handlePull = async () => {
    try {
      const { files } = await githubPull("Zahemass", "flowchart-updates");
      console.log("📥 Pulled files:", files);
      onReloadFlow && onReloadFlow(files);
      showStatus("✅ GitHub pull successful!", "success");
    } catch (err) {
      showStatus("❌ Pull failed: " + err.message, "error");
    }
  };

  const handlePush = async () => {
    if (!currentFile || !currentCode) {
      showStatus("⚠️ No file selected to push!", "error");
      return;
    }

    try {
      const result = await githubPush({
        owner: "Zahemass",
        repo: "flowchart-updates",
        path: currentFile,
        message: `Update ${currentFile} from DudeCode`,
        content: currentCode,
      });
      console.log("✅ Push result:", result);
      showStatus("✅ Code pushed to GitHub!", "success");
    } catch (err) {
      showStatus("❌ Push failed: " + err.message, "error");
    }
  };

  return (
    <header
      className="headerbar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        background: "#111827",
        color: "#fff",
        position: "relative",
      }}
    >
      {/* Left side */}
      <div className="header-left" style={{ display: "flex", alignItems: "center" }}>
        {showBack ? (
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
        ) : (
          <div className="title">Code Flow</div>
        )}

        {/* ✅ Status message (appears left) */}
        {statusMsg && (
          <div
            style={{
              marginLeft: "15px",
              background: statusType === "success" ? "#16a34a" : "#dc2626", // green/red
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              transition: "opacity 0.5s ease",
              opacity: statusMsg ? 1 : 0,
            }}
          >
            {statusMsg}
          </div>
        )}
      </div>

      {/* Center - GitHub Button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: "#000",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🐙 GitHub
        </button>
        {showMenu && (
          <div
            style={{
              position: "absolute",
              top: "45px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1f2937",
              color: "#fff",
              padding: "10px",
              borderRadius: "6px",
              zIndex: 20,
              minWidth: "120px",
              textAlign: "center",
            }}
          >
            <button
              onClick={handlePull}
              style={{
                display: "block",
                width: "100%",
                margin: "5px 0",
                padding: "6px",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              📥 Pull
            </button>
            <button
              onClick={handlePush}
              style={{
                display: "block",
                width: "100%",
                margin: "5px 0",
                padding: "6px",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              📤 Push
            </button>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="header-right">
        <button className="icon-btn">
          <RefreshCw />
        </button>
      </div>
    </header>
  );
}
