import { jsPDF } from 'jspdf';

// Hand-mirrored from admin-app/src/utils/noticeTemplate.ts so both apps
// render the exact same official notice design without a shared package
// between them (same pattern already used for the AI practice-test prompt
// builder). Keep any layout change in sync between the two copies.
export interface NoticeTemplateData {
  schoolName: string;
  affiliation?: string;
  principalName?: string;
  date: string;
  body: string;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1414;

const PEACH_BG = '#f7dcb8';
const INK = '#1a1208';
const INK_SOFT = '#4a3a22';

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function wrapParagraphs(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[][] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => wrapText(ctx, p, maxWidth));
}

function drawLogoBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, initial: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fdf6ea';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8a6a2f';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 7, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#8a6a2f';
  ctx.stroke();
  ctx.fillStyle = '#8a6a2f';
  ctx.font = `bold ${Math.round(radius * 1.1)}px 'Times New Roman', Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial, cx, cy + 2);
  ctx.restore();
}

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

  ctx.fillStyle = PEACH_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

  let y = 118;
  drawLogoBadge(ctx, contentLeft + 44, y, 40, data.schoolName.trim().charAt(0).toUpperCase() || 'S');
  drawLogoBadge(ctx, contentRight - 44, y, 40, data.schoolName.trim().charAt(0).toUpperCase() || 'S');

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = "bold 34px 'Times New Roman', Georgia, serif";
  ctx.fillText(data.schoolName.toUpperCase(), w / 2, y - 4);

  if (data.affiliation) {
    ctx.font = "italic 16px 'Times New Roman', Georgia, serif";
    ctx.fillStyle = INK_SOFT;
    ctx.fillText(data.affiliation, w / 2, y + 26);
  }

  y += 92;

  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = "bold 26px 'Times New Roman', Georgia, serif";
  ctx.fillText('NOTICE', contentLeft, y);
  ctx.textAlign = 'right';
  ctx.font = "26px 'Times New Roman', Georgia, serif";
  ctx.fillText(data.date, contentRight, y);
  ctx.textAlign = 'left';

  y += 56;

  ctx.font = "20px 'Times New Roman', Georgia, serif";
  ctx.fillStyle = INK;
  const lineHeight = 32;
  const paragraphs = wrapParagraphs(ctx, data.body, contentWidth);
  paragraphs.forEach((lines) => {
    lines.forEach((line) => {
      ctx.fillText(line, contentLeft, y);
      y += lineHeight;
    });
    y += 10;
  });

  y += 30;
  ctx.font = "20px 'Times New Roman', Georgia, serif";
  ctx.fillText('Thanks & Regards', contentLeft, y);

  y += 70;
  ctx.save();
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(contentLeft, y);
  ctx.bezierCurveTo(contentLeft + 20, y - 26, contentLeft + 40, y + 18, contentLeft + 65, y - 6);
  ctx.bezierCurveTo(contentLeft + 85, y - 24, contentLeft + 100, y + 10, contentLeft + 130, y - 4);
  ctx.bezierCurveTo(contentLeft + 150, y - 14, contentLeft + 165, y + 4, contentLeft + 185, y - 2);
  ctx.stroke();
  ctx.restore();

  y += 38;
  ctx.font = "bold italic 21px 'Times New Roman', Georgia, serif";
  ctx.fillStyle = INK;
  ctx.fillText(data.principalName?.trim() || 'Principal', contentLeft, y);

  y += 26;
  ctx.font = "italic 17px 'Times New Roman', Georgia, serif";
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
