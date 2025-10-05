# Phase 2 Testing Guide

## Quick Test Checklist

Open http://localhost:3000 and verify:

### ✅ Grid Rendering
- [ ] Black background with white axes visible
- [ ] Gray major grid lines at integer positions
- [ ] Lighter minor grid lines at 0.2 intervals
- [ ] Axis labels showing coordinates (0, ±1, ±2, etc.)
- [ ] Arrows at the end of X and Y axes

### ✅ Camera Controls

**Pan (Mouse Drag)**:
- [ ] Click and drag anywhere on canvas
- [ ] Cursor changes to "grabbing" during drag
- [ ] Grid moves smoothly with mouse
- [ ] Camera X/Y values update in sidebar
- [ ] No lag or stuttering (60fps)

**Zoom (Mouse Wheel)**:
- [ ] Scroll up to zoom in
- [ ] Scroll down to zoom out
- [ ] Grid zooms towards mouse cursor position
- [ ] Zoom stops at min (0.1x) and max (10.0x)
- [ ] Camera Zoom value updates in sidebar
- [ ] Grid spacing adapts (doesn't get too dense)

**Reset Camera**:
- [ ] Pan and zoom away from origin
- [ ] Click "Reset Camera" button in sidebar
- [ ] Camera returns to (0, 0) at 1.0x zoom
- [ ] Camera info shows X: 0.00, Y: 0.00, Zoom: 1.00x

### ✅ Grid Style Switching

1. **cartesian-dark** (default):
   - [ ] Black background (#000000)
   - [ ] White axes (#FFFFFF)
   - [ ] Gray major grid (#444444)
   - [ ] Dark minor grid (#2A2A2A)
   - [ ] Labels visible

2. **cartesian-light**:
   - [ ] Change dropdown to "Light Cartesian"
   - [ ] White background (#FFFFFF)
   - [ ] Black axes (#000000)
   - [ ] Light gray grids
   - [ ] Dark labels

3. **minimal**:
   - [ ] Change dropdown to "Minimal"
   - [ ] Axes only, no grid lines
   - [ ] No labels
   - [ ] Clean, uncluttered

4. **polar-dark**:
   - [ ] Change dropdown to "Dark Polar"
   - [ ] Darker minor grid (#333333)
   - [ ] No arrows on axes (polar style)

### ✅ Performance

- [ ] FPS counter shows ≥60fps while idle
- [ ] FPS stays ≥50fps during panning
- [ ] FPS stays ≥50fps during zooming
- [ ] No visible stuttering or frame drops
- [ ] Smooth transitions when switching grid styles

### ✅ UI/UX

- [ ] Sidebar scrolls independently
- [ ] Settings panel accordion works
- [ ] Grid style dropdown functional
- [ ] Reset button styled correctly
- [ ] Camera info updates in real-time
- [ ] Canvas fills entire main area

### ✅ Configuration System

Check sidebar settings panel:
- [ ] Color Schemes dropdown (3 options)
- [ ] Easing Curves dropdown (5 options)
- [ ] Warp Functions dropdown (2 options)
- [ ] Camera settings (pan speed, zoom speed)
- [ ] Performance settings (debounce, cache toggle)

## Advanced Tests

### Extreme Zoom In
1. Zoom in 10+ times
2. Verify grid spacing increases (shows fewer, larger squares)
3. Verify labels still readable
4. Verify performance stays smooth

### Extreme Zoom Out
1. Zoom out to minimum (0.1x)
2. Verify grid doesn't become too dense
3. Verify labels don't overlap
4. Verify you can see entire scene bounds

### Edge Panning
1. Pan far to the right (X > 50)
2. Pan far up (Y > 50)
3. Verify grid continues infinitely
4. Verify labels update correctly
5. Verify camera info shows correct values

### Rapid Switching
1. Quickly switch between all 4 grid styles
2. Verify no flashing or artifacts
3. Verify styles apply immediately
4. Verify performance doesn't degrade

## Expected Coordinate System

- **Origin (0, 0)**: Center of screen at default zoom
- **X-axis**: Left negative, right positive
- **Y-axis**: Down negative, up positive (standard math coords)
- **Default bounds**: -10 to +10 in both X and Y
- **Grid spacing**: Major at 1.0, minor at 0.2

## Browser Console

Open browser DevTools (F12) and check:
- [ ] No error messages
- [ ] No warning messages
- [ ] "✅ Configuration loaded successfully" on startup

## Known Working Behavior

✅ **Smooth panning**: Grid follows mouse precisely
✅ **Cursor zoom**: Zooms towards mouse position, not center
✅ **Zoom limits**: Stops at 0.1x and 10.0x
✅ **Live style switching**: Instant grid style updates
✅ **60fps rendering**: Consistent frame rate
✅ **Responsive**: Canvas resizes with window

## Troubleshooting

**Grid not visible?**
- Check that config files loaded (no errors in console)
- Verify grid style is set to one with visible grids
- Try switching to "cartesian-dark"

**Panning not working?**
- Make sure you're clicking on the canvas, not the sidebar
- Cursor should change to "grabbing" during drag

**Zoom not working?**
- Try scrolling over the canvas area
- Check camera zoom limits in config (0.1 - 10.0)

**FPS low?**
- Check if browser is throttling background tabs
- Try disabling browser extensions
- Verify hardware acceleration enabled

**Styles not switching?**
- Check browser console for errors
- Verify all grid style JSON files exist
- Try refreshing the page

---

**All tests passing?** → Phase 2 is complete! 🎉
**Issues found?** → Check browser console and config files
