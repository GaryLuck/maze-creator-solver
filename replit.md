# Maze Creator & Solver

## Overview
A browser-based maze drawing and solving application with QBasic SCREEN 12 style graphics. Users can draw mazes by drilling through a filled grid, place start/end markers, and watch the computer solve the maze with animated BFS pathfinding.

## Architecture
- **Frontend**: React + TypeScript with HTML5 Canvas for interactive maze editor
- **Backend**: Express server (serves frontend via Vite in dev, static in prod)
- **QBJS Integration**: QBasic maze program available at `/maze.bas`, embeddable via QBJS IDE iframe
- **Two modes**: 
  - INTERACTIVE mode: Full-featured Canvas-based maze editor with mouse drawing
  - QBJS IDE mode: Opens the QBasic program in the QBJS online IDE

## Key Files
- `client/src/pages/maze.tsx` - Main maze component with Canvas editor and QBJS iframe
- `client/public/maze.bas` - QBasic maze program for QBJS runtime
- `client/src/App.tsx` - Router setup
- `server/` - Express backend

## Features
- Filled grid (all walls) - drill to create paths
- Start (green) and End (red) marker placement
- BFS pathfinding with animated visualization
- Solution path display
- Clear/Reset controls
- QBasic 16-color palette aesthetic

## Recent Changes
- 2026-02-19: Initial implementation of maze creator and solver
