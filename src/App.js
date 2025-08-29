import {
  useRef,
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  useMemo,
} from "react";
import logo from "./logo.svg";
import "./App.css";
import Canvas from "./Canvas";
import { useWindowDimensions } from "./hooks";
import {
  MapContext,
  MapContextProvider,
  CanvasContextProvider,
  effectFilter,
  CURRENT_MAP,
  EMPTY_MAP,
  CanvasContext,
} from "./context";
import { computed } from "@preact/signals-react";

function App() {
  return (
    <div className="App">
      <CanvasContextProvider>
        <MapContextProvider>
          <MapView />
        </MapContextProvider>
      </CanvasContextProvider>
    </div>
  );
}

function MapView() {
  const {
    polygons,
    used,
    size,
    setShowOverlay,
    showOverlay,
    setMapImg,
    mapImg,
  } = useContext(MapContext);

  return (
    <>
      <Canvas
        className="item-80 canvas"
        polygons={polygons}
        used={used}
        size={size}
      />
      <div id="info" className="item-20 info">
        <div className="flex-row">
          <input
            type="checkbox"
            id="show-overlay"
            checked={showOverlay}
            onChange={() => setShowOverlay(!showOverlay)}
          />
          <label htmlFor="show-overlay">Show Overlay</label>

          <input
            type="checkbox"
            id="show-latest-map"
            checked={mapImg === CURRENT_MAP}
            onChange={() =>
              setMapImg(mapImg === CURRENT_MAP ? EMPTY_MAP : CURRENT_MAP)
            }
          />
          <label htmlFor="show-overlay">Show Latest Map</label>
        </div>

        <RuinList />
        <PathList />
      </div>
    </>
  );
}

function HelpOverlay({ children, className }) {
  const [show, setShow] = useState(false);
  return (
    <div className={`help-overlay ${className}`}>
      <span
        className="help-overlay-icon"
        onMouseEnter={() => {
          setShow(!show);
        }}
        onMouseLeave={() => {
          setShow(false);
        }}
      >
        &#10067;
      </span>
      <div
        className={`help-overlay-content ${
          show ? "overlay-visible" : "overlay-hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function SearchBox() {
  const { pathFilters, addPathFilter, setPathFilters, filteredPaths } =
    useContext(MapContext);

  const effects = useMemo(() => {
    return [
      ...new Set(filteredPaths.map((path) => path.map((p) => p.effect)).flat()),
    ];
  }, [filteredPaths]);

  return (
    <div className="flex-row">
      <div className="flex-row">
        <label>
          Filter by effect:
          <input
            type="text"
            id="effect-input"
            list="effects"
            onChange={(e) => {
              if (effects.includes(e.target.value)) {
                addPathFilter(effectFilter(e.target.value));
              }
            }}
          />
        </label>
      </div>
      <datalist id="effects">
        {effects.map((effect) => (
          <option key={effect} value={effect}>
            {effect}
          </option>
        ))}
      </datalist>
      {pathFilters.length > 0 && (
        <button
          title="Clear all filters"
          className="control-btn"
          onClick={() => setPathFilters([])}
        >
          Clear
        </button>
      )}
    </div>
  );
}

function nodeToLabel(ruin) {
  console.log({ ruin });
  if (!ruin) {
    return "Unknown";
  }

  return `LVL${ruin.level}: ${ruin.effect}`;
}

function RuinList() {
  const { nodes } = useContext(MapContext);
  const { setHoverPolygon } = useContext(CanvasContext);

  return (
    <details open className="ruin-list-container">
      <summary>
        <span className="large-title">Ruins</span>
        <HelpOverlay className="ruin-list-help-overlay">
          A list of all ruins on the map by level and effect.
        </HelpOverlay>
      </summary>
      <ul
        style={{ listStyleType: "none", maxHeight: "40vh", overflowY: "auto" }}
      >
        {nodes.map((node) => (
          <li
            key={node.id}
            onMouseEnter={() => setHoverPolygon(node.id)}
            onMouseLeave={() => setHoverPolygon(null)}
          >
            {nodeToLabel(node)}
          </li>
        ))}
      </ul>
    </details>
  );
}

function PathList() {
  const {
    pathFilters,
    setHighlightedPath,
    setSelectedPolygon,
    setPathFilters,
    ruinById,
    filteredPaths,
  } = useContext(MapContext);

  return (
    <details open className="path-list-container">
      <summary>
        <span className="large-title">Paths</span>
        <HelpOverlay className="path-list-help-overlay">
          A list of all paths from a ruin LVL 1 to LVL 4.
        </HelpOverlay>
      </summary>
      <SearchBox />

      {pathFilters.length > 0 && (
        <div>
          {pathFilters.map((filter) => (
            <div key={filter.label} className="path-filter">
              <span>
                {filter.id ? nodeToLabel(ruinById[filter.id]) : filter.label}
              </span>

              <button
                title="Remove filter"
                onClick={() =>
                  setPathFilters((prev) => prev.filter((f) => f !== filter))
                }
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
      <ul
        id="paths"
        style={{
          listStyleType: "none",
          maxHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {filteredPaths.map((path) => (
          <li
            className="path-item"
            key={path.map((p) => p.id).join(",")}
            onMouseEnter={() => {
              setHighlightedPath(path);
            }}
            onMouseLeave={() => setHighlightedPath(null)}
          >
            <details>
              <summary>{path.map((p) => p.level).join(" -> ")}</summary>
              <div className="path-actions">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      path.map((p) => nodeToLabel(p)).join(" -> ")
                    );
                  }}
                >
                  &#x2398; Copy
                </button>
              </div>
              <ul>
                {path.map((p) => (
                  <li
                    key={p.id}
                    onMouseEnter={() => setSelectedPolygon(p)}
                    onMouseLeave={() => setSelectedPolygon(null)}
                  >
                    LVL {p.level} {p.effect}
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
      {filteredPaths.length === 0 && <p>No paths found matching filters</p>}
    </details>
  );
}
export default App;
