import React, { useEffect, useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import { fetchProjectFlow } from "../utils/api";
import FileNode from "./nodes/FileNode";

const nodeTypes = { fileNode: FileNode };

export default function ProjectFlow({ onFileClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
      if (onFileClick) onFileClick(node);
    },
    [onFileClick]
  );

  return (
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
  );
}
