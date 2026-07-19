import { jsPDF } from 'jspdf';

// On Expo web, Metro resolves a required image straight to its URL string;
// on native it would be a numeric asset ID or {uri} object instead. This
// app is web-only (see AGENTS.md), but resolve defensively so it doesn't
// silently break if that ever changes.
function assetUri(mod: unknown): string {
  if (typeof mod === 'string') return mod;
  if (mod && typeof mod === 'object' && 'uri' in mod) return String((mod as { uri: unknown }).uri);
  if (mod && typeof mod === 'object' && 'default' in mod) return assetUri((mod as { default: unknown }).default);
  return String(mod);
}

const madaanLogoUrl = assetUri(require('@/assets/notice/madaan-logo.png'));
const principalSignatureUrl = assetUri(require('@/assets/notice/principal-signature.png'));

// The official school notice template. Every measurement below (fonts,
// sizes, colors, spacing, logo/signature placement) was extracted directly
// from the school's real notice PDF - not approximated - so this reproduces
// that document exactly. Only {{DATE}}, {{TITLE}} and {{BODY}} ever change;
// everything else (header, border, background, footer, logo, signature) is
// fixed and must never be generated or altered by AI.
export interface NoticeTemplateData {
  date: string; // pre-formatted for display, e.g. "14th July, 2026"
  title?: string; // optional bold subject line shown above the body
  body: string; // salutation-first body text. Wrap key terms in
  // **double asterisks** for inline bold emphasis, matching the source PDF.
}

// jsPDF's default A4 page size in points - the HTML page container below is
// sized to match exactly so the rendered raster maps onto the PDF page with
// zero stretching.
export const PAGE_WIDTH_PT = 595.28;
export const PAGE_HEIGHT_PT = 841.89;

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Converts **bold** markdown spans and \n-separated paragraphs into the
// body's inner HTML, escaping everything else. This is the only part of the
// document whose content is AI-generated.
export function bodyToHtml(body: string): string {
  const paragraphs = body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((p) => {
      const escaped = escapeHtml(p);
      const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return `<p class="notice-paragraph">${withBold}</p>`;
    })
    .join('\n');
}

// The fixed template, as a literal HTML string with {{DATE}}, {{TITLE}} and
// {{BODY}} placeholders - the header, border, background, footer, logo and
// signature markup here must never change.
const NOTICE_TEMPLATE_HTML = `
<div class="notice-page">
  <div class="notice-border">
    <header class="notice-header">
      <img class="notice-logo" src="${madaanLogoUrl}" alt="" />
      <div class="notice-header-text">
        <h1 class="notice-school-name">MADAAN INTERNATIONAL SCHOOL</h1>
        <p class="notice-affiliation">Affiliated to CBSE, New Delhi (Nursery to XII)</p>
      </div>
      <img class="notice-logo" src="${madaanLogoUrl}" alt="" />
    </header>

    <div class="notice-heading-row">
      <span class="notice-heading-spacer"></span>
      <span class="notice-heading">NOTICE</span>
      <span class="notice-date">{{DATE}}</span>
    </div>

    <main class="notice-body">
      {{TITLE}}
      {{BODY}}
    </main>

    <footer class="notice-footer">
      <p class="notice-thanks">Thanks &amp; Regards</p>
      <img class="notice-signature" src="${principalSignatureUrl}" alt="" />
      <p class="notice-principal-name">Bhavna Mittal</p>
      <p class="notice-principal-title">(Principal)</p>
    </footer>
  </div>
</div>
`;

const NOTICE_STYLE = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { background: transparent; }
  .notice-page {
    width: ${PAGE_WIDTH_PT}pt;
    height: ${PAGE_HEIGHT_PT}pt;
    background: #fbd4b4;
    font-family: 'Times New Roman', Georgia, serif;
    color: #000;
  }
  .notice-border {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: 2.2pt solid #000;
    margin: 0;
    padding: 4pt 11pt 14pt;
    display: flex;
    flex-direction: column;
  }
  .notice-header {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 6pt;
  }
  .notice-logo {
    width: 48pt;
    height: auto;
    flex-shrink: 0;
  }
  .notice-header-text {
    flex: 1;
    min-width: 0;
    text-align: center;
    padding-top: 4pt;
  }
  .notice-school-name {
    margin: 0;
    font-size: 23pt;
    font-weight: 700;
    white-space: nowrap;
  }
  .notice-affiliation {
    margin: 3pt 0 0;
    font-size: 15pt;
    font-weight: 400;
  }
  .notice-heading-row {
    display: flex;
    align-items: baseline;
    margin-top: 26pt;
    font-size: 23pt;
  }
  .notice-heading-spacer {
    flex: 0 0 42%;
  }
  .notice-heading {
    font-weight: 700;
  }
  .notice-date {
    margin-left: auto;
  }
  .notice-body {
    margin-top: 18pt;
    font-size: 23pt;
    line-height: 1.72;
    flex: 1;
  }
  .notice-title {
    margin: 0 0 10pt;
    font-weight: 700;
  }
  .notice-paragraph {
    margin: 0 0 8pt;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .notice-footer {
    margin-top: auto;
    padding-top: 20pt;
  }
  .notice-thanks {
    margin: 0 0 10pt;
    font-size: 18pt;
  }
  .notice-signature {
    display: block;
    width: 101pt;
    height: auto;
    margin: 0 0 6pt;
  }
  .notice-principal-name {
    margin: 0 0 4pt;
    font-size: 18pt;
  }
  .notice-principal-title {
    margin: 0;
    font-size: 18pt;
  }
`;

function wrapDocument(bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${NOTICE_STYLE}</style></head><body>${bodyHtml}</body></html>`;
}

function fillPage(date: string, titleHtml: string, bodyHtml: string): string {
  const page = NOTICE_TEMPLATE_HTML.replace('{{DATE}}', escapeHtml(date))
    .replace('{{TITLE}}', titleHtml)
    .replace('{{BODY}}', bodyHtml);
  return wrapDocument(page);
}

// Accepts { date, title, body } and fills the fixed HTML template - the
// literal templating function the notice-writer feature is built around.
// Covers the common single-page case; for bodies too long to fit one page,
// use renderNoticePages() instead, which paginates while repeating this
// same header/footer on every page.
export function fillNoticeTemplate(data: NoticeTemplateData): string {
  const titleHtml = data.title?.trim() ? `<p class="notice-title">${escapeHtml(data.title.trim())}</p>` : '';
  return fillPage(data.date, titleHtml, bodyToHtml(data.body));
}

const CONTENT_AREA_SELECTOR = '.notice-body';

// Measures whether the body content overflows a single page and, if so,
// splits it into per-paragraph groups that each fit one page - each
// resulting page reuses the identical fixed header/footer markup above, per
// the requirement that header and footer repeat on every page.
export async function renderNoticePages(data: NoticeTemplateData): Promise<string[]> {
  const probeFrame = document.createElement('iframe');
  probeFrame.style.position = 'fixed';
  probeFrame.style.left = '-99999px';
  probeFrame.style.top = '0';
  probeFrame.style.width = `${PAGE_WIDTH_PT}pt`;
  probeFrame.style.height = `${PAGE_HEIGHT_PT}pt`;
  probeFrame.style.border = 'none';
  document.body.appendChild(probeFrame);

  try {
    const titleHtml = data.title?.trim() ? `<p class="notice-title">${escapeHtml(data.title.trim())}</p>` : '';
    const paragraphs = bodyToHtml(data.body).split('\n').filter(Boolean);
    const fullHtml = fillPage(data.date, titleHtml, paragraphs.join('\n'));

    await loadIntoFrame(probeFrame, fullHtml);
    const doc = probeFrame.contentDocument!;
    const bodyEl = doc.querySelector(CONTENT_AREA_SELECTOR) as HTMLElement;
    const borderEl = doc.querySelector('.notice-border') as HTMLElement;
    const footerEl = doc.querySelector('.notice-footer') as HTMLElement;
    // Reserve the footer's real rendered height (not a guess) plus a small
    // buffer, so the signature block never gets pushed past the page edge.
    const availableHeight = borderEl.clientHeight - (bodyEl.offsetTop - borderEl.offsetTop) - footerEl.offsetHeight - 16;

    if (bodyEl.scrollHeight <= availableHeight) {
      return [fullHtml];
    }

    // Overflow: greedily group paragraphs so each page's body fits.
    const paraNodes = Array.from(bodyEl.querySelectorAll('.notice-paragraph, .notice-title')) as HTMLElement[];
    const pages: string[][] = [[]];
    let currentHeight = 0;
    for (const node of paraNodes) {
      const h = node.offsetHeight;
      if (currentHeight + h > availableHeight && pages[pages.length - 1].length > 0) {
        pages.push([]);
        currentHeight = 0;
      }
      pages[pages.length - 1].push(node.outerHTML);
      currentHeight += h;
    }

    return pages.map((paras, i) => fillPage(data.date, i === 0 ? titleHtml : '', paras.filter((p) => !p.startsWith('<p class="notice-title')).join('\n')));
  } finally {
    document.body.removeChild(probeFrame);
  }
}

function loadIntoFrame(iframe: HTMLIFrameElement, html: string): Promise<void> {
  return new Promise((resolve) => {
    iframe.onload = () => resolve();
    iframe.srcdoc = html;
  });
}

async function waitForImages(doc: Document): Promise<void> {
  const imgs = Array.from(doc.images);
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );
}

async function renderPageToCanvas(html: string): Promise<HTMLCanvasElement> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = `${PAGE_WIDTH_PT}pt`;
  iframe.style.height = `${PAGE_HEIGHT_PT}pt`;
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  try {
    await loadIntoFrame(iframe, html);
    const doc = iframe.contentDocument!;
    await waitForImages(doc);
    const html2canvas = (await import('html2canvas')).default;
    const target = doc.querySelector('.notice-page') as HTMLElement;
    return await html2canvas(target, { scale: 2.5, useCORS: true, backgroundColor: '#fbd4b4' });
  } finally {
    document.body.removeChild(iframe);
  }
}

// Renders just the first page as a PNG data URL, for live display (RN
// <Image> has no direct HTML/CSS rendering, so the page is rasterized once
// and shown as an image) and single-image sharing ("Download Image").
// Multi-page notices still export a full multi-page PDF via
// downloadNoticePdf(); a PNG is inherently a single image.
export async function renderNoticeDataUrl(data: NoticeTemplateData): Promise<string> {
  const [firstPage] = await renderNoticePages(data);
  const canvas = await renderPageToCanvas(firstPage);
  return canvas.toDataURL('image/png');
}

function safeFileName(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'notice';
}

export async function downloadNoticeImage(data: NoticeTemplateData, title: string) {
  const dataUrl = await renderNoticeDataUrl(data);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${safeFileName(title)}.png`;
  link.click();
}

export async function downloadNoticePdf(data: NoticeTemplateData, title: string) {
  const pages = await renderNoticePages(data);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  for (let i = 0; i < pages.length; i++) {
    const canvas = await renderPageToCanvas(pages[i]);
    const dataUrl = canvas.toDataURL('image/png');
    if (i > 0) doc.addPage();
    doc.addImage(dataUrl, 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT);
  }
  doc.save(`${safeFileName(title)}.pdf`);
}
