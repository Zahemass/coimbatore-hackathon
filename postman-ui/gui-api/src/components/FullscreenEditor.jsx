// postman-ui/client/src/components/FullscreenEditor.jsx
import React, { useEffect, useRef } from "react";
import axios from "axios";

export default function FullscreenEditor({

}) {
  const editorRef = useRef(null);
  const monacoInstance = useRef(null);

  // Initialize Monaco when fullscreen is open
  useEffect(() => {
    if (open && editorRef.current) {
      monacoInstance.current = monaco.editor.create(editorRef.current, {
        value: snippetCode || "// Fullscreen editor",
        language: "javascript",
        theme: "vs-dark",
        automaticLayout: true,
        fontFamily: "Montserrat",
        fontSize: 14,
      });

      monacoInstance.current.onDidChangeModelContent(() => {
        const newValue = monacoInstance.current.getValue();
        setSnippetCode(newValue);
      });
    }

