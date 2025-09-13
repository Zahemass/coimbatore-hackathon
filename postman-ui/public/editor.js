let editor;
require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs" }});
require(["vs/editor/editor.main"], () => {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: "// select an API from left",
    language: "javascript",
    theme: "vs-dark",
    automaticLayout: true
  });
});

document.getElementById("saveCodeBtn").onclick = async () => {
  const active = document.querySelector("#apiList li.active");
  if (!active) return alert("Select API first");
  const code = editor.getValue();
  const [method, path] = active.textContent.split(" ");
  await fetch("/save-code", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ path, code })
  });
  alert("Saved!");
};

document.getElementById("rollbackBtn").onclick = async () => {
  const active = document.querySelector("#apiList li.active");
  if (!active) return alert("Select API first");
  const [method, path] = active.textContent.split(" ");
  const res = await fetch("/rollback", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ path })
  });
  const j = await res.json();
  editor.setValue(j.code || "// rollback failed");
};
