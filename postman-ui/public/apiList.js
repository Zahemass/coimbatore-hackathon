const apiListEl = document.getElementById("apiList");

async function loadApiList() {
  try {
    const res = await fetch("/api-list");
    const apis = await res.json();
    apiListEl.innerHTML = "";
    apis.forEach(api => {
      const li = document.createElement("li");
      li.textContent = `${api.method.toUpperCase()} ${api.path}`;
      li.onclick = () => selectApi(api, li);
      apiListEl.appendChild(li);
    });
  } catch {
    apiListEl.innerHTML = "<li>Failed to load APIs</li>";
  }
}

function selectApi(api, li) {
  document.querySelectorAll("#apiList li").forEach(el => el.classList.remove("active"));
  li.classList.add("active");
  document.getElementById("url").value = `http://localhost:3000${api.path}`;
  document.getElementById("btn"+api.method.toUpperCase()).click();

  fetch(`/code?file=${api.file}&endpoint=${api.path}`)
    .then(r=>r.json())
    .then(j => editor.setValue(j.code || "// no snippet found"));
}

loadApiList();
