// filename: HeaderBar.jsx
import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { githubPull, githubPush } from "../utils/api";

export default function HeaderBar({
  showBack,
  
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [statusMsg, setStatusMsg] = useState(""); // ✅ status message
  const [statusType, setStatusType] = useState("info"); // success | error

  const showStatus = (msg, type = "info") => {
    setStatusMsg(msg);
  
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
            {stat
        </button>
      </div>
    </header>
  );
}
