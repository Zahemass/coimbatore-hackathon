export function parseInstruction(instruction) {
  instruction = instruction.toLowerCase();

  // crude regex to extract file
  const fileMatch = instruction.match(/in (.+\.js)/);
  const file = fileMatch ? fileMatch[1] : "index.js";

  // crude regex to extract endpoint
  const endpointMatch = instruction.match(/(\b[a-zA-Z0-9/_-]+)\s*api/);
  let endpoint = endpointMatch ? endpointMatch[1] : "/signup";

  // ✅ ensure it starts with a slash
  if (!endpoint.startsWith("/")) {
    endpoint = "/" + endpoint;
  }

  // determine methods
  let methods = [];
  if (instruction.includes("post")) methods.push("post");
  if (instruction.includes("get")) methods.push("get");

  // if user didn’t specify → assume both
  if (methods.length === 0) methods = ["get", "post"];

  return { methods, file, endpoint };
}
