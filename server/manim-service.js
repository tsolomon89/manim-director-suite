/**
 * Manim Rendering Backend Service
 * Express server that executes Manim CLI and returns rendered frames
 * Phase B: Backend Integration
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5001;
const TEMP_DIR = path.join(__dirname, '../temp/manim');
const PYTHON_COMMAND = process.env.PYTHON_PATH || 'python';
const MANIM_COMMAND = process.env.MANIM_PATH || 'manim';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`✅ Temp directory ready: ${TEMP_DIR}`);
  } catch (error) {
    console.error(`❌ Failed to create temp directory:`, error);
  }
}

/**
 * Health check endpoint - verify Manim is available
 */
app.get('/api/manim/health', async (req, res) => {
  try {
    const version = await getManimVersion();
    res.json({
      status: 'healthy',
      manimAvailable: !!version,
      manimVersion: version,
      tempDir: TEMP_DIR,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      status: 'degraded',
      manimAvailable: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get Manim version
 */
async function getManimVersion() {
  return new Promise((resolve, reject) => {
    // Try using python -m manim first (more reliable on Windows)
    const manim = spawn(PYTHON_COMMAND, ['-m', 'manim', '--version']);
    let output = '';

    manim.stdout.on('data', (data) => {
      output += data.toString();
    });

    manim.stderr.on('data', (data) => {
      output += data.toString();
    });

    manim.on('close', (code) => {
      if (code === 0 || output.includes('Manim Community')) {
        // Extract version from output (e.g., "Manim Community v0.18.0")
        const match = output.match(/v?(\d+\.\d+\.\d+)/);
        resolve(match ? match[1] : 'unknown');
      } else {
        reject(new Error(`Manim not found (exit code ${code})`));
      }
    });

    manim.on('error', (error) => {
      reject(new Error(`Failed to execute Manim: ${error.message}`));
    });
  });
}

/**
 * Main render endpoint - execute Manim script and return PNG
 */
app.post('/api/manim/render', async (req, res) => {
  const startTime = Date.now();
  const { script, quality = 'draft', frameNumber = 0 } = req.body;

  if (!script) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: script',
    });
  }

  // Generate unique ID for this render
  const renderId = crypto.randomBytes(8).toString('hex');
  const scriptPath = path.join(TEMP_DIR, `script_${renderId}.py`);
  const outputDir = path.join(TEMP_DIR, `output_${renderId}`);

  try {
    // Write script to file
    await fs.writeFile(scriptPath, script, 'utf8');
    console.log(`📝 Wrote script: ${scriptPath}`);

    // Map quality to Manim flags
    const qualityFlags = {
      draft: '-ql',   // Low quality (480p)
      medium: '-qm',  // Medium quality (720p)
      high: '-qh',    // High quality (1080p)
      '4k': '-qk',    // 4K quality (2160p)
    };
    const qualityFlag = qualityFlags[quality] || '-ql';

    // Execute Manim
    const outputPath = await executeManim(scriptPath, qualityFlag, outputDir, frameNumber);

    // Read the PNG and convert to base64
    const imageBuffer = await fs.readFile(outputPath);
    const imageDataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Calculate render time
    const renderTimeMs = Date.now() - startTime;

    // Cleanup (optional - keep for debugging during development)
    // await cleanupRenderFiles(scriptPath, outputDir);

    res.json({
      success: true,
      imageDataUrl,
      imagePath: outputPath,
      sizeBytes: imageBuffer.length,
      renderTimeMs,
      quality,
      renderId,
    });

    console.log(`✅ Render complete: ${renderId} (${renderTimeMs}ms)`);
  } catch (error) {
    console.error(`❌ Render failed: ${error.message}`);

    res.status(500).json({
      success: false,
      error: error.message,
      renderTimeMs: Date.now() - startTime,
    });

    // Cleanup on error
    try {
      await cleanupRenderFiles(scriptPath, outputDir);
    } catch (cleanupError) {
      console.error(`⚠️  Cleanup failed:`, cleanupError);
    }
  }
});

/**
 * Animation render endpoint - execute Manim script and return MP4 video
 */
app.post('/api/manim/render-animation', async (req, res) => {
  const startTime = Date.now();
  const { script, quality = 'medium', resolution = '1080p', fps = 30 } = req.body;

  if (!script) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: script',
    });
  }

  // Generate unique ID for this render
  const renderId = crypto.randomBytes(8).toString('hex');
  const scriptPath = path.join(TEMP_DIR, `animation_${renderId}.py`);
  const outputDir = path.join(TEMP_DIR, `video_${renderId}`);

  try {
    // Write script to file
    await fs.writeFile(scriptPath, script, 'utf8');
    console.log(`📝 Wrote animation script: ${scriptPath}`);

    // Map quality to Manim flags
    const qualityFlags = {
      draft: '-ql',   // Low quality (480p)
      medium: '-qm',  // Medium quality (720p)
      high: '-qh',    // High quality (1080p)
      '4k': '-qk',    // 4K quality (2160p)
    };
    const qualityFlag = qualityFlags[quality] || '-qm';

    // Execute Manim for video
    const videoPath = await executeManimVideo(scriptPath, qualityFlag, outputDir, fps);

    // Read the video file
    const videoBuffer = await fs.readFile(videoPath);
    const videoStats = await fs.stat(videoPath);

    // For small videos, send as base64. For large ones, send file path
    const MAX_INLINE_SIZE = 50 * 1024 * 1024; // 50MB
    let videoDataUrl = null;

    if (videoBuffer.length < MAX_INLINE_SIZE) {
      videoDataUrl = `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
    }

    // Calculate render time
    const renderTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      videoPath,
      videoDataUrl,
      sizeBytes: videoBuffer.length,
      sizeMB: (videoStats.size / (1024 * 1024)).toFixed(2),
      renderTimeMs,
      renderTimeSec: (renderTimeMs / 1000).toFixed(1),
      quality,
      resolution,
      fps,
      renderId,
    });

    console.log(`✅ Animation render complete: ${renderId} (${(renderTimeMs / 1000).toFixed(1)}s, ${(videoStats.size / (1024 * 1024)).toFixed(2)}MB)`);

    // Optional: Cleanup after a delay
    // setTimeout(() => cleanupRenderFiles(scriptPath, outputDir), 60000); // Clean up after 1 minute
  } catch (error) {
    console.error(`❌ Animation render failed: ${error.message}`);

    res.status(500).json({
      success: false,
      error: error.message,
      renderTimeMs: Date.now() - startTime,
    });

    // Cleanup on error
    try {
      await cleanupRenderFiles(scriptPath, outputDir);
    } catch (cleanupError) {
      console.error(`⚠️  Cleanup failed:`, cleanupError);
    }
  }
});

/**
 * Execute Manim CLI and return output path
 */
async function executeManim(scriptPath, qualityFlag, outputDir, frameNumber) {
  return new Promise((resolve, reject) => {
    // Manim command: manim -ql -o output_dir script.py SceneName --save_last_frame
    // Note: Quality flags already set the format, use --save_last_frame for static frame
    const args = [
      qualityFlag,
      '-o', outputDir,
      '--save_last_frame', // Only render last frame (static preview)
      scriptPath,
      'PreviewFrame', // Scene class name from ManimScriptBuilder
    ];

    // Use python -m manim for better cross-platform compatibility
    const fullArgs = ['-m', 'manim', ...args];
    console.log(`🎬 Executing: ${PYTHON_COMMAND} ${fullArgs.join(' ')}`);

    const manim = spawn(PYTHON_COMMAND, fullArgs, {
      cwd: TEMP_DIR,
    });

    let stdout = '';
    let stderr = '';

    manim.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Log progress
      if (text.includes('Animation') || text.includes('Rendering')) {
        console.log(`  📊 ${text.trim()}`);
      }
    });

    manim.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    manim.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Manim exited with code ${code}\nStderr: ${stderr}\nStdout: ${stdout}`));
        return;
      }

      try {
        // Find the generated PNG file
        const outputPath = await findGeneratedPNG(outputDir);
        resolve(outputPath);
      } catch (error) {
        reject(new Error(`Failed to find generated PNG: ${error.message}\nStdout: ${stdout}`));
      }
    });

    manim.on('error', (error) => {
      reject(new Error(`Failed to spawn Manim: ${error.message}`));
    });
  });
}

/**
 * Execute Manim CLI for video animation and return output path
 */
async function executeManimVideo(scriptPath, qualityFlag, outputDir, fps) {
  return new Promise((resolve, reject) => {
    // Manim command for video: manim -qm -o output_dir script.py SceneName -r fps
    // Note: Quality flags (-ql, -qm, -qh) already set the format, don't use --format
    const args = [
      qualityFlag,
      '-o', outputDir,
      scriptPath,
      'ParametricAnimation', // Scene class name from ManimGenerator
    ];

    // Use python -m manim for better cross-platform compatibility
    const fullArgs = ['-m', 'manim', ...args];
    console.log(`🎬 Executing video render: ${PYTHON_COMMAND} ${fullArgs.join(' ')}`);

    const manim = spawn(PYTHON_COMMAND, fullArgs, {
      cwd: TEMP_DIR,
    });

    let stdout = '';
    let stderr = '';

    manim.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Log progress
      if (text.includes('Animation') || text.includes('Rendering') || text.includes('%')) {
        console.log(`  📊 ${text.trim()}`);
      }
    });

    manim.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    manim.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Manim exited with code ${code}\nStderr: ${stderr}\nStdout: ${stdout}`));
        return;
      }

      try {
        // Find the generated MP4 file
        const videoPath = await findGeneratedVideo(outputDir);
        resolve(videoPath);
      } catch (error) {
        reject(new Error(`Failed to find generated video: ${error.message}\nStdout: ${stdout}`));
      }
    });

    manim.on('error', (error) => {
      reject(new Error(`Failed to spawn Manim: ${error.message}`));
    });
  });
}

/**
 * Find the generated PNG file in output directory
 */
async function findGeneratedPNG(outputDir) {
  const files = await fs.readdir(outputDir, { recursive: true });

  // Look for PNG files
  const pngFiles = files.filter(f => f.endsWith('.png'));

  if (pngFiles.length === 0) {
    throw new Error(`No PNG files found in ${outputDir}`);
  }

  // Return the first PNG file (should be the rendered frame)
  const pngPath = path.join(outputDir, pngFiles[0]);
  console.log(`  🖼️  Found PNG: ${pngPath}`);

  return pngPath;
}

/**
 * Find the generated MP4 file in output directory
 */
async function findGeneratedVideo(outputDir) {
  const files = await fs.readdir(outputDir, { recursive: true });

  // Look for MP4 files
  const mp4Files = files.filter(f => f.endsWith('.mp4'));

  if (mp4Files.length === 0) {
    throw new Error(`No MP4 files found in ${outputDir}`);
  }

  // Return the first MP4 file (should be the rendered video)
  const mp4Path = path.join(outputDir, mp4Files[0]);
  console.log(`  🎥 Found video: ${mp4Path}`);

  return mp4Path;
}

/**
 * Cleanup temporary files
 */
async function cleanupRenderFiles(scriptPath, outputDir) {
  try {
    await fs.unlink(scriptPath);
    await fs.rm(outputDir, { recursive: true, force: true });
    console.log(`🧹 Cleaned up: ${scriptPath}, ${outputDir}`);
  } catch (error) {
    console.warn(`⚠️  Cleanup warning:`, error.message);
  }
}

/**
 * Start server
 */
async function startServer() {
  await ensureTempDir();

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎬 Manim Rendering Service                                ║
║                                                            ║
║  Status: Running                                           ║
║  Port: ${PORT}                                                 ║
║  Endpoint: http://localhost:${PORT}/api/manim/render        ║
║  Health: http://localhost:${PORT}/api/manim/health          ║
║                                                            ║
║  Temp Dir: ${TEMP_DIR.padEnd(42)}║
║  Manim: ${MANIM_COMMAND.padEnd(47)}║
╚════════════════════════════════════════════════════════════╝
    `);
  });

  // Check Manim availability on startup
  try {
    const version = await getManimVersion();
    console.log(`✅ Manim detected: v${version}`);
  } catch (error) {
    console.warn(`⚠️  Manim not available: ${error.message}`);
    console.warn(`   The service will run, but rendering will fail until Manim is installed.`);
  }
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: error.message,
  });
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
