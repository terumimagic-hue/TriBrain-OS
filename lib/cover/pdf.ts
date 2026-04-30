import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import type { CoverDimensions } from "./dimensions";

const DPI = 72; // PDF user units are 1/72 inch

function inchesToUnits(v: number): number {
  return v * DPI;
}

export async function renderPaperbackTemplatePDF(dim: CoverDimensions, label: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([
    inchesToUnits(dim.totalWidth),
    inchesToUnits(dim.totalHeight)
  ]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const { totalWidth, totalHeight, bleedInches, safeMargin, spineWidth, trimWidth } = dim;
  const W = inchesToUnits(totalWidth);
  const H = inchesToUnits(totalHeight);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: rgb(0.97, 0.97, 0.98)
  });

  // Bleed lines (outer edge -> trim edge)
  if (bleedInches > 0) {
    const b = inchesToUnits(bleedInches);
    page.drawRectangle({
      x: b,
      y: b,
      width: W - 2 * b,
      height: H - 2 * b,
      borderColor: rgb(1, 0.4, 0.4),
      borderWidth: 1,
      color: undefined
    });
  }

  // Spine fold lines (vertical)
  const spineLeft = inchesToUnits(bleedInches + trimWidth);
  const spineRight = inchesToUnits(bleedInches + trimWidth + spineWidth);
  page.drawLine({
    start: { x: spineLeft, y: 0 },
    end: { x: spineLeft, y: H },
    color: rgb(0.2, 0.2, 0.8),
    thickness: 0.7
  });
  page.drawLine({
    start: { x: spineRight, y: 0 },
    end: { x: spineRight, y: H },
    color: rgb(0.2, 0.2, 0.8),
    thickness: 0.7
  });

  // Safe zone (back + front)
  const sm = inchesToUnits(safeMargin);
  // Back cover safe rect
  page.drawRectangle({
    x: inchesToUnits(bleedInches) + sm,
    y: inchesToUnits(bleedInches) + sm,
    width: inchesToUnits(trimWidth) - 2 * sm,
    height: inchesToUnits(dim.trimHeight) - 2 * sm,
    borderColor: rgb(0.2, 0.7, 0.3),
    borderWidth: 0.6,
    color: undefined
  });
  // Front cover safe rect
  page.drawRectangle({
    x: spineRight + sm,
    y: inchesToUnits(bleedInches) + sm,
    width: inchesToUnits(trimWidth) - 2 * sm,
    height: inchesToUnits(dim.trimHeight) - 2 * sm,
    borderColor: rgb(0.2, 0.7, 0.3),
    borderWidth: 0.6,
    color: undefined
  });

  // Spine safe zone (only if pageCount qualifies)
  if (dim.spineSafeMargin > 0 && spineWidth > 0) {
    const ssm = inchesToUnits(dim.spineSafeMargin);
    page.drawRectangle({
      x: spineLeft + ssm,
      y: inchesToUnits(bleedInches) + sm,
      width: inchesToUnits(spineWidth) - 2 * ssm,
      height: inchesToUnits(dim.trimHeight) - 2 * sm,
      borderColor: rgb(0.7, 0.5, 0.1),
      borderWidth: 0.5,
      color: undefined
    });
  }

  // Barcode reserve box
  if (dim.barcodeBox) {
    const b = dim.barcodeBox;
    page.drawRectangle({
      x: inchesToUnits(b.x),
      y: inchesToUnits(b.y),
      width: inchesToUnits(b.width),
      height: inchesToUnits(b.height),
      color: rgb(1, 1, 1),
      borderColor: rgb(0.1, 0.1, 0.1),
      borderWidth: 0.7
    });
    page.drawText("BARCODE — keep clear", {
      x: inchesToUnits(b.x) + 6,
      y: inchesToUnits(b.y) + inchesToUnits(b.height) - 12,
      size: 8,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });
  }

  // Labels
  const tinyText = (text: string, x: number, y: number, size = 8, f = font, color = rgb(0.2, 0.2, 0.2)) =>
    page.drawText(text, { x, y, size, font: f, color });

  tinyText("BACK COVER", inchesToUnits(bleedInches) + sm + 4, H - 14, 9, bold);
  tinyText("FRONT COVER", spineRight + sm + 4, H - 14, 9, bold);
  tinyText("SPINE", spineLeft + 2, H / 2, 8, bold);

  tinyText(label, 8, 8, 8, font);
  tinyText(
    `${dim.totalWidth.toFixed(3)} × ${dim.totalHeight.toFixed(3)} in   |   spine ${dim.spineWidth.toFixed(3)} in   |   ${dim.px.totalWidth} × ${dim.px.totalHeight} px @ 300dpi`,
    8,
    20,
    8,
    font
  );

  return pdf.save();
}

export async function renderEbookTemplatePDF(label: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  // 1600 × 2560 px at 300dpi = 5.333 × 8.533 inches.
  const wIn = 1600 / 300;
  const hIn = 2560 / 300;
  const page = pdf.addPage([wIn * DPI, hIn * DPI]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: wIn * DPI,
    height: hIn * DPI,
    color: rgb(0.97, 0.97, 0.98)
  });
  page.drawText("EBOOK COVER", { x: 12, y: hIn * DPI - 22, size: 14, font: bold });
  page.drawText("Fixed preset: 1600 × 2560 px (1.6:1)", { x: 12, y: 12, size: 9, font });
  return pdf.save();
}
