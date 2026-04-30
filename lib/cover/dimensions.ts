// KDP cover dimension calculator.
// All inputs in inches. Output also includes 300 DPI pixel dimensions.

export type PaperType = "bw_white" | "bw_cream" | "color_standard" | "color_premium";
export type Finish = "gloss" | "matte";

export interface PaperbackInput {
  trimWidth: number;       // inches, e.g., 6
  trimHeight: number;      // inches, e.g., 9
  pageCount: number;       // e.g., 220
  paperType: PaperType;
  bleed: boolean;          // KDP bleed = 0.125 in on outer edges + top/bottom
  barcodeReserve: boolean; // reserve bottom-right of back cover
  finish?: Finish;
}

export interface CoverDimensions {
  trimWidth: number;
  trimHeight: number;
  pageCount: number;
  paperType: PaperType;
  bleed: boolean;
  barcodeReserve: boolean;
  finish: Finish;

  // computed (inches)
  spineWidth: number;        // inch
  bleedInches: number;       // 0.125 if bleed else 0
  totalWidth: number;        // back + spine + front + 2*bleed
  totalHeight: number;       // trimHeight + 2*bleed
  safeMargin: number;        // 0.25 in safe zone from trim
  spineSafeMargin: number;   // recommended text-safe inset for spine
  barcodeBox?: {             // back-cover, in cover-coords (origin: bottom-left of full cover)
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // computed (pixels at 300 DPI)
  px: {
    totalWidth: number;
    totalHeight: number;
    spineWidth: number;
    bleed: number;
    safeMargin: number;
    backWidth: number;       // visible back area width (= trimWidth)
    frontWidth: number;      // visible front area width (= trimWidth)
  };
}

const SPINE_PER_PAGE: Record<PaperType, number> = {
  bw_white:        0.002252,
  bw_cream:        0.0025,
  color_standard:  0.002347,
  color_premium:   0.002347
};

export function computePaperback(input: PaperbackInput): CoverDimensions {
  const { trimWidth, trimHeight, pageCount, paperType, bleed, barcodeReserve } = input;
  const finish: Finish = input.finish ?? "matte";

  if (trimWidth <= 0 || trimHeight <= 0 || pageCount <= 0) {
    throw new Error("trimWidth, trimHeight, and pageCount must be > 0");
  }

  const bleedInches = bleed ? 0.125 : 0;
  const spineWidth = pageCount * SPINE_PER_PAGE[paperType];
  const totalWidth = trimWidth * 2 + spineWidth + bleedInches * 2;
  const totalHeight = trimHeight + bleedInches * 2;
  const safeMargin = 0.25;
  const spineSafeMargin = pageCount >= 100 ? 0.0625 : 0; // KDP requires >= 100 pages for spine text

  const dpi = 300;
  const toPx = (v: number) => Math.round(v * dpi);

  // Barcode reserve is 2.0 in × 1.2 in, on the back cover, 0.25 in margin from trim edge.
  // Back cover spans from x = bleedInches to x = bleedInches + trimWidth.
  // We place the barcode box flush near the bottom-right of the back cover area.
  const barcodeBox = barcodeReserve
    ? {
        // 0.25 in inset from the right edge of the back cover (which is the spine fold)
        x: bleedInches + trimWidth - 2.0 - 0.25,
        // 0.25 in inset from the bottom of the trim, which is bleedInches
        y: bleedInches + 0.25,
        width: 2.0,
        height: 1.2
      }
    : undefined;

  return {
    trimWidth,
    trimHeight,
    pageCount,
    paperType,
    bleed,
    barcodeReserve,
    finish,
    spineWidth,
    bleedInches,
    totalWidth,
    totalHeight,
    safeMargin,
    spineSafeMargin,
    barcodeBox,
    px: {
      totalWidth: toPx(totalWidth),
      totalHeight: toPx(totalHeight),
      spineWidth: toPx(spineWidth),
      bleed: toPx(bleedInches),
      safeMargin: toPx(safeMargin),
      backWidth: toPx(trimWidth),
      frontWidth: toPx(trimWidth)
    }
  };
}

export interface EbookDimensions {
  pixelWidth: 1600;
  pixelHeight: 2560;
  ratio: "1.6:1";
}

export function ebookPreset(): EbookDimensions {
  return { pixelWidth: 1600, pixelHeight: 2560, ratio: "1.6:1" };
}

export const TRIM_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "5 × 8 in", w: 5, h: 8 },
  { label: "5.5 × 8.5 in", w: 5.5, h: 8.5 },
  { label: "6 × 9 in", w: 6, h: 9 },
  { label: "7 × 10 in", w: 7, h: 10 },
  { label: "8.5 × 11 in", w: 8.5, h: 11 }
];
