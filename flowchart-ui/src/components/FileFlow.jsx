// filename: FileFlow.jsx
import React, { useEffect, useCallback } from "react";
import ReactFlow, {
 
} from "reactflow";
import "reactflow/dist/style.css";
import NodeSmall from "./nodes/NodeSmall";
import FileNode from "./nodes/FileNode";

const nodeTypes = { small: NodeSmall, fileNode: FileNode };

export default function FileFlow({ fileNode, onSelectSymbol, githubFiles }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // ✅ Case 1: If we pulled from GitHub, build nodes directly
    if (githubFiles && githubFiles.length > 0) {
      const subNodes = githubFiles.map((f, idx) => ({
