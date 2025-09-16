import React from "react";
import { RefreshCw } from "lucide-react";

export default function HeaderBar({ showBack, onBack }) {
  return (
    <header className="headerbar">
      <div className="header-left">
        {showBack ? (
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
        ) : (
          <div className="title">Code Flow</div>
        )}
      </div>
      <div className="header-right">
        <button className="icon-btn">
          <RefreshCw />
        </button>
      </div>
    </header>
  );
}
