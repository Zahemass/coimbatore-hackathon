// filename: utils/samplePayloads.js
export function getSamplePayload(endpoint) {
  if (endpoint.includes("login")) {
    return { email: "user@example.com", password: "Password123" };
  }
  if (endpoint.includes("signup")) {
    return { name: "Test User", email: "new@example.com", password: "Password123" };
  }
  if (endpoint.includes("profile")) {
    return { userId: "12345", bio: "Hello world" };
  }
  return { sample: "data" };
}
