// filename: parser.js
/**
 * Robust natural-language instruction parser.
 *
 * Examples it understands:
 *  - "test the login api in index.js"
 *  - "test /signup api in routes/auth.js"
 *  - "check GET /users api in server.js"
 *  - "test user settings api"
 *
 * Returns: { methods: ['get','post',...], file: 'index.js', endpoint: '/signup', raw: originalInstruction }
 */

export function parseInstruction(instruction = "") {
  const raw = String(instruction || "").trim();
  const lower = raw.toLowerCase();

  // ----- file extraction -----
  // match "in SOMEFILE.js" or "in path/to/SOMEFILE.js"
  let file = "index.js";
  const inMatch = raw.match(/\bin\s+([^\s"']+\.js)\b/i);
  if (inMatch && inMatch[1]) {
    file = inMatch[1];
  } else {
    // try to find a trailing js filename mention even without 'in'
    const altFile = raw.match(/([^\s"']+\.js)\b/);
    if (altFile && altFile[1]) file = altFile[1];
  }

  // ----- endpoint extraction -----
  // Several patterns tried in order — pick the first that matches.
  let endpoint = null;

  // pattern: "test the <word> api" -> capture <word>
  let m = raw.match(/\btest(?:ing)?(?: the| a| an)?\s+([a-zA-Z0-9_\/\-]+)\s+api\b/i);
  if (m && m[1]) endpoint = m[1];

  // pattern: "<method> /path api" or "GET /path api"
  if (!endpoint) {
    m = raw.match(/\b(?:get|post|put|delete|patch)\b\s+((?:\/[a-zA-Z0-9_\/\-]+)|[a-zA-Z0-9_\/\-]+)\s+api\b/i);
    if (m && m[1]) endpoint = m[1];
  }

  // pattern: "/path api" or "path api"
  if (!endpoint) {
    m = raw.match(/((?:\/[a-zA-Z0-9_\/\-]+)|[a-zA-Z0-9_\/\-]+)\s+api\b/i);
    if (m && m[1]) endpoint = m[1];
  }

  // fallback: look for words after "for" e.g. "for settings api"
  if (!endpoint) {
    m = raw.match(/\bfor\s+([a-zA-Z0-9_\/\-]+)\s+api\b/i);
    if (m && m[1]) endpoint = m[1];
  }

  // default
  if (!endpoint) endpoint = "signup";

  // ensure leading slash
  if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;

  // ----- methods detection -----
  const methods = [];
  if (/\bpost\b/i.test(lower)) methods.push("post");
  if (/\bput\b/i.test(lower)) methods.push("put");
  if (/\bget\b/i.test(lower)) methods.push("get");
  if (/\bdelete\b/i.test(lower)) methods.push("delete");
  if (/\bpatch\b/i.test(lower)) methods.push("patch");

  // if none specified → default to post + get (prefer post for APIs)
  if (methods.length === 0) methods.push("post", "get");

  return { methods, file, endpoint, raw };
}

export default parseInstruction;
