export type ElementType = "title" | "subtitle" | "author" | "spine_text" | "back_text";
export type Align = "left" | "center" | "right";

export interface CoverElement {
  type: ElementType;
  text: string;
  // Position is in normalized coords for the area it lives in (0..1).
  // For ebook + paperback front, the area is the front cover trim rectangle.
  // For spine_text, the area is the spine rectangle.
  // For back_text, the area is the back cover trim rectangle.
  x?: number;
  y?: number;
  width?: number;        // 0..1 wrap box width
  fontSize?: number;     // px
  color?: string;        // CSS color
  fontFamily?: string;
  weight?: number | "bold" | "normal";
  align?: Align;
  lineHeight?: number;
  letterSpacing?: number;
  rotateDeg?: number;    // for spine_text, 90 or -90
}

export interface BackgroundConfig {
  color?: string;        // hex like "#222222"
  imageId?: string;      // uploaded asset id, full or wrap layout
  imageMode?: "front_only" | "wraparound";
  vignette?: boolean;    // optional darkening overlay
  overlayColor?: string; // semi-transparent overlay color
  overlayOpacity?: number; // 0..1
}

export interface EbookCoverConfig {
  background: BackgroundConfig;
  elements: CoverElement[];
}

export interface PaperbackCoverConfig {
  background: BackgroundConfig;
  elements: CoverElement[];
  showGuides?: boolean;
}
