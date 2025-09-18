// postman-ui/client/src/monacoSetup.js
import * as monaco from "monaco-editor";

// Import workers properly with namespace import
import * as JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import * as CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import * as HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import * as TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import * as EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

// Tell Monaco how to resolve workers
window.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") return new JsonWorker();
    if (["css", "scss", "less"].includes(label)) return new CssWorker();
    if (["html", "handlebars", "razor"].includes(label)) return new HtmlWorker();
    if (["typescript", "javascript"].includes(label)) return new TsWorker();
    return new EditorWorker();
  },
};

export default monaco;
