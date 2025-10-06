# Manim Rendering Service

Backend service for executing Manim scripts and returning rendered frames.

## Prerequisites

1. **Manim Community** must be installed:
   ```bash
   pip install manim
   # or
   conda install -c conda-forge manim
   ```

2. **Node.js** (already installed for the main project)

## Installation

```bash
cd server
npm install
```

## Usage

### Start the service

```bash
npm start
```

### Development mode (with auto-reload)

```bash
npm run dev
```

### Custom Manim path

If Manim is not in your PATH:

```bash
MANIM_PATH=/path/to/manim npm start
```

### Custom port

```bash
PORT=3001 npm start
```

## API Endpoints

### Health Check

**GET** `/api/manim/health`

Returns:
```json
{
  "status": "healthy",
  "manimAvailable": true,
  "manimVersion": "0.18.0",
  "tempDir": "/path/to/temp",
  "timestamp": "2025-10-06T..."
}
```

### Render Frame

**POST** `/api/manim/render`

Request body:
```json
{
  "script": "from manim import *\n\nclass PreviewFrame(Scene):\n    def construct(self):\n        ...",
  "quality": "draft",
  "frameNumber": 0
}
```

Response:
```json
{
  "success": true,
  "imageDataUrl": "data:image/png;base64,...",
  "imagePath": "/path/to/output.png",
  "sizeBytes": 12345,
  "renderTimeMs": 234,
  "quality": "draft",
  "renderId": "abc123..."
}
```

## Configuration

- **Port**: Default 3001 (set via `PORT` env var)
- **Temp Directory**: `../temp/manim` (relative to server directory)
- **Manim Command**: `manim` (set via `MANIM_PATH` env var)

## Quality Levels

- `draft`: 480p, fast rendering (-ql)
- `medium`: 720p, balanced (-qm)
- `high`: 1080p, high quality (-qh)
- `4k`: 2160p, production quality (-qk)

## Troubleshooting

### "Manim not found"

Ensure Manim is installed and in your PATH:

```bash
manim --version
```

If not in PATH, specify the full path:

```bash
MANIM_PATH=/usr/local/bin/manim npm start
```

### "Permission denied"

Ensure the temp directory is writable:

```bash
mkdir -p temp/manim
chmod 755 temp/manim
```

### Port already in use

Change the port:

```bash
PORT=3002 npm start
```

## Development

### Logs

The service logs all render requests and Manim output to console:

```
📝 Wrote script: /path/to/script_abc123.py
🎬 Executing: manim -ql -o /path/to/output script.py PreviewFrame
  📊 Animation 0: Rendering frame...
  🖼️  Found PNG: /path/to/output/PreviewFrame_0000.png
✅ Render complete: abc123 (234ms)
```

### Cleanup

Temporary files are cleaned up after each render (disabled during development for debugging).

To manually clean:

```bash
rm -rf temp/manim/*
```
