// Utility functions for proximity-based tooltip feature

/**
 * Throttle function to limit the rate at which a function can fire
 * Uses requestAnimationFrame for smooth 60fps updates
 */
export const throttleRAF = <T extends (...args: any[]) => void>(func: T) => {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func(...lastArgs);
        }
        rafId = null;
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
};

/**
 * Calculate Euclidean distance between two points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Convert screen coordinates to data space coordinates
 * @param screenX - X coordinate in screen space
 * @param screenY - Y coordinate in screen space
 * @param transform - D3 zoom transform
 * @returns Data space coordinates
 */
export const screenToData = (
  screenX: number,
  screenY: number,
  transform: any
): { x: number; y: number } => {
  // Apply inverse transform to get data coordinates
  const x = (screenX - transform.x) / transform.k;
  const y = (screenY - transform.y) / transform.k;
  return { x, y };
};

/**
 * Check if a point should be considered for proximity
 * based on current filter state
 */
export const isPointVisible = (
  pointId: number,
  filteredProjectIds: Set<number> | null
): boolean => {
  // If no filter is active, all points are visible
  if (filteredProjectIds === null) {
    return true;
  }
  // Otherwise, check if point is in filtered set
  return filteredProjectIds.has(pointId);
};

/**
 * Calculate the proximity radius in data space based on screen pixels and zoom
 * @param screenRadius - Radius in screen pixels (e.g., 45px)
 * @param zoomScale - Current zoom scale factor (transform.k)
 * @returns Radius in data space
 */
export const getDataSpaceRadius = (screenRadius: number, zoomScale: number): number => {
  return screenRadius / zoomScale;
};