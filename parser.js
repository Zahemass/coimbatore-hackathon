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
  }


  // Detect Bearer token if mentioned (e.g. "with token=abc123")
  let headers = {};
  const tokenMatch = raw.match(/\btoken\s*=\s*([A-Za-z0-9\._-]+)/i);
  if (tokenMatch) {
    headers["Authorization"] = `Bearer ${tokenMatch[1]}`;
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

    return { methods, file, endpoint, params, query, headers, raw };

}

export default parseInstruction;
