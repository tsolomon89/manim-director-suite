/**
 * ExportUtils - Utilities for exporting images and animations
 * Phase 7: Rendering & Export
 */

/**
 * Export canvas as PNG image
 * @param canvas - Canvas element to export
 * @param filename - Output filename
 * @param width - Optional width (defaults to canvas width)
 * @param height - Optional height (defaults to canvas height)
 */
export function exportCanvasToPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'frame.png',
  width?: number,
  height?: number
): void {
  // If custom dimensions specified, create a temporary canvas
  if (width && height && (width !== canvas.width || height !== canvas.height)) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      throw new Error('Could not get canvas context');
    }

    // Draw scaled image
    tempCtx.drawImage(canvas, 0, 0, width, height);

    // Export from temp canvas
    exportCanvasToFile(tempCanvas, filename);
  } else {
    // Export directly
    exportCanvasToFile(canvas, filename);
  }
}

/**
 * Export canvas to file (internal helper)
 */
function exportCanvasToFile(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Get canvas as data URL
 * @param canvas - Canvas element
 * @param type - Image type (default: 'image/png')
 * @param quality - JPEG quality 0-1 (default: 0.92)
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 0.92
): string {
  return canvas.toDataURL(type, quality);
}

/**
 * Common export resolutions
 */
export const EXPORT_RESOLUTIONS = {
  '720p': { width: 1280, height: 720, label: '720p (HD)' },
  '1080p': { width: 1920, height: 1080, label: '1080p (Full HD)' },
  '1440p': { width: 2560, height: 1440, label: '1440p (2K)' },
  '4k': { width: 3840, height: 2160, label: '4K (Ultra HD)' },
  'square-1080': { width: 1080, height: 1080, label: '1080×1080 (Square)' },
  'square-2160': { width: 2160, height: 2160, label: '2160×2160 (4K Square)' },
} as const;

export type ExportResolution = keyof typeof EXPORT_RESOLUTIONS;

/**
 * Generate filename with timestamp
 * @param prefix - Filename prefix
 * @param extension - File extension (default: 'png')
 */
export function generateTimestampedFilename(
  prefix: string = 'export',
  extension: string = 'png'
): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');

  return `${prefix}_${timestamp}.${extension}`;
}
