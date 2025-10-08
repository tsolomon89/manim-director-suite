# Export & Rendering

Export your animations as PNG images or render MP4 videos with Manim.

## PNG Export

Export a single frame as a high-resolution image.

### Steps

1. Click **📸 PNG** button in the header
2. Choose resolution:
   - 720p (HD)
   - 1080p (Full HD) — Recommended
   - 1440p (2K)
   - 4K (Ultra HD)
   - Custom resolution
3. Set filename (auto-timestamped)
4. Click **📸 Export Image**
5. PNG file downloads automatically

### Use Cases

- Screenshots for documentation
- Social media posts
- Presentation slides
- High-quality stills

---

## Manim Video Export ⭐ NEW

Render full animations as MP4 videos with 1-click!

### Prerequisites

Backend rendering service must be running:
```bash
npm run dev:full
```

Or start backend separately:
```bash
npm run server
```

**Note**: Requires [Manim Community](https://docs.manim.community/) installed:
```bash
pip install manim
```

### Steps

1. Create keyframes with parameter changes
2. Click **🎬 Manim** button in header
3. Configure settings:
   - **Resolution**: 720p, 1080p, 1440p, 4K
   - **Frame Rate**: 24, 30, 60 fps
   - **Quality**: Draft, Medium, High
   - **Background Color**: Hex color picker
4. Click **🎬 Render Video**
5. Watch progress bar:
   - "Generating script..."
   - "Rendering with Manim..."
   - "Complete!"
6. MP4 auto-downloads after 30-60 seconds

### Progress Tracking

Real-time progress updates:
- **Stage**: Generating → Uploading → Rendering → Complete
- **Percent**: 10% → 30% → 100%
- **Message**: Shows render time and file size

### Fallback: Script Download

If backend unavailable:
1. Warning appears: "⚠️ Backend Not Available"
2. Click **📄 Download Script** instead
3. Run manually:
   ```bash
   manim -qm animation_manim.py ParametricAnimation
   ```

### Render Times

| Quality | Resolution | Typical Time | File Size |
|---------|-----------|--------------|-----------|
| Draft   | 480p      | 10-20s       | 1-2MB     |
| Medium  | 720p      | 30-60s       | 3-5MB     |
| High    | 1080p     | 60-120s      | 8-15MB    |
| 4K      | 2160p     | 2-5min       | 20-50MB   |

*(For 10-second animation)*

### Troubleshooting

**"Backend Not Available"**
- Start backend: `npm run server`
- Check port 5001 is free
- Verify Manim installed: `manim --version`

**"Render timeout"**
- Increase timeout in config: `export.timeoutSeconds`
- Use lower quality setting
- Simplify animation complexity

**"Manim exited with code 1"**
- Check server logs for details
- Test script manually
- Verify Python dependencies

---

## Coming Soon

- Live preview before render
- Render queue management
- Cloud rendering option
- GIF export format
- Batch rendering multiple scenes
