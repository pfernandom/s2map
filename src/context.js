import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { signal } from "@preact/signals-react";
import { useSignalRef } from "./utils";

export const MapContext = createContext();

export function effectFilter(effect) {
  return {
    label: `Effect: ${effect}`,
    filter: (path) => path.some((p) => p.effect === effect),
  };
}

export function nodeFilter(nodeId) {
  return {
    label: `${nodeId}`,
    id: nodeId,
    filter: (path) => {
      if (path.some((p) => p.id === nodeId)) {
        console.log("FILTERING", path, nodeId, true);
      }
      return path.some((p) => p.id === nodeId);
    },
  };
}

export const EMPTY_MAP = "/s2map/map-s21.png";
export const CURRENT_MAP = "/s2map/current_map.png";

export function MapContextProvider({ children }) {
  const [paths, setPaths] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [used, setUsed] = useState(new Set());
  const [size, setSize] = useState([1, 1]);
  const [highlightedPath, setHighlightedPath] = useState(null);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [ruinById, setRuinById] = useState({});
  const [showOverlay, setShowOverlay] = useState(true);
  const [mapImg, setMapImg] = useState(EMPTY_MAP);

  const selectedNode = useSignalRef("xx");
  const [pathFilters, setPathFilters] = useState([]);

  const polygonPaths = useMemo(() => {
    return polygons.map((x) => getPolygonPath(x));
  }, [polygons]);

  useEffect(() => {
    fetch("/s2map/polygon.json")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setPaths(data.paths);
        setPolygons(data.polygons);
        setUsed(new Set(data.used));
        const nodes = data.nodes.sort((a, b) => a.level - b.level);
        setNodes(nodes);
        setSize(data.size);

        const locById = {};
        nodes.forEach((n) => {
          locById[n.id] = n;
        });
        setRuinById(locById);
      });
  }, []);

  const filteredPaths = useMemo(
    () =>
      paths.filter((path) =>
        pathFilters.every((filter) => filter.filter(path))
      ),
    [paths, pathFilters]
  );

  return (
    <MapContext.Provider
      value={{
        paths,
        polygons,
        used,
        size,
        nodes,
        highlightedPath,
        setHighlightedPath,
        selectedPolygon,
        setSelectedPolygon,
        selectedEffect,
        setSelectedEffect,
        selectedNode,
        pathFilters,
        setPathFilters,
        addPathFilter: (filter) => setPathFilters((prev) => [...prev, filter]),
        ruinById,
        polygonPaths,
        showOverlay,
        setShowOverlay,
        mapImg,
        setMapImg,
        filteredPaths,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

function getPolygonPath(polygon) {
  const polygonPath = new Path2D();
  polygonPath.moveTo(polygon.points[0].x, polygon.points[0].y);
  for (let i = 1; i < polygon.points.length; i++) {
    polygonPath.lineTo(polygon.points[i].x, polygon.points[i].y);
  }
  polygonPath.closePath();
  return [polygon.id, polygonPath];
}

export const CanvasContext = createContext();

export function CanvasContextProvider({ children }) {
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [[mouseX, mouseY], setMousePosition] = useState([0, 0]);
  const [hoverPolygon, setHoverPolygon] = useState(null);
  const [hoverCanvas, setHoverCanvas] = useState(null);

  useEffect(() => {
    if (canvasRef.current) {
      setCtx(canvasRef.current.getContext("2d"));
    }
  }, [canvasRef]);

  return (
    <CanvasContext.Provider
      value={{
        canvasRef,
        ctx,
        canvasReady: !!ctx,
        mouseX,
        mouseY,
        setMousePosition,
        hoverPolygon,
        setHoverPolygon,
        hoverCanvas,
        setHoverCanvas,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}
