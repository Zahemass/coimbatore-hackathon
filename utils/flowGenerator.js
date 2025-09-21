// utils/flowGenerator.js
import fs from "fs";
import * as acorn from "acorn";
    route.handlers.forEach((handler, hIndex) => {
      const handlerId = `${routeId}-handler-${hIndex}`;
      nodes.push({
        id: handlerId,
        data: {
          label: handler.name,
          description:
            handler.name === "(anonymous function)"
              ? "Inline handler function"
              : `Middleware/handler function "${handler.name}"`,
          code: handler.code,
          params: handler.params,
          responses: handler.responses,
        },
        position: { x: 100 + index * 220, y: 250 + hIndex * 100 },
      });

      edges.push({
        id: `edge-${routeId}-${hIndex}`,
        source: hIndex === 0 ? routeId : `${routeId}-handler-${hIndex - 1}`,
        target: handlerId,
        animated: true,
        data: { description: "Passes request to next middleware/handler" },
      });
    });
  });

  return { nodes, edges };
}
