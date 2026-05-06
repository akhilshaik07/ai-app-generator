"use client";

import React, { useRef, memo } from "react";
import MonacoEditor, { useMonaco, OnMount } from "@monaco-editor/react";
import { useAppStore } from "../../store/use-app-store";

const Editor = memo(function Editor() {
  const rawConfig = useAppStore(state => state.rawConfig);
  const setRawConfig = useAppStore(state => state.setRawConfig);
  const applyConfigLocally = useAppStore(state => state.applyConfigLocally);
  useMonaco();
  const editorRef = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync external changes (e.g., loading a template) into the editor
  React.useEffect(() => {
    if (editorRef.current && rawConfig !== editorRef.current.getValue()) {
      editorRef.current.setValue(rawConfig);
    }
  }, [rawConfig]);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      applyConfigLocally(value);
      // We also update rawConfig so if component unmounts/remounts it remembers
      setRawConfig(value);
    }, 600);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define precision light theme
    monaco.editor.defineTheme("precision-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "string.key.json", foreground: "0f1117", fontStyle: "bold" },
        { token: "string.value.json", foreground: "666666" },
        { token: "number", foreground: "0f1117" },
        { token: "keyword.json", foreground: "0f1117" },
      ],
      colors: {
        "editor.background": "#fffefa",
        "editorGutter.background": "#fffefa",
        "editorLineNumber.foreground": "#cccccc",
        "editor.lineHighlightBackground": "#f4f2ec",
        "editor.selectionBackground": "rgba(0,0,0,0.08)",
        "minimap.background": "#fffefa",
      }
    });

    monaco.editor.setTheme("precision-light");

    // Format on paste
    editor.onDidPaste(() => {
      setTimeout(() => {
        editor.getAction("editor.action.formatDocument")?.run()?.catch(() => {});
      }, 0);
    });

    // Key binding Ctrl/Cmd + Enter -> Apply config using global store if needed
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#fffefa]">
      <div className="flex-1 min-h-0 relative">
        <MonacoEditor
          height="100%"
          language="json"
          defaultValue={rawConfig}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            renderLineHighlight: "line",
            padding: { top: 16 },
            renderWhitespace: "none",
            renderControlCharacters: false,
            quickSuggestions: false,
            disableLayerHinting: true,
            'semanticHighlighting.enabled': false,
            parameterHints: { enabled: false },
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: 'off',
          }}
        />
      </div>
    </div>
  );
});

export { Editor };
export default Editor;
