# Maze Creator & Solver

A browser-based maze drawing and solving application with QBasic SCREEN 12 style graphics. Users can draw mazes by drilling through a filled grid, place start/end markers, and watch the computer solve the maze with animated BFS pathfinding.

## Features

- Filled grid (all walls) — drill through to create paths
- Place Start (green) and End (red) markers
- Animated BFS pathfinding to solve the maze
- Solution path display
- Clear/Reset controls
- QBasic 16-color palette aesthetic
- QBJS IDE mode: run the original QBasic program in a browser-based IDE

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (bundled with Node.js)

### Clone the Repository

```bash
git clone https://github.com/GaryLuck/maze-creator-solver.git
cd maze-creator-solver
```

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5000`.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
maze-creator-solver/
├── client/               # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── maze.tsx  # Main maze component (Canvas editor & QBJS iframe)
│   │   └── App.tsx       # Router setup
│   └── public/
│       └── maze.bas      # QBasic maze program for QBJS runtime
├── server/               # Express backend (serves frontend)
├── shared/               # Shared types/utilities
└── script/               # Build scripts
```

## How to Use

1. **Draw the maze**: Click and drag on the grid to drill through walls and create paths.
2. **Place markers**: Use the toolbar to switch to Start or End marker mode and click a cell.
3. **Solve**: Click **Solve** to watch the BFS algorithm animate through the maze and highlight the solution path.
4. **Reset**: Click **Clear** to reset the maze to a full wall grid.

## Creating Your Own Fork

To create your own copy of this repository on GitHub:

1. Click the **Fork** button at the top-right of the [repository page](https://github.com/GaryLuck/maze-creator-solver).
2. Choose your GitHub account as the destination.
3. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/maze-creator-solver.git
   cd maze-creator-solver
   ```
4. Install dependencies and start developing:
   ```bash
   npm install
   npm run dev
   ```

## License

MIT
