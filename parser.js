// filename: parser.js
/**
 * Robust natural-language instruction parser.
 *
 * Examples it understands:
 *  - "test the login api in index.js"
 *  - "test /signup api in routes/auth.js"
 *  - "check GET /users api in server.js"
 *  - "test user settings api with id=123"
 *  - "test GET /users/:id api with query filter=active"
 *
 * Returns:
 *   {
 *     methods: ['get','post',...],
 *     file: 'index.js',
 *     endpoint: '/signup',
 *     params: { id: "123" },
 *     query: { filter: "active" },
 *     raw: originalInstruction
 *   }
 */

export function parseInstruction(instruction = "") {
  const raw = String(instruction || "").trim();
  const lower = raw.toLowerCase();

  // ----- file extraction -----
  let file = "index.js";
  const inMatch = raw.match(/\bin\s+([^\s"']+\.js)\b/i);
  if (inMatch && inMatch[1]) {
    file = inMatch[1];
  } else {
    const altFile = raw.match(/([^\s"']+\.js)\b/);
    if (altFile && altFile[1]) file = altFile[1];
  }

  // ----- endpoint extraction -----
  let endpoint = null;

  let m = raw.match(/\btest(?:ing)?(?: the| a| an)?\s+([a-zA-Z0-9_\/:\-]+)\s+api\b/i);
  if (m && m[1]) endpoint = m[1];

  if (!endpoint) {
    m = raw.match(/\b(?:get|post|put|delete|patch)\b\s+((?:\/[a-zA-Z0-9_\/:\-]+)|[a-zA-Z0-9_\/:\-]+)\s+api\b/i);
    if (m && m[1]) endpoint = m[1];
  }

  if (!endpoint) {
    m = raw.match(/((?:\/[a-zA-Z0-9_\/:\-]+)|[a-zA-Z0-9_\/:\-]+)\s+api\b/i);
    if (m && m[1]) endpoint = m[1];
  }

  if (!endpoint) {
    m = raw.match(/\bfor\s+([a-zA-Z0-9_\/:\-]+)\s+api\b/i);
    if (m && m[1]) endpoint = m[1];
  }

  if (!endpoint) endpoint = "signup";
  if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;

  // ----- methods detection -----
  const methods = [];
  if (/\bpost\b/i.test(lower)) methods.push("post");
  if (/\bput\b/i.test(lower)) methods.push("put");
  if (/\bget\b/i.test(lower)) methods.push("get");
  if (/\bdelete\b/i.test(lower)) methods.push("delete");
  if (/\bpatch\b/i.test(lower)) methods.push("patch");
  if (methods.length === 0) methods.push("post", "get");

  // ----- params extraction (path or inline mention) -----
  const params = {};
  const paramMatches = raw.match(/([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_-]+)/g);
  if (paramMatches) {
    paramMatches.forEach((pm) => {
      const [key, value] = pm.split("=").map((s) => s.trim());
      if (key && value) params[key] = value;
    });
  }

  // ----- query extraction (?key=value&key2=value2) -----
  const query = {};
  const queryMatch = raw.match(/\?([a-zA-Z0-9_=&-]+)/);
  if (queryMatch && queryMatch[1]) {
    const pairs = queryMatch[1].split("&");
    pairs.forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) query[k] = v || "";
    });
  }

  return { methods, file, endpoint, params, query, raw };
}

export default parseInstruction;
