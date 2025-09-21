// filename: utils/samplePayloads.js
export function getSamplePayload(endpoint) {
  if (endpoint.includes("login")) {
    return { email: "user@example.com", password: "Password123" };
  }
  if (endpoint.includes("signup")) {
  return { sample: "data" };
}
