import React, { useEffect, useCallback, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import { fetchProjectFlow } from "../utils/api";
import FileNode from "./nodes/FileNode";

const nodeTypes = { fileNode: FileNode };

export default function ProjectFlow({ onFileClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetchProjectFlow()
      .then((d) => {
        const normalized = (d.nodes || []).map((n) => ({
          ...n,
          type: n.type || "fileNode",
        }));
        setNodes(normalized);
        setEdges(d.edges || []);
      })
      .catch((err) => console.error(err));
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_, node) => {
      setIsFocused(true);
      if (onFileClick) onFileClick(node);
    },
    [onFileClick]
  );

  const handleBack = () => {
    setIsFocused(false);
    fetchProjectFlow()
      .then((d) => {
        const normalized = (d.nodes || []).map((n) => ({
          ...n,
          type: n.type || "fileNode",
        }));
        setNodes(normalized);
        setEdges(d.edges || []);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {isFocused && (
        <button
          onClick={handleBack}
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 10,
            background: "#1f2937",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        style={{ width: "100%", height: "100%" }}
      >
        <Background gap={16} color="#1f2937" />
        <MiniMap nodeStrokeWidth={2} maskColor="rgba(0,0,0,0.6)" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
