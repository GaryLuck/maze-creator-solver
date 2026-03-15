import { useRef, useEffect, useState, useCallback } from "react";

const MAZE_BAS_CODE = `' ============================================
' MAZE CREATOR & SOLVER
' QBasic Style - SCREEN 12
' Use mouse to draw, keyboard for tools
' ============================================

SCREEN 12
_TITLE "Maze Creator & Solver"

CONST COLS = 38
CONST ROWS = 25
CONST CW = 16
CONST CH = 16
CONST OX = 16
CONST OY = 48

DIM SHARED maze(ROWS - 1, COLS - 1) AS INTEGER
DIM SHARED vis(ROWS - 1, COLS - 1) AS INTEGER
DIM SHARED parR(ROWS - 1, COLS - 1) AS INTEGER
DIM SHARED parC(ROWS - 1, COLS - 1) AS INTEGER
DIM SHARED solR(ROWS * COLS) AS INTEGER
DIM SHARED solC(ROWS * COLS) AS INTEGER
DIM SHARED solLen AS INTEGER
DIM SHARED sR AS INTEGER, sC AS INTEGER
DIM SHARED eR AS INTEGER, eC AS INTEGER
DIM SHARED hasS AS INTEGER, hasE AS INTEGER
DIM SHARED curTool AS INTEGER
DIM SHARED solving AS INTEGER
DIM SHARED msg AS STRING
DIM SHARED prevMB AS INTEGER

curTool = 0
hasS = 0
hasE = 0
solving = 0
solLen = 0
prevMB = 0
msg = "Press D=Drill S=Start E=End SPACE=Solve R=Reset ESC=Quit"

FOR r = 0 TO ROWS - 1
    FOR c = 0 TO COLS - 1
        maze(r, c) = 1
        vis(r, c) = 0
    NEXT c
NEXT r

DO
    DO WHILE _MOUSEINPUT: LOOP
    mx = _MOUSEX
    my = _MOUSEY
    mb = _MOUSEBUTTON(1)

    gc = INT((mx - OX) / CW)
    gr = INT((my - OY) / CH)

    IF mb AND (NOT prevMB) AND (NOT solving) THEN
        IF gr >= 0 AND gr < ROWS AND gc >= 0 AND gc < COLS THEN
            SELECT CASE curTool
                CASE 0
                    IF maze(gr, gc) = 1 THEN
                        maze(gr, gc) = 0
                    ELSE
                        maze(gr, gc) = 1
                    END IF
                    ClearSolution
                CASE 1
                    IF maze(gr, gc) = 0 THEN
                        sR = gr: sC = gc: hasS = 1
                        msg = "Start set! Now set End point (E key)"
                        ClearSolution
                    ELSE
                        msg = "Start must be on an open cell!"
                    END IF
                CASE 2
                    IF maze(gr, gc) = 0 THEN
                        eR = gr: eC = gc: hasE = 1
                        msg = "End set! Press SPACE to solve"
                        ClearSolution
                    ELSE
                        msg = "End must be on an open cell!"
                    END IF
            END SELECT
        END IF
    END IF

    prevMB = mb

    k$ = INKEY$
    IF LEN(k$) > 0 AND NOT solving THEN
        SELECT CASE UCASE$(k$)
            CASE "D"
                curTool = 0
                msg = "DRILL mode: Click cells to toggle walls"
            CASE "S"
                curTool = 1
                msg = "START mode: Click an open cell to set start"
            CASE "E"
                curTool = 2
                msg = "END mode: Click an open cell to set end"
            CASE " "
                IF hasS AND hasE THEN
                    solving = 1
                    msg = "Solving with BFS..."
                    DrawAll
                    _DISPLAY
                    SolveMaze
                    solving = 0
                ELSE
                    msg = "Set both Start and End points first!"
                END IF
            CASE "R"
                FOR r = 0 TO ROWS - 1
                    FOR c = 0 TO COLS - 1
                        maze(r, c) = 1
                    NEXT c
                NEXT r
                hasS = 0: hasE = 0
                ClearSolution
                msg = "Reset! D=Drill S=Start E=End SPACE=Solve"
            CASE "C"
                ClearSolution
                msg = "Solution cleared"
            CASE CHR$(27)
                SYSTEM
        END SELECT
    END IF

    DrawAll
    _DISPLAY
    _LIMIT 30
LOOP

SUB ClearSolution
    FOR r = 0 TO ROWS - 1
        FOR c = 0 TO COLS - 1
            vis(r, c) = 0
        NEXT c
    NEXT r
    solLen = 0
END SUB

SUB DrawAll
    CLS
    COLOR 14
    LOCATE 1, 20
    PRINT "MAZE CREATOR & SOLVER"
    COLOR 3
    LOCATE 2, 18
    PRINT "QBasic Style - SCREEN 12"

    FOR r = 0 TO ROWS - 1
        FOR c = 0 TO COLS - 1
            x1 = OX + c * CW
            y1 = OY + r * CH
            x2 = x1 + CW - 1
            y2 = y1 + CH - 1
            IF maze(r, c) = 1 THEN
                LINE (x1, y1)-(x2, y2), 1, BF
                LINE (x1, y1)-(x2, y2), 9, B
            ELSE
                LINE (x1, y1)-(x2, y2), 0, BF
                LINE (x1, y1)-(x2, y2), 8, B
            END IF
            IF vis(r, c) = 1 AND maze(r, c) = 0 THEN
                LINE (x1 + 3, y1 + 3)-(x2 - 3, y2 - 3), 3, BF
            END IF
        NEXT c
    NEXT r

    FOR i = 0 TO solLen - 1
        x1 = OX + solC(i) * CW
        y1 = OY + solR(i) * CH
        x2 = x1 + CW - 1
        y2 = y1 + CH - 1
        LINE (x1 + 2, y1 + 2)-(x2 - 2, y2 - 2), 13, BF
    NEXT i

    IF hasS THEN
        x1 = OX + sC * CW: y1 = OY + sR * CH
        LINE (x1+1,y1+1)-(x1+CW-2,y1+CH-2), 10, BF
        COLOR 0: _PRINTSTRING (x1+4, y1+3), "S"
    END IF
    IF hasE THEN
        x1 = OX + eC * CW: y1 = OY + eR * CH
        LINE (x1+1,y1+1)-(x1+CW-2,y1+CH-2), 12, BF
        COLOR 0: _PRINTSTRING (x1+4, y1+3), "E"
    END IF
    COLOR 15: LOCATE 29, 2: PRINT msg;
END SUB

SUB SolveMaze
    DIM qR(ROWS * COLS) AS INTEGER
    DIM qC(ROWS * COLS) AS INTEGER
    DIM qHead AS INTEGER, qTail AS INTEGER
    DIM found AS INTEGER

    FOR r = 0 TO ROWS - 1
        FOR c = 0 TO COLS - 1
            vis(r, c) = 0
            parR(r, c) = -1
            parC(r, c) = -1
        NEXT c
    NEXT r
    solLen = 0

    qHead = 0: qTail = 0
    qR(qTail) = sR: qC(qTail) = sC
    qTail = qTail + 1
    vis(sR, sC) = 1
    found = 0

    DO WHILE qHead < qTail AND NOT found
        cr = qR(qHead): cc = qC(qHead)
        qHead = qHead + 1
        IF cr = eR AND cc = eC THEN
            found = 1: EXIT DO
        END IF
        FOR d = 0 TO 3
            SELECT CASE d
                CASE 0: nr = cr - 1: nc = cc
                CASE 1: nr = cr + 1: nc = cc
                CASE 2: nr = cr: nc = cc - 1
                CASE 3: nr = cr: nc = cc + 1
            END SELECT
            IF nr >= 0 AND nr < ROWS AND nc >= 0 AND nc < COLS THEN
                IF maze(nr, nc) = 0 AND vis(nr, nc) = 0 THEN
                    vis(nr, nc) = 1
                    parR(nr, nc) = cr: parC(nr, nc) = cc
                    qR(qTail) = nr: qC(qTail) = nc
                    qTail = qTail + 1
                    x1 = OX + nc * CW: y1 = OY + nr * CH
                    LINE (x1+3,y1+3)-(x1+CW-4,y1+CH-4), 14, BF
                    _DISPLAY: _DELAY 0.02
                    LINE (x1+3,y1+3)-(x1+CW-4,y1+CH-4), 3, BF
                END IF
            END IF
        NEXT d
    LOOP

    IF found THEN
        tr = eR: tc = eC: solLen = 0
        DO WHILE NOT (tr = sR AND tc = sC)
            solR(solLen) = tr: solC(solLen) = tc
            solLen = solLen + 1
            pr = parR(tr, tc): pc = parC(tr, tc)
            tr = pr: tc = pc
        LOOP
        solR(solLen) = sR: solC(solLen) = sC
        solLen = solLen + 1
        FOR i = solLen - 1 TO 0 STEP -1
            x1 = OX + solC(i) * CW: y1 = OY + solR(i) * CH
            LINE (x1+2,y1+2)-(x1+CW-3,y1+CH-3), 13, BF
            _DISPLAY: _DELAY 0.04
        NEXT i
        msg = "Path found! Length:" + STR$(solLen) + " cells"
    ELSE
        msg = "No path found! Maze has no solution."
    END IF
    DrawAll: _DISPLAY
END SUB`;

const COLS = 40;
const ROWS = 30;
const CELL = 16;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;

const QB_COLORS: Record<number, string> = {
  0: "#000000",
  1: "#0000AA",
  2: "#00AA00",
  3: "#00AAAA",
  4: "#AA0000",
  5: "#AA00AA",
  6: "#AA5500",
  7: "#AAAAAA",
  8: "#555555",
  9: "#5555FF",
  10: "#55FF55",
  11: "#55FFFF",
  12: "#FF5555",
  13: "#FF55FF",
  14: "#FFFF55",
  15: "#FFFFFF",
};

type Tool = "drill" | "start" | "end";
type ViewMode = "canvas" | "qbjs";

const WALL = 1;
const PATH = 0;

interface Point {
  r: number;
  c: number;
}

export default function MazePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(WALL))
  );
  const [tool, setTool] = useState<Tool>("drill");
  const [startPt, setStartPt] = useState<Point | null>(null);
  const [endPt, setEndPt] = useState<Point | null>(null);
  const [solving, setSolving] = useState(false);
  const [visited, setVisited] = useState<boolean[][]>([]);
  const [solutionPath, setSolutionPath] = useState<Point[]>([]);
  const [searchFrontier, setSearchFrontier] = useState<Point[]>([]);
  const [statusMsg, setStatusMsg] = useState("Select DRILL tool and click to carve paths");
  const [mouseDown, setMouseDown] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const animRef = useRef<number | null>(null);

  const [copied, setCopied] = useState(false);

  const openInQbjs = () => {
    window.open("https://qbjs.org/", "_blank");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(MAZE_BAS_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = MAZE_BAS_CODE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const draw = useCallback(() => {
    if (viewMode !== "canvas") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = QB_COLORS[0];
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL;
        const y = r * CELL;

        if (grid[r][c] === WALL) {
          ctx.fillStyle = QB_COLORS[1];
          ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeStyle = QB_COLORS[9];
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
        } else {
          ctx.fillStyle = QB_COLORS[0];
          ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeStyle = QB_COLORS[8];
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
        }
      }
    }

    if (visited.length > 0) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (visited[r]?.[c] && grid[r][c] === PATH) {
            const x = c * CELL;
            const y = r * CELL;
            ctx.fillStyle = QB_COLORS[3];
            ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
          }
        }
      }
    }

    for (const p of searchFrontier) {
      const x = p.c * CELL;
      const y = p.r * CELL;
      ctx.fillStyle = QB_COLORS[14];
      ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
    }

    for (const p of solutionPath) {
      const x = p.c * CELL;
      const y = p.r * CELL;
      ctx.fillStyle = QB_COLORS[13];
      ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
    }

    if (startPt) {
      const x = startPt.c * CELL;
      const y = startPt.r * CELL;
      ctx.fillStyle = QB_COLORS[10];
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = QB_COLORS[0];
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S", x + CELL / 2, y + CELL / 2 + 1);
    }

    if (endPt) {
      const x = endPt.c * CELL;
      const y = endPt.r * CELL;
      ctx.fillStyle = QB_COLORS[12];
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = QB_COLORS[0];
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("E", x + CELL / 2, y + CELL / 2 + 1);
    }
  }, [grid, startPt, endPt, visited, solutionPath, searchFrontier, viewMode]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return { r, c };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCellFromEvent(e);
    if (!pt || solving) return;
    if (tool === "drill") {
      setMouseDown(true);
      setGrid((prev) => {
        const ng = prev.map((row) => [...row]);
        ng[pt.r][pt.c] = ng[pt.r][pt.c] === WALL ? PATH : WALL;
        return ng;
      });
      if (startPt && startPt.r === pt.r && startPt.c === pt.c) setStartPt(null);
      if (endPt && endPt.r === pt.r && endPt.c === pt.c) setEndPt(null);
    } else if (tool === "start") {
      if (grid[pt.r][pt.c] === PATH) {
        setStartPt(pt);
        setStatusMsg("Start point set! Now set the end point.");
      } else {
        setStatusMsg("Start must be on an open path cell!");
      }
    } else if (tool === "end") {
      if (grid[pt.r][pt.c] === PATH) {
        setEndPt(pt);
        setStatusMsg("End point set! Press SOLVE to find the path.");
      } else {
        setStatusMsg("End must be on an open path cell!");
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseDown || tool !== "drill" || solving) return;
    const pt = getCellFromEvent(e);
    if (!pt) return;
    setGrid((prev) => {
      if (prev[pt.r][pt.c] === PATH) return prev;
      const ng = prev.map((row) => [...row]);
      ng[pt.r][pt.c] = PATH;
      return ng;
    });
  };

  const handleMouseUp = () => {
    setMouseDown(false);
  };

  const resetMaze = () => {
    if (animRef.current) {
      clearTimeout(animRef.current);
      animRef.current = null;
    }
    setSolving(false);
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(WALL)));
    setStartPt(null);
    setEndPt(null);
    setVisited([]);
    setSolutionPath([]);
    setSearchFrontier([]);
    setStatusMsg("Select DRILL tool and click to carve paths");
  };

  const clearSolution = () => {
    if (animRef.current) {
      clearTimeout(animRef.current);
      animRef.current = null;
    }
    setSolving(false);
    setVisited([]);
    setSolutionPath([]);
    setSearchFrontier([]);
    setStatusMsg("Solution cleared. Modify maze or solve again.");
  };

  const solveMaze = () => {
    if (!startPt || !endPt) {
      setStatusMsg("Set both START and END points before solving!");
      return;
    }
    if (grid[startPt.r][startPt.c] === WALL || grid[endPt.r][endPt.c] === WALL) {
      setStatusMsg("START and END must be on open path cells!");
      return;
    }

    setSolving(true);
    setVisited([]);
    setSolutionPath([]);
    setSearchFrontier([]);
    setStatusMsg("Solving maze with BFS...");

    const vis = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const parent: (Point | null)[][] = Array.from({ length: ROWS }, () =>
      Array(COLS).fill(null)
    );

    const queue: Point[] = [{ r: startPt.r, c: startPt.c }];
    vis[startPt.r][startPt.c] = true;

    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    let stepIndex = 0;
    const allSteps: { visited: boolean[][]; frontier: Point[]; found: boolean }[] = [];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const currentFrontier: Point[] = [];

      if (cur.r === endPt.r && cur.c === endPt.c) {
        allSteps.push({
          visited: vis.map((row) => [...row]),
          frontier: [],
          found: true,
        });
        break;
      }

      for (const d of dirs) {
        const nr = cur.r + d.dr;
        const nc = cur.c + d.dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !vis[nr][nc] && grid[nr][nc] === PATH) {
          vis[nr][nc] = true;
          parent[nr][nc] = cur;
          queue.push({ r: nr, c: nc });
          currentFrontier.push({ r: nr, c: nc });
        }
      }

      if (currentFrontier.length > 0) {
        allSteps.push({
          visited: vis.map((row) => [...row]),
          frontier: [...currentFrontier],
          found: false,
        });
      }
    }

    const traceSolution = (): Point[] => {
      const path: Point[] = [];
      let cur: Point | null = endPt;
      while (cur && !(cur.r === startPt.r && cur.c === startPt.c)) {
        path.push(cur);
        cur = parent[cur.r][cur.c];
      }
      if (cur) path.push(cur);
      return path.reverse();
    };

    const lastStep = allSteps[allSteps.length - 1];
    const found = lastStep?.found ?? false;

    const animate = () => {
      if (stepIndex < allSteps.length) {
        const step = allSteps[stepIndex];
        setVisited(step.visited);
        setSearchFrontier(step.frontier);
        stepIndex++;

        if (step.found) {
          const path = traceSolution();
          animateSolution(path, 0);
          return;
        }

        animRef.current = window.setTimeout(animate, 30);
      } else if (!found) {
        setSolving(false);
        setStatusMsg("No path found! The maze has no solution.");
      }
    };

    const animateSolution = (path: Point[], idx: number) => {
      if (idx <= path.length) {
        setSolutionPath(path.slice(0, idx));
        setSearchFrontier([]);
        if (idx < path.length) {
          animRef.current = window.setTimeout(() => animateSolution(path, idx + 1), 50);
        } else {
          setSolving(false);
          setStatusMsg(`Path found! Length: ${path.length} cells`);
        }
      }
    };

    animate();
  };

  const btnClass = (active: boolean) =>
    `px-3 py-1.5 font-mono text-sm border-2 cursor-pointer transition-colors ${
      active
        ? "bg-[#5555FF] text-white border-[#AAAAAA]"
        : "bg-[#0000AA] text-[#AAAAAA] border-[#555555] hover:bg-[#5555FF] hover:text-white"
    }`;

  return (
    <div
      style={{
        background: QB_COLORS[0],
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
        fontFamily: "monospace",
        color: QB_COLORS[7],
      }}
    >
      <h1
        style={{
          color: QB_COLORS[14],
          fontSize: "22px",
          marginBottom: "4px",
          letterSpacing: "2px",
          fontFamily: "monospace",
        }}
      >
        MAZE CREATOR & SOLVER
      </h1>
      <p style={{ color: QB_COLORS[3], fontSize: "12px", marginBottom: "12px", fontFamily: "monospace" }}>
        QBasic Style - SCREEN 12
      </p>

      <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          className={btnClass(viewMode === "canvas")}
          onClick={() => setViewMode("canvas")}
          style={{ borderColor: viewMode === "canvas" ? QB_COLORS[14] : undefined }}
        >
          INTERACTIVE
        </button>
        <button
          className={btnClass(viewMode === "qbjs")}
          onClick={() => setViewMode("qbjs")}
          style={{ borderColor: viewMode === "qbjs" ? QB_COLORS[14] : undefined }}
        >
          QBJS IDE
        </button>
      </div>

      {viewMode === "qbjs" ? (
        <div style={{ width: "100%", maxWidth: "960px" }}>
          <div
            style={{
              marginBottom: "8px",
              padding: "8px 16px",
              background: QB_COLORS[1],
              border: `1px solid ${QB_COLORS[9]}`,
              color: QB_COLORS[15],
              fontFamily: "monospace",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            QBasic Maze Program Source Code (for QBJS Runtime)
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", justifyContent: "center" }}>
            <button
              className="px-4 py-2 font-mono text-sm border-2 cursor-pointer bg-[#00AA00] text-white border-[#55FF55] hover:bg-[#55FF55] hover:text-black"
              onClick={() => { copyCode(); openInQbjs(); }}
            >
              COPY CODE & OPEN QBJS IDE
            </button>
            <button
              className={`px-4 py-2 font-mono text-sm border-2 cursor-pointer ${
                copied
                  ? "bg-[#55FF55] text-black border-[#55FF55]"
                  : "bg-[#AA5500] text-white border-[#FFFF55] hover:bg-[#FFFF55] hover:text-black"
              }`}
              onClick={copyCode}
            >
              {copied ? "COPIED!" : "COPY CODE"}
            </button>
          </div>
          <div
            style={{
              marginBottom: "8px",
              padding: "6px 12px",
              background: QB_COLORS[6],
              border: `1px solid ${QB_COLORS[14]}`,
              color: QB_COLORS[15],
              fontFamily: "monospace",
              fontSize: "11px",
              textAlign: "center",
            }}
          >
            Steps: 1) Click "COPY CODE & OPEN QBJS IDE" above  2) Paste code into the QBJS editor  3) Click RUN
          </div>
          <div
            style={{
              border: `2px solid ${QB_COLORS[7]}`,
              background: "#0C0C28",
              width: "100%",
              maxHeight: "500px",
              overflow: "auto",
              padding: "12px",
            }}
          >
            <pre
              style={{
                color: QB_COLORS[14],
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: "1.4",
                margin: 0,
                whiteSpace: "pre",
                tabSize: 4,
              }}
            >
              {MAZE_BAS_CODE}
            </pre>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button className={btnClass(tool === "drill")} onClick={() => !solving && setTool("drill")}>
              [D]RILL
            </button>
            <button className={btnClass(tool === "start")} onClick={() => !solving && setTool("start")}>
              [S]TART
            </button>
            <button className={btnClass(tool === "end")} onClick={() => !solving && setTool("end")}>
              [E]ND
            </button>
            <button
              className={`px-3 py-1.5 font-mono text-sm border-2 cursor-pointer ${
                solving
                  ? "bg-[#555555] text-[#AAAAAA] border-[#555555] cursor-not-allowed"
                  : "bg-[#00AA00] text-white border-[#55FF55] hover:bg-[#55FF55] hover:text-black"
              }`}
              onClick={solveMaze}
              disabled={solving}
            >
              SOLVE
            </button>
            <button
              className="px-3 py-1.5 font-mono text-sm border-2 cursor-pointer bg-[#AA5500] text-white border-[#FFFF55] hover:bg-[#FFFF55] hover:text-black"
              onClick={clearSolution}
            >
              CLEAR
            </button>
            <button
              className="px-3 py-1.5 font-mono text-sm border-2 cursor-pointer bg-[#AA0000] text-white border-[#FF5555] hover:bg-[#FF5555] hover:text-black"
              onClick={resetMaze}
            >
              RESET
            </button>
          </div>

          <div
            style={{
              border: `2px solid ${QB_COLORS[7]}`,
              display: "inline-block",
              background: QB_COLORS[0],
            }}
          >
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              style={{
                display: "block",
                maxWidth: "100%",
                height: "auto",
                imageRendering: "pixelated",
                cursor: solving ? "wait" : "crosshair",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <div
            style={{
              marginTop: "8px",
              padding: "6px 16px",
              background: QB_COLORS[1],
              border: `1px solid ${QB_COLORS[9]}`,
              color: QB_COLORS[15],
              fontFamily: "monospace",
              fontSize: "13px",
              maxWidth: `${WIDTH}px`,
              textAlign: "center",
              width: "100%",
            }}
          >
            {statusMsg}
          </div>

          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              justifyContent: "center",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
          >
            <span style={{ color: QB_COLORS[1] }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: QB_COLORS[1], border: `1px solid ${QB_COLORS[9]}`, verticalAlign: "middle", marginRight: 4 }} />
              Wall
            </span>
            <span style={{ color: QB_COLORS[7] }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: QB_COLORS[0], border: `1px solid ${QB_COLORS[8]}`, verticalAlign: "middle", marginRight: 4 }} />
              Path
            </span>
            <span style={{ color: QB_COLORS[10] }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: QB_COLORS[10], verticalAlign: "middle", marginRight: 4 }} />
              Start
            </span>
            <span style={{ color: QB_COLORS[12] }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: QB_COLORS[12], verticalAlign: "middle", marginRight: 4 }} />
              End
            </span>
            <span style={{ color: QB_COLORS[3] }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: QB_COLORS[3], verticalAlign: "middle", marginRight: 4 }} />
              Visited
            </span>
            <span style={{ color: QB_COLORS[14] }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: QB_COLORS[14], verticalAlign: "middle", marginRight: 4 }} />
              Frontier
            </span>
            <span style={{ color: QB_COLORS[13] }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: QB_COLORS[13], verticalAlign: "middle", marginRight: 4 }} />
              Solution
            </span>
          </div>
        </>
      )}
    </div>
  );
}
