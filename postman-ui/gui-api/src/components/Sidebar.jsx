import React, { useEffect, useState } from "react";
import axios from "axios";
import RoutesPng from "../assets/routes.png";

export default function Sidebar({ setSnippetCode, setSnippetFile }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);
                style={{ cursor: "pointer" }}
                onClick={() => {
                  // optional: show dummy code when clicked
                  setSnippetCode?.(`// Example code for ${method} ${path}`);
                  setSnippetFile?.("dummy.js");
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div
                    className="request-method"
                    style={{
                      backgroundColor: method === "POST" ? "var(--method-color-post)" : "var(--method-color-get)"
                    }}
                  >
                    {method}
                  </div>

                  <div style={{ fontWeight: 700 }}>{path}</div>
                </div>
              </div>
            ))} */}

              {/*  */}
            </div>


          </aside>
        )}
      </div>
    </>
  );
}