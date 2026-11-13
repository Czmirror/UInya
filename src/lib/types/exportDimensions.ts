// Defines the shared pixel limits for the export controls and renderers.

export const MIN_EXPORT_SIZE = 64;
export const MAX_EXPORT_SIZE = 4096;

/** Returns whether a dimension is a supported whole number of pixels. */
export function isExportSize(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_EXPORT_SIZE && value <= MAX_EXPORT_SIZE;
}
