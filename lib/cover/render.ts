import sharp from "sharp";
import { PDFDocument, rgb } from "pdf-lib";
import { promises as fs } from "node:fs";
import path from "node:path";
import { exportDir } from "../db/client";
import type { CoverDimensions } from "./dimensions";
import type {
  CoverElement,
  EbookCoverConfig,
  PaperbackCoverConfig,
  BackgroundConfig
} from "./elements";

const DPI = 300;
const EBOOK_W = 1600;
const EBOOK_H = 2560;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fontFamily(name?: string): string {
  // Sane CSS font stack with multilingual fallbacks
  const stack = name && name.trim() ? `${name},` : "";
  return `${stack} 'DejaVu Sans', 'Liberation Sans', 'Noto Sans CJK JP', 'Noto Sans', sans-serif`;
}

// Build SVG element for a text element placed inside a target rectangle in pixels.
function svgTextBlock(
  el: CoverElement,
  targetW: number,
  targetH: number,
  offsetX = 0,
  offsetY = 0
): string {
  const text = el.text || "";
  if (!text.trim()) return "";

  const fontSize = el.fontSize ?? defaultFontSize(el.type, targetW);
  const color = el.color ?? defaultColor(el.type);
  const align = el.align ?? defaultAlign(el.type);
  const weight = el.weight ?? (el.type === "title" ? "bold" : "normal");
  const ff = fontFamily(el.fontFamily);
  const x = (el.x ?? defaultX(el.type)) * targetW + offsetX;
  const y = (el.y ?? defaultY(el.type)) * targetH + offsetY;
  const wrapWidth = (el.width ?? 0.85) * targetW;
  const lineHeight = el.lineHeight ?? 1.15;
  const letterSpacing = el.letterSpacing ?? 0;

  const lines = wrap(text, wrapWidth, fontSize);
  const anchor =
    align === "center" ? "middle" : align === "right" ? "end" : "start";

  const startY = y;
  const tspans = lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : Math.round(fontSize * lineHeight);
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  const transform = el.rotateDeg
    ? `transform="rotate(${el.rotateDeg} ${x} ${startY})"`
    : "";

  return `<text x="${x}" y="${startY}" ${transform}
    font-family="${ff}" font-size="${fontSize}" font-weight="${weight}"
    fill="${escapeXml(color)}" text-anchor="${anchor}"
    ${letterSpacing ? `letter-spacing="${letterSpacing}"` : ""}
    style="paint-order: stroke; stroke: rgba(0,0,0,0); stroke-width: 0;">${tspans}</text>`;
}

// Naive word-wrap by approximate character width
function wrap(text: string, maxWidth: number, fontSize: number): string[] {
  const approxCharWidth = fontSize * 0.55;
  const maxChars = Math.max(6, Math.floor(maxWidth / approxCharWidth));
  const lines: string[] = [];
  // Respect explicit \n first
  for (const block of text.split(/\n/)) {
    if (!block.trim()) {
      lines.push("");
      continue;
    }
    const words = block.split(/\s+/);
    let line = "";
    for (const w of words) {
      if (!line) {
        line = w;
      } else if ((line + " " + w).length <= maxChars) {
        line += " " + w;
      } else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function defaultFontSize(type: CoverElement["type"], targetW: number): number {
  switch (type) {
    case "title":     return Math.round(targetW * 0.10);
    case "subtitle":  return Math.round(targetW * 0.045);
    case "author":    return Math.round(targetW * 0.04);
    case "spine_text":return Math.round(targetW * 0.55);
    case "back_text": return Math.round(targetW * 0.025);
  }
}
function defaultColor(type: CoverElement["type"]): string {
  return type === "back_text" ? "#dddddd" : "#ffffff";
}
function defaultAlign(type: CoverElement["type"]): "left" | "center" | "right" {
  if (type === "back_text") return "left";
  return "center";
}
function defaultX(type: CoverElement["type"]): number {
  if (type === "back_text") return 0.08;
  return 0.5;
}
function defaultY(type: CoverElement["type"]): number {
  switch (type) {
    case "title":     return 0.22;
    case "subtitle":  return 0.36;
    case "author":    return 0.92;
    case "spine_text":return 0.5;
    case "back_text": return 0.15;
  }
}

async function loadAsset(assetPath: string | undefined | null): Promise<Buffer | null> {
  if (!assetPath) return null;
  try {
    return await fs.readFile(assetPath);
  } catch {
    return null;
  }
}

async function backgroundLayer(
  bg: BackgroundConfig,
  width: number,
  height: number,
  uploaded: Buffer | null,
  paperbackContext?: { backX: number; backW: number; spineX: number; spineW: number; frontX: number; frontW: number }
): Promise<Buffer> {
  // Solid base
  const baseColor = bg.color || "#0b0b10";
  let layer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: baseColor
    }
  }).png().toBuffer();

  if (uploaded) {
    if (bg.imageMode === "wraparound" || !paperbackContext) {
      // Resize image to cover the full canvas
      const fit = await sharp(uploaded)
        .resize(width, height, { fit: "cover" })
        .toBuffer();
      layer = await sharp(layer)
        .composite([{ input: fit, top: 0, left: 0 }])
        .png()
        .toBuffer();
    } else {
      // Place image only on the front cover area; back cover gets baseColor
      const frontImg = await sharp(uploaded)
        .resize(paperbackContext.frontW, height, { fit: "cover" })
        .toBuffer();
      layer = await sharp(layer)
        .composite([{ input: frontImg, top: 0, left: paperbackContext.frontX }])
        .png()
        .toBuffer();
    }
  }

  if (bg.overlayColor && (bg.overlayOpacity ?? 0) > 0) {
    const opacity = Math.min(1, Math.max(0, bg.overlayOpacity ?? 0.3));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${bg.overlayColor}" fill-opacity="${opacity}" />
    </svg>`;
    layer = await sharp(layer)
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toBuffer();
  }

  if (bg.vignette) {
    const vignetteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <radialGradient id="g" cx="50%" cy="55%" r="75%">
          <stop offset="55%" stop-color="black" stop-opacity="0" />
          <stop offset="100%" stop-color="black" stop-opacity="0.55" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>`;
    layer = await sharp(layer)
      .composite([{ input: Buffer.from(vignetteSvg) }])
      .png()
      .toBuffer();
  }

  return layer;
}

export async function renderEbook(
  config: EbookCoverConfig,
  assetPath: string | null
): Promise<{ png: Buffer; jpg: Buffer }> {
  const uploaded = await loadAsset(assetPath);
  const bg = await backgroundLayer(config.background, EBOOK_W, EBOOK_H, uploaded);

  const overlays = config.elements
    .filter((e) => e.type !== "spine_text" && e.type !== "back_text")
    .map((e) => svgTextBlock(e, EBOOK_W, EBOOK_H))
    .join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${EBOOK_W}" height="${EBOOK_H}">${overlays}</svg>`;

  const png = await sharp(bg)
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toBuffer();
  const jpg = await sharp(png).jpeg({ quality: 92 }).toBuffer();
  return { png, jpg };
}

export interface PaperbackRenderResult {
  pngPreview: Buffer;
  pngFlat: Buffer;
  pdf: Uint8Array;
}

export async function renderPaperback(
  dim: CoverDimensions,
  config: PaperbackCoverConfig,
  assetPath: string | null
): Promise<PaperbackRenderResult> {
  const W = dim.px.totalWidth;
  const H = dim.px.totalHeight;
  const bleed = dim.px.bleed;
  const trimWpx = dim.px.frontWidth;
  const spineWpx = dim.px.spineWidth;

  // Coordinates of each region (in pixels, origin top-left)
  const backX = bleed;
  const backW = trimWpx;
  const spineX = bleed + trimWpx;
  const frontX = bleed + trimWpx + spineWpx;
  const frontW = trimWpx;
  const trimHpx = H - 2 * bleed;

  const uploaded = await loadAsset(assetPath);
  const bg = await backgroundLayer(
    config.background,
    W,
    H,
    uploaded,
    { backX, backW, spineX, spineW: spineWpx, frontX, frontW }
  );

  const svgParts: string[] = [];
  for (const el of config.elements) {
    if (el.type === "spine_text") {
      svgParts.push(svgTextBlock(el, spineWpx, trimHpx, spineX, bleed));
    } else if (el.type === "back_text") {
      svgParts.push(svgTextBlock(el, backW, trimHpx, backX, bleed));
    } else {
      svgParts.push(svgTextBlock(el, frontW, trimHpx, frontX, bleed));
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svgParts.join("\n")}</svg>`;
  const flat = await sharp(bg)
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toBuffer();

  // Optional preview with guides
  let preview = flat;
  if (config.showGuides) {
    const guideSvg = guideOverlay(W, H, dim, { backX, spineX, frontX, frontW, backW, spineWpx, trimHpx, bleed });
    preview = await sharp(flat)
      .composite([{ input: Buffer.from(guideSvg) }])
      .png()
      .toBuffer();
  }

  // Build print-ready PDF: page is exactly the print dimensions
  const pdf = await PDFDocument.create();
  const widthPts = dim.totalWidth * 72;
  const heightPts = dim.totalHeight * 72;
  const page = pdf.addPage([widthPts, heightPts]);
  const png = await pdf.embedPng(flat);
  page.drawImage(png, {
    x: 0,
    y: 0,
    width: widthPts,
    height: heightPts
  });
  // Optional crop marks at 0.125 in inset (only if no bleed already drawn)
  if (dim.bleed) {
    page.drawLine({
      start: { x: 0, y: dim.bleedInches * 72 },
      end: { x: 18, y: dim.bleedInches * 72 },
      thickness: 0.5,
      color: rgb(0, 0, 0)
    });
  }
  const pdfBytes = await pdf.save();

  return { pngPreview: preview, pngFlat: flat, pdf: pdfBytes };
}

function guideOverlay(
  W: number,
  H: number,
  dim: CoverDimensions,
  ctx: {
    backX: number;
    spineX: number;
    frontX: number;
    frontW: number;
    backW: number;
    spineWpx: number;
    trimHpx: number;
    bleed: number;
  }
): string {
  const sm = dim.px.safeMargin;
  const safeRect = (x: number, w: number, fill = "none") =>
    `<rect x="${x + sm}" y="${ctx.bleed + sm}" width="${w - 2 * sm}" height="${ctx.trimHpx - 2 * sm}" fill="${fill}" stroke="rgba(80,255,140,0.7)" stroke-width="2" stroke-dasharray="6 6" />`;

  let barcodeBoxSvg = "";
  if (dim.barcodeBox) {
    // barcodeBox is in inches with origin at bottom-left of the full cover.
    // Convert to top-left pixel space.
    const bx = dim.barcodeBox.x * DPI;
    const by = (dim.totalHeight - dim.barcodeBox.y - dim.barcodeBox.height) * DPI;
    const bw = dim.barcodeBox.width * DPI;
    const bh = dim.barcodeBox.height * DPI;
    barcodeBoxSvg = `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="rgba(255,255,255,0.85)" stroke="black" stroke-width="2" />
      <text x="${bx + 12}" y="${by + 28}" font-family="sans-serif" font-size="22" fill="black">BARCODE — keep clear</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <!-- bleed -->
    <rect x="${ctx.bleed}" y="${ctx.bleed}" width="${W - 2 * ctx.bleed}" height="${ctx.trimHpx}" fill="none" stroke="rgba(255,80,80,0.7)" stroke-width="2" />
    <!-- spine fold lines -->
    <line x1="${ctx.spineX}" y1="0" x2="${ctx.spineX}" y2="${H}" stroke="rgba(120,140,255,0.7)" stroke-width="1.5" stroke-dasharray="10 6" />
    <line x1="${ctx.spineX + ctx.spineWpx}" y1="0" x2="${ctx.spineX + ctx.spineWpx}" y2="${H}" stroke="rgba(120,140,255,0.7)" stroke-width="1.5" stroke-dasharray="10 6" />
    <!-- safe rects -->
    ${safeRect(ctx.backX, ctx.backW)}
    ${safeRect(ctx.frontX, ctx.frontW)}
    ${barcodeBoxSvg}
  </svg>`;
}

export async function uploadsDir(projectId: string): Promise<string> {
  const dir = path.join(await exportDir(), projectId, "uploads");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function coverOutDir(projectId: string): Promise<string> {
  const dir = path.join(await exportDir(), projectId, "cover");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
