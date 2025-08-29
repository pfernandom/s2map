import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { CanvasContext, MapContext, nodeFilter } from "./context";

const HOVER_COLOR = "rgba(18, 167, 65, 0.4)";
const DEFAULT_COLOR = "rgba(0, 255, 0, 0.0)";
const SELECTED_COLOR = "rgba(13, 0, 255, 0.4)";
const SELECTED_PATH_COLOR = "rgba(13, 0, 255, 0.2)";
const USED_COLOR = "rgba(255, 0, 0, 0.3)";
const HOVER_USED_COLOR = "rgba(255, 0, 0, 0.7)";

export default function Canvas({ className, polygons, size }) {
  const { canvasRef, ctx, canvasReady, hoverPolygon } =
    useContext(CanvasContext);
  const [image, setImage] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    highlightedPath,
    selectedPolygon,
    used,
    selectedNode,
    polygonPaths,
    addPathFilter,
    pathFilters,
    showOverlay,
    mapImg,
  } = useContext(MapContext);

  useEffect(() => {
    const image = new Image();
    image.src = mapImg;
    image.onload = () => {
      setImage(image);
    };
  }, [mapImg]);

  const selectedHighlightColor = useCallback(
    (polygonId) => {
      const isInPath =
        highlightedPath && highlightedPath.some((p) => p.id === polygonId);
      const isSinglySelected =
        selectedPolygon && selectedPolygon.id === polygonId;
      if (isInPath && isSinglySelected) {
        return SELECTED_COLOR;
      } else if (isInPath) {
        return SELECTED_PATH_COLOR;
      } else if (used.has(polygonId)) {
        return USED_COLOR;
      }
      return DEFAULT_COLOR;
    },
    [highlightedPath, selectedPolygon, used]
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (image && canvasReady) {
      const x = canvas.width / size[0];
      const y = canvas.height / size[1];

      ctx.drawImage(image, 0, 0, canvas.height, canvas.height);
      ctx.scale(x, y);

      for (const [polygonId, polygonPath] of polygonPaths) {
        if (polygonId === 36) {
          continue;
        }
        if (polygonId === hoverPolygon) {
          ctx.fillStyle = used.has(polygonId) ? HOVER_USED_COLOR : HOVER_COLOR;

          ctx.strokeStyle = "rgb(22, 22, 22)";
          ctx.lineWidth = 6;
          ctx.stroke(polygonPath);
        } else {
          ctx.fillStyle = selectedHighlightColor(polygonId);
        }

        if (showOverlay) {
          ctx.fill(polygonPath);
        }
      }
    }
    return () => {
      if (canvasReady) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [
    canvasReady,
    canvasRef,
    ctx,
    image,
    polygonPaths,
    polygons.length,
    size,
    hoverPolygon,
    highlightedPath,
    selectedPolygon,
    selectedHighlightColor,
    used,
    selectedNode,
    showOverlay,
    isModalOpen,
  ]);

  return (
    <>
      <FlexCanvas
        className={className}
        onPolygonClick={(polygonId) => {
          if (
            !pathFilters.some((filter) => filter.id === polygonId) &&
            !used.has(polygonId)
          ) {
            addPathFilter(nodeFilter(polygonId));
          }
        }}
      />
      <div className="box-series-container">
        <div className="box-series">
          <div className="box">
            <span style={{ backgroundColor: HOVER_USED_COLOR }}></span>
            <span>Used</span>
          </div>
          <div className="box">
            <span style={{ backgroundColor: HOVER_COLOR }}></span>
            <span>Available</span>
          </div>
          <div className="box">
            <span style={{ backgroundColor: SELECTED_COLOR }}></span>
            <span>Part of a path</span>
          </div>
        </div>
      </div>

      <Modal isModalOpen={isModalOpen} />
    </>
  );
}

function Modal({ isModalOpen }) {
  const { mouseX, mouseY, hoverPolygon, hoverCanvas } =
    useContext(CanvasContext);
  const { ruinById, used } = useContext(MapContext);
  const [shouldShowModal, setShouldShowModal] = useState(
    isModalOpen || hoverCanvas
  );
  const [[x, y], setPosition] = useState([mouseX, mouseY]);

  useEffect(() => {
    if (hoverCanvas) {
      setShouldShowModal(true);
    }
  }, [hoverCanvas]);

  const modalCID = useRef(0);
  useEffect(() => {
    if (x > 0 || y > 0) {
      if (mouseX <= 0 || mouseY <= 0) {
        clearTimeout(modalCID.current);
        modalCID.current = setTimeout(() => {
          setPosition([mouseX, mouseY]);
        }, 1000);
        return;
      }
    }
    setPosition([mouseX, mouseY]);
  }, [mouseX, mouseY, x, y]);

  const ruin = ruinById[hoverPolygon];
  if (!ruin) {
    return null;
  }

  return (
    <dialog
      id="myModal"
      open={shouldShowModal}
      style={{
        position: "absolute",
        top: y,
        left: x,
      }}
    >
      <p>
        LVL {ruin.level}: {ruin.effect}{" "}
        {used.has(hoverPolygon) ? "(Occupied)" : ""}
        <span style={{ fontSize: "0.5em" }}>{ruin.id}</span>
      </p>
    </dialog>
  );
}

/**
 *
 * @param {{
 * className: string
 * props: React.CanvasHTMLAttributes<HTMLCanvasElement>
 * }} param0
 * @returns
 */
function FlexCanvas({ className, onPolygonClick, ...props }) {
  const {
    setMousePosition,
    canvasReady,
    canvasRef: ref,
    setHoverPolygon,
    setHoverCanvas,
  } = useContext(CanvasContext);
  const parentRef = useRef(null);
  const { polygonPaths } = useContext(MapContext);

  useEffect(() => {
    if (ref.current && parentRef.current) {
      const canvas = ref.current;
      const parent = parentRef.current;

      canvas.width = parent.clientHeight;
      canvas.height = parent.clientHeight;
    }
  }, [ref, parentRef]);

  const handleMouseMove = useCallback(
    (event) => {
      if (canvasReady) {
        const canvas = ref.current;
        const mouseX = event.clientX - canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - canvas.getBoundingClientRect().top;
        setMousePosition([event.clientX, event.clientY]);
        const ctx = canvas.getContext("2d");
        for (const [polygonId, polygonPath] of polygonPaths) {
          if (ctx.isPointInPath(polygonPath, mouseX, mouseY)) {
            setHoverPolygon(polygonId);
            return;
          }
        }
        setHoverPolygon(null);
      }
    },
    [canvasReady, polygonPaths, ref, setHoverPolygon, setMousePosition]
  );

  const handleClick = useCallback(
    (event) => {
      if (canvasReady) {
        const canvas = ref.current;
        const mouseX = event.clientX - canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - canvas.getBoundingClientRect().top;
        const ctx = canvas.getContext("2d");
        for (const [polygonId, polygonPath] of polygonPaths) {
          if (ctx.isPointInPath(polygonPath, mouseX, mouseY)) {
            onPolygonClick(polygonId);
          }
        }
      }
    },
    [canvasReady, polygonPaths, ref, onPolygonClick]
  );

  return (
    <div
      className={className}
      ref={parentRef}
      onMouseLeave={() => {
        setMousePosition([-1000, -1000]);
      }}
    >
      <canvas
        ref={ref}
        {...props}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          setHoverCanvas(true);
        }}
        onMouseLeave={() => {
          setHoverCanvas(false);
        }}
        onClick={handleClick}
      ></canvas>
    </div>
  );
}
