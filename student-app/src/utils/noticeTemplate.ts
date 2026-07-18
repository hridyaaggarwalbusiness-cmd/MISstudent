import { jsPDF } from 'jspdf';

// The official school notice design - reference image supplied by the
// school. Every visual element (border, background, crest, school name,
// affiliation line, "NOTICE" heading placement, date position,
// salutation-first body, "Thanks & Regards", signature block, principal
// name) is the school's fixed, real letterhead and must never change.
// Only the date and the AI-generated body text vary between notices.
export interface NoticeTemplateData {
  date: string; // already formatted for display, e.g. "14th July, 2026"
  body: string; // full body text, starting with the salutation line. Key
  // terms may be wrapped in **double asterisks** for inline emphasis,
  // matching the bolding style used on the original printed notice.
}

const SCHOOL_NAME = 'MADAAN INTERNATIONAL SCHOOL';
const AFFILIATION = 'Affiliated to CBSE, New Delhi (Nursery to XII)';
const PRINCIPAL_NAME = 'Bhavna Mittal';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1414; // ~A4 portrait ratio

const PEACH_BG = '#f7dcb8';
const INK = '#1a1208';
const INK_SOFT = '#4a3a22';
const GOLD = '#8a6a2f';
const SIGNATURE_COLOR = '#0f6b52';

const FONT_BODY = "20px 'Times New Roman', Georgia, serif";
const FONT_BODY_BOLD = "bold 20px 'Times New Roman', Georgia, serif";

type BoldToken = { word: string; bold: boolean };

// Splits body text on **bold** markers into word tokens tagged bold/plain,
// so the AI's emphasis (dates, key names) survives into the drawn notice.
function tokenizeBold(text: string): BoldToken[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  const tokens: BoldToken[] = [];
  for (const part of parts) {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    const bold = !!match;
    const content = match ? match[1] : part;
    for (const word of content.split(/\s+/).filter(Boolean)) {
      // Punctuation left dangling right after a closing ** marker (e.g. the
      // "." in "**Monday**.") has no space before it in the source text -
      // glue it onto the previous word instead of drawing it as its own
      // space-separated token.
      if (/^[.,;:!?)\]]+$/.test(word) && tokens.length) {
        tokens[tokens.length - 1] = { ...tokens[tokens.length - 1], word: tokens[tokens.length - 1].word + word };
      } else {
        tokens.push({ word, bold });
      }
    }
  }
  return tokens;
}

function wrapRuns(ctx: CanvasRenderingContext2D, tokens: BoldToken[], maxWidth: number): BoldToken[][] {
  ctx.font = FONT_BODY;
  const spaceWidth = ctx.measureText(' ').width;
  const lines: BoldToken[][] = [];
  let current: BoldToken[] = [];
  let currentWidth = 0;
  for (const token of tokens) {
    ctx.font = token.bold ? FONT_BODY_BOLD : FONT_BODY;
    const wordWidth = ctx.measureText(token.word).width;
    const extra = current.length ? spaceWidth : 0;
    if (current.length && currentWidth + extra + wordWidth > maxWidth) {
      lines.push(current);
      current = [token];
      currentWidth = wordWidth;
    } else {
      current.push(token);
      currentWidth += extra + wordWidth;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

// Body text may contain the AI's own paragraph breaks (blank lines) - each
// paragraph is wrapped independently so those breaks survive.
function wrapParagraphs(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): BoldToken[][][] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => wrapRuns(ctx, tokenizeBold(p), maxWidth));
}

function drawRunLine(ctx: CanvasRenderingContext2D, line: BoldToken[], x: number, y: number) {
  ctx.font = FONT_BODY;
  const spaceWidth = ctx.measureText(' ').width;
  let cx = x;
  ctx.textAlign = 'left';
  for (const token of line) {
    ctx.font = token.bold ? FONT_BODY_BOLD : FONT_BODY;
    ctx.fillText(token.word, cx, y);
    cx += ctx.measureText(token.word).width + spaceWidth;
  }
}

// Draws the school crest: a shield containing a simple domed-institution
// icon, with the school's short name captioned underneath. This is a
// best-effort recreation of the printed crest (no source logo file was
// available) rather than a plain circle-and-initial placeholder.
function drawCrest(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  const w = size;
  const h = size * 1.15;

  ctx.beginPath();
  ctx.moveTo(cx - w, cy - h);
  ctx.lineTo(cx + w, cy - h);
  ctx.lineTo(cx + w, cy + h * 0.2);
  ctx.quadraticCurveTo(cx + w, cy + h * 0.75, cx, cy + h);
  ctx.quadraticCurveTo(cx - w, cy + h * 0.75, cx - w, cy + h * 0.2);
  ctx.closePath();
  ctx.fillStyle = '#fdf6ea';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = GOLD;
  ctx.stroke();

  // Domed institution icon
  const baseW = w * 1.05;
  const baseH = h * 0.26;
  const baseY = cy + h * 0.5;
  ctx.fillStyle = GOLD;
  ctx.fillRect(cx - baseW / 2, baseY - baseH, baseW, baseH);

  ctx.fillStyle = '#fdf6ea';
  const pillarCount = 4;
  const pillarW = baseW * 0.1;
  for (let i = 0; i < pillarCount; i++) {
    const px = cx - baseW / 2 + (baseW * (i + 0.5)) / pillarCount - pillarW / 2;
    ctx.fillRect(px, baseY - baseH + 3, pillarW, baseH - 6);
  }

  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(cx, baseY - baseH, w * 0.4, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 2, baseY - baseH - w * 0.4);
  ctx.lineTo(cx + 2, baseY - baseH - w * 0.4);
  ctx.lineTo(cx, baseY - baseH - w * 0.4 - 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = GOLD;
  ctx.font = `bold ${Math.round(size * 0.3)}px 'Times New Roman', Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('MADAAN', cx, cy + h + Math.round(size * 0.42));
}

// Draws the complete official notice onto the given canvas. Kept as one
// deterministic draw routine so the live preview, the downloaded PNG, and
// the downloaded PDF (which embeds this same canvas as its page image) are
// always pixel-identical - there is exactly one place the design lives.
export function drawNoticeOnCanvas(canvas: HTMLCanvasElement, data: NoticeTemplateData) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = CANVAS_WIDTH;
  const h = CANVAS_HEIGHT;
  const margin = 34;
  const contentPad = 60;
  const contentLeft = contentPad;
  const contentRight = w - contentPad;
  const contentWidth = contentRight - contentLeft;

  // ---- Background + border ----
  ctx.fillStyle = PEACH_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

  // ---- Header: crests + school name + affiliation ----
  let y = 118;
  drawCrest(ctx, contentLeft + 46, y, 36);
  drawCrest(ctx, contentRight - 46, y, 36);

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = "bold 34px 'Times New Roman', Georgia, serif";
  ctx.fillText(SCHOOL_NAME, w / 2, y - 4);

  ctx.font = "16px 'Times New Roman', Georgia, serif";
  ctx.fillStyle = INK_SOFT;
  ctx.fillText(AFFILIATION, w / 2, y + 26);

  y += 100;

  // ---- NOTICE + date row ----
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = "bold 26px 'Times New Roman', Georgia, serif";
  ctx.fillText('NOTICE', contentLeft + contentWidth * 0.39, y);
  ctx.textAlign = 'right';
  ctx.font = "26px 'Times New Roman', Georgia, serif";
  ctx.fillText(data.date, contentRight, y);
  ctx.textAlign = 'left';

  y += 56;

  // ---- Body (starts with the salutation, already generated by the AI) ----
  ctx.fillStyle = INK;
  const lineHeight = 32;
  const paragraphs = wrapParagraphs(ctx, data.body, contentWidth);
  paragraphs.forEach((lines) => {
    lines.forEach((line) => {
      drawRunLine(ctx, line, contentLeft, y);
      y += lineHeight;
    });
    y += 10;
  });

  // ---- Closing + signature block ----
  y += 30;
  ctx.font = FONT_BODY;
  ctx.fillStyle = INK;
  ctx.fillText('Thanks & Regards', contentLeft, y);

  y += 70;
  // Signature scribble
  ctx.save();
  ctx.strokeStyle = SIGNATURE_COLOR;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(contentLeft, y);
  ctx.bezierCurveTo(contentLeft + 20, y - 26, contentLeft + 40, y + 18, contentLeft + 65, y - 6);
  ctx.bezierCurveTo(contentLeft + 85, y - 24, contentLeft + 100, y + 10, contentLeft + 130, y - 4);
  ctx.bezierCurveTo(contentLeft + 150, y - 14, contentLeft + 165, y + 4, contentLeft + 185, y - 2);
  ctx.stroke();
  ctx.restore();

  y += 38;
  ctx.font = "bold 21px 'Times New Roman', Georgia, serif";
  ctx.fillStyle = INK;
  ctx.fillText(PRINCIPAL_NAME, contentLeft, y);

  y += 26;
  ctx.font = "17px 'Times New Roman', Georgia, serif";
  ctx.fillStyle = INK_SOFT;
  ctx.fillText('(Principal)', contentLeft, y);
}

export function renderNoticeDataUrl(data: NoticeTemplateData): string {
  const canvas = document.createElement('canvas');
  drawNoticeOnCanvas(canvas, data);
  return canvas.toDataURL('image/png');
}

function safeFileName(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'notice';
}

export function downloadNoticeImage(data: NoticeTemplateData, title: string) {
  const dataUrl = renderNoticeDataUrl(data);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${safeFileName(title)}.png`;
  link.click();
}

export function downloadNoticePdf(data: NoticeTemplateData, title: string) {
  const dataUrl = renderNoticeDataUrl(data);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
  doc.save(`${safeFileName(title)}.pdf`);
}
