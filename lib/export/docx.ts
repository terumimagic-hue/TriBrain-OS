import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType
} from "docx";
import type { BookProjectRow, ChapterRow } from "../db/models";

export async function manuscriptDocx(project: BookProjectRow, chapters: ChapterRow[]): Promise<Buffer> {
  const titleText = project.title || project.working_title;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: titleText, bold: true, size: 56 })]
    })
  );
  children.push(new Paragraph({ children: [new TextRun(" ")] }));

  for (const c of chapters) {
    const body = c.revised || c.draft || "";
    if (!body.trim()) continue;
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        children: [new TextRun({ text: c.heading, bold: true })]
      })
    );
    for (const block of body.split(/\n{2,}/)) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      if (/^#{1,6}\s/.test(trimmed)) {
        const m = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (m) {
          const level = m[1].length;
          const text = m[2];
          const lvl =
            level <= 1 ? HeadingLevel.HEADING_1 :
            level === 2 ? HeadingLevel.HEADING_2 :
            level === 3 ? HeadingLevel.HEADING_3 :
            HeadingLevel.HEADING_4;
          children.push(new Paragraph({ heading: lvl, children: [new TextRun({ text, bold: true })] }));
          continue;
        }
      }
      children.push(new Paragraph({ children: [new TextRun(trimmed)] }));
      children.push(new Paragraph({ children: [new TextRun(" ")] }));
    }
  }

  const doc = new Document({
    creator: "BookBrain OS",
    title: titleText,
    sections: [{ properties: {}, children }]
  });
  return Packer.toBuffer(doc);
}
