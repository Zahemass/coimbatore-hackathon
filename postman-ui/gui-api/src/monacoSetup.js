// postman-ui/client/src/monacoSetup.js
import * as monaco from "monaco-editor";

// Import workers properly with namespace import
import * as JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
    if (label === "json") return new JsonWorker();
    if (["css", "scss", "less"].includes(label)) return new CssWorker();
    if (["html", "handlebars", "razor"].includes(label)) return new HtmlWorker();
    if (["typescript", "javascript"].includes(label)) return new TsWorker();
    return new EditorWorker();
  },
};

export default monaco;
