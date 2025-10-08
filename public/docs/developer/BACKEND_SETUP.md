# Backend Service Setup Guide

## Overview

The Manim renderer requires a backend service to execute Manim scripts and return rendered frames. This guide will help you set up the backend.

## Prerequisites

### 1. Install Manim Community

**Option A: Using pip**
```bash
pip install manim
```

**Option B: Using conda**
```bash
conda install -c conda-forge manim
```

**Verify installation**:
```bash
manim --version
# Should output something like: Manim Community v0.18.0
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

## Quick Start

### Option 1: Single Command (Recommended) ⭐

Start both frontend and backend with one command:

```bash
npm run dev:full
```

You should see color-coded output:
```
[web] VITE v5.4.20  ready in 1245 ms
[web] ➜  Local:   http://localhost:5000/
[api] ╔════════════════════════════════════════════════════════════╗
[api] ║  🎬 Manim Rendering Service                                ║
[api] ║  Status: Running                                           ║
[api] ║  Port: 5001                                                ║
[api] ╚════════════════════════════════════════════════════════════╝
[api] ✅ Manim detected: v0.18.0
```

**Benefits**:
- ✅ One terminal instead of two
- ✅ Color-coded output (cyan = frontend, magenta = backend)
- ✅ Ctrl+C kills both processes

### Option 2: Separate Terminals

**Terminal 1 - Backend**:
```bash
npm run server
# Or: cd server && npm start
```

**Terminal 2 - Frontend**:
```bash
npm run dev
```

The frontend will automatically detect the backend service and enable Manim rendering.

## Using the Manim Features

### 1. Video Export (Primary Use)

1. **Open the app** at http://localhost:5000
2. **Create an animation** (add parameters and keyframes)
3. **Click "🎬 Manim"** button in header
4. **Configure settings**:
   - Resolution: 720p, 1080p, 1440p, 4K
   - Frame Rate: 24, 30, 60 fps
   - Quality: Draft, Medium, High
5. **Click "🎬 Render Video"**
6. **Watch progress bar** (30-60s typical)
7. **MP4 auto-downloads** when complete!

### 2. Manim Renderer Mode (Viewport Preview)

1. **Check renderer status** - Look for the renderer indicator in the top-right corner
2. **Switch to Manim mode**:
   - Click the renderer indicator
   - Select "Manim Renderer"
   - The indicator should show green (✅ Ready)
3. **Test rendering**:
   - Add a function (e.g., `y = sin(x)`)
   - The viewport should render using Manim
   - You'll see "Rendering with Manim..." while it processes
   - First render will be slow (~2-5 seconds), subsequent renders use cache

## Configuration

### Custom Manim Path

If Manim is not in your PATH:

**Linux/Mac**:
```bash
MANIM_PATH=/path/to/manim npm start
```

**Windows** (PowerShell):
```powershell
$env:MANIM_PATH="C:\Path\To\manim.exe"; npm start
```

### Custom Port

Default port is 3001. To change:

```bash
PORT=3002 npm start
```

Then update the frontend API endpoint in `src/scene/ManimRenderer.ts`:
```typescript
this.apiEndpoint = '/api/manim/render'; // Change to http://localhost:3002
```

## Troubleshooting

### Backend: "Manim not found"

**Check if Manim is installed**:
```bash
which manim  # Linux/Mac
where manim  # Windows
```

**If not in PATH**, specify the full path:
```bash
MANIM_PATH=/usr/local/bin/manim npm start
```

### Frontend: "Manim backend service not reachable"

**Check if backend is running**:
```bash
curl http://localhost:5001/api/manim/health
```

Should return:
```json
{
  "status": "healthy",
  "manimAvailable": true,
  "manimVersion": "0.18.0"
}
```

**If backend is not running**, start it:
```bash
cd server
npm start
```

### Rendering Errors

**Check backend logs** - The server outputs detailed logs:
```
📝 Wrote script: /path/to/script_abc123.py
🎬 Executing: manim -ql script.py PreviewFrame
❌ Render failed: ...
```

**Common issues**:
1. **Syntax errors in generated script** - Check `temp/manim/script_*.py`
2. **Missing dependencies** - Ensure Manim dependencies are installed
3. **Permission errors** - Ensure temp directory is writable

### Slow Rendering

**First render is always slow** (~2-5 seconds) because:
- Manim initializes
- Fonts/assets are loaded
- Python interpreter starts

**Subsequent renders should be faster** due to:
- Frame caching (check cache hit rate in renderer toggle)
- Manim's internal caching

**To improve performance**:
1. Use draft quality for previews
2. Enable frame caching (default: 100 frames)
3. Consider using hybrid mode (Canvas + Manim overlay)

## Development Mode

### Auto-reload Backend

```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

### Debug Mode

Set environment variable for verbose Manim output:

```bash
MANIM_VERBOSE=1 npm start
```

### Inspect Generated Scripts

Scripts are saved in `temp/manim/`:
```
temp/manim/
├── script_abc123.py       # Generated Python script
├── output_abc123/         # Manim output directory
│   └── PreviewFrame_0000.png
```

To prevent cleanup (for debugging):

Edit `server/manim-service.js` line ~155:
```javascript
// Comment out cleanup
// await cleanupRenderFiles(scriptPath, outputDir);
```

## Production Deployment

### Docker (Recommended)

Create `server/Dockerfile`:
```dockerfile
FROM manimcommunity/manim:latest

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t manim-service ./server
docker run -p 3001:3001 manim-service
```

### PM2 (Process Manager)

```bash
npm install -g pm2
cd server
pm2 start manim-service.js --name manim-backend
pm2 save
pm2 startup  # Auto-start on boot
```

## API Reference

See [server/README.md](server/README.md) for detailed API documentation.

## Next Steps

- [Test the renderer](#using-the-manim-renderer)
- [Check cache performance](./MANIM_RENDERER_IMPLEMENTATION.md#performance-optimizations)
- [Explore 3Blue1Brown patterns](./videos-master/README.md)
