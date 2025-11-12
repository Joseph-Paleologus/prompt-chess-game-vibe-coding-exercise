# Tournament Results Viewer - Solution

This is a static website that displays tournament results from a prompt-based game competition. It reads data from `data/final_standings.csv` and per-player YAML files under `data/prompt_collection/`.

## Features Implemented

### Core Requirements ✅
- **Leaderboard table** - Displays all players with full stats. Click any player row to view detailed information
- **Interactive charts**:
  - Win Rate comparison (horizontal bar chart)
  - Rating Distribution (Mu values bar chart)
  - Stacked Games chart (Wins/Draws/Losses)
- **Player details modal** - Shows detailed stats, model, strategy, and full prompt
- **Responsive design** - Mobile-friendly layout that adapts to screen size
- **Dark/light theme toggle** - Switch between themes with persistent UI

### Specifications from Screenshot ✅
1. **Dynamic Rankings** - Sort leaderboard by:
   - Final Standing (Rank) - default
   - Win Rate - highest to lowest
   - Mu Rating - highest to lowest
2. **Pin Player to Top** - Click "Pin" button to anchor any player at the top of the leaderboard (persists across sorting)
3. **Visual Highlights**:
   - 🥇 🥈 🥉 **Top 3 players** get medal emoji indicators
   - 🔥 **Players with win rate > 80%** highlighted with green background and fire badge
   - **Pinned players** get golden background with gold left border
4. **Model Display** - Shows model name for each player in the table
5. **Prompt Display** - Full prompt text displayed in player detail modal with scrollable code block

### Additional Features
- **Real-time search** - Filter players by name as you type
- **Data enrichment** - Automatically loads YAML configs to display model/prompt info
- **Clean UI** - Minimal, professional design with smooth interactions

## How to Run Locally

Browsers block fetch() for local `file://` pages, so you need to run a simple HTTP server:

```bash
# Navigate to project directory
cd "../prompt-chess-game-vibe-coding-exercise-main"

# Start HTTP server (macOS/Linux)
python3 -m http.server 8000

# Or use Node.js if you prefer
# npx http-server -p 8000
```

Then open **http://localhost:8000/** in your browser.

## Data Format

### CSV Format (`data/final_standings.csv`)
Required columns:
```csv
Rank,Player,Rating_Mu,Rating_Sigma,Wins,Draws,Losses,Games,Win_Rate
1,Alice,1550,30,8,1,1,10,0.8
2,Bob,1480,45,6,2,2,10,0.6
```

### YAML Format (`data/prompt_collection/{Player_Name}.yaml`)
Expected structure:
```yaml
name: Alice
model: GPT-4                    # Shown in table and modal
strategy: "Brief description"   # Shown in modal
prompt: "Full prompt text..."   # Shown in modal with code formatting
notes:
  - Additional notes
```

**Important**: Player YAML filenames must match player names with spaces replaced by underscores:
- Player "Alice" → `Alice.yaml`
- Player "John Doe" → `John_Doe.yaml`

## Tech Stack

**Zero build tools required** - Just HTML, CSS, and vanilla JavaScript with CDN libraries:

- **Chart.js** (v4) - Data visualization
- **PapaParse** (v5) - CSV parsing
- **js-yaml** (v4) - YAML parsing
- **Vanilla JavaScript** - No framework needed

## File Structure

```
.
├── index.html              # Main page with semantic HTML
├── styles.css              # Responsive styles with theme support
├── app.js                  # All JavaScript logic
├── README.md              # Original exercise instructions
├── SOLUTION.md            # This file
└── data/
    ├── final_standings.csv       # Tournament results
    └── prompt_collection/
        ├── Alice.yaml
        ├── Bob.yaml
        └── Carol.yaml
```

## Implementation Highlights

### Dynamic Sorting
- Three sort modes toggle via buttons
- Pinned player always appears first, regardless of sort
- Visual feedback with active button state

### Visual Indicators
- CSS classes applied conditionally based on player stats
- Emoji indicators for top 3 (🥇🥈🥉) via CSS ::before pseudo-elements
- Fire emoji (🔥) for high win rate via CSS ::after pseudo-element

### Async Data Loading
- CSV parsed first to get player list
- YAML files loaded in parallel for all players
- Enriched player objects cached for performance
- Graceful fallback if YAML missing (shows "N/A")

## Browser Compatibility

Tested and working in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires ES6+ support (async/await, arrow functions, template literals).

## Optional Next Steps

Ideas for enhancement:
- **Player comparison** - Select 2+ players to compare side-by-side
- **Export** - Download filtered results as CSV/JSON
- **Advanced search** - Fuzzy matching, autocomplete
- **Animations** - Smooth chart transitions
- **Persistence** - Save theme preference and pinned player to localStorage
- **Testing** - Unit tests (Jest/Vitest) and E2E tests (Playwright)
- **Backend** - Add Node.js/Python API for dynamic data loading

## Credits

Built as solution to prompt-based game tournament visualization exercise.
