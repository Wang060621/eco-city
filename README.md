# Eco City

Eco City is a browser-based green city simulator built with Vite and vanilla JavaScript. Players plan a 6 × 6 city, place buildings, balance money, energy, carbon emissions and citizen happiness, and work towards the best environmental rating over ten turns.

## Features

- Responsive desktop and mobile interface
- Eight building types with different costs and environmental effects
- Interactive 6 × 6 city grid
- Turn-based resource simulation and Eco Score calculation
- Five final city rating levels
- Local browser save, load and reset support
- Save-success dialog after a manual save
- Keyboard-accessible controls and status feedback
- Automated state and event tests

## Requirements

- Node.js 22.12 or later
- npm

## Install and Run

Clone the repository and install its dependencies:

```sh
git clone https://github.com/Wang060621/eco-city.git
cd eco-city
npm install
npm run dev
```

Open the local address shown in the terminal, usually `http://localhost:5173`.

Do not open `index.html` directly. The project uses ES modules and must run through the Vite development server.

## Commands

```sh
npm run dev      # Start the development server
npm test         # Run the automated tests
npm run build    # Create the production build in dist/
npm run preview  # Preview the production build locally
```

## Project Structure

```text
src/
├── city/        # Interactive city grid
├── core/        # Shared game state and event bus
├── data/        # Building definitions and balance values
├── simulation/  # Purchases, turns, scoring and final ratings
├── storage/     # Browser save and load support
├── ui/          # Dashboard and game screens
├── main.js      # Application wiring and user interactions
└── style.css    # Main responsive styling

lead-tests/      # Automated and browser verification tests
```

## Save Data

Game progress is stored in the browser's local storage on the current device. A successful manual save displays a confirmation dialog. Resetting the game also removes the saved city.

## Verification

The project has been verified from a clean GitHub clone:

- Dependencies install successfully with `npm ci`.
- All 37 automated tests pass.
- The production build completes successfully.
- The application loads without browser errors.
- Building placement, turn progression, saving, the success dialog and save restoration after reload all work.

Generated folders such as `node_modules/` and `dist/` are intentionally excluded from the repository. They are recreated by `npm install` and `npm run build`.
