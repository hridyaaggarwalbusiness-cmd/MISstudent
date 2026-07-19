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

// AI-generated notices occasionally come back as one very long paragraph
// with no blank lines. A single paragraph that's taller than a whole page
// can't be paginated (there's nothing to break between), which is what lets
// a page overflow past its footer/border. This guarantees a hard word-count
// cap per paragraph - splitting on plain word boundaries, never inside a
// **bold** span - rather than relying on sentence punctuation, which isn't
// guaranteed to appear often enough (or at all) in a run-on paragraph.
function splitLongParagraphs(paragraphs: string[], maxWords = 55): string[] {
  const result: string[] = [];
  for (const p of paragraphs) {
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      result.push(p);
      continue;
    }
    let chunk: string[] = [];
    for (const word of words) {
      chunk.push(word);
      const boldMarkersOpen = (chunk.join(' ').match(/\*\*/g)?.length ?? 0) % 2 !== 0;
      if (chunk.length >= maxWords && !boldMarkersOpen) {
        result.push(chunk.join(' '));
        chunk = [];
      }
    }
    if (chunk.length) result.push(chunk.join(' '));
  }
  return result;
}

// Converts **bold** markdown spans and \n-separated paragraphs into the
// body's inner HTML, escaping everything else. This is the only part of the
// document whose content is AI-generated.
export function bodyToHtml(body: string): string {
  const paragraphs = splitLongParagraphs(
    body
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean),
  );

  return paragraphs
    .map((p) => {
      const escaped = escapeHtml(p);
      const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return `<p class="notice-paragraph">${withBold}</p>`;
    })
    .join('\n');
}

// Fixed header block (crests, school name, affiliation, NOTICE/date row) -
// appears once, on the first page only. Fixed footer block (signature
// block) - appears once, on whichever page the body text ends on. Neither
// repeats across pages: a real multi-page letter states its letterhead
// once and signs once, not on every page.
function headerBlockHtml(date: string): string {
  return `
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
      <span class="notice-date">${escapeHtml(date)}</span>
    </div>
  `;
}

const FOOTER_BLOCK_HTML = `
    <footer class="notice-footer">
      <p class="notice-thanks">Thanks &amp; Regards</p>
      <img class="notice-signature" src="${principalSignatureUrl}" alt="" />
      <p class="notice-principal-name">Bhavna Mittal</p>
      <p class="notice-principal-title">(Principal)</p>
    </footer>
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
    overflow: hidden;
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
    margin-top: 20pt;
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

// Builds one physical page. includeHeader/includeFooter control whether the
// letterhead / signature block render on this particular page - callers
// (fillNoticeTemplate for the single-page case, renderNoticePages for
// multi-page) decide which page gets which, but the header always renders
// at most once and the footer always renders at most once across a notice.
function buildPageHtml(date: string, bodyInnerHtml: string, includeHeader: boolean, includeFooter: boolean): string {
  const page = `
<div class="notice-page">
  <div class="notice-border">
    ${includeHeader ? headerBlockHtml(date) : ''}
    <main class="notice-body">${bodyInnerHtml}</main>
    ${includeFooter ? FOOTER_BLOCK_HTML : ''}
  </div>
</div>`;
  return wrapDocument(page);
}

// Accepts { date, title, body } and fills the fixed HTML template - the
// literal templating function the notice-writer feature is built around.
// Covers the common single-page case; for bodies too long to fit one page,
// use renderNoticePages() instead, which paginates while showing the
// header only on page 1 and the footer only on the final page.
export function fillNoticeTemplate(data: NoticeTemplateData): string {
  const titleHtml = data.title?.trim() ? `<p class="notice-title">${escapeHtml(data.title.trim())}</p>` : '';
  return buildPageHtml(data.date, titleHtml + bodyToHtml(data.body), true, true);
}

function loadIntoFrame(iframe: HTMLIFrameElement, html: string): Promise<void> {
  return new Promise((resolve) => {
    iframe.onload = () => resolve();
    iframe.srcdoc = html;
  });
}

function createProbeFrame(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = `${PAGE_WIDTH_PT}pt`;
  iframe.style.height = `${PAGE_HEIGHT_PT}pt`;
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  return iframe;
}

// Measures whether the body content overflows a single page and, if so,
// splits it into per-paragraph groups across multiple pages - the header
// (letterhead + NOTICE/date row) renders only on page 1, and the footer
// (signature block) renders only on whichever page the body text ends on,
// exactly like a real multi-page letter rather than a repeated template.
export async function renderNoticePages(data: NoticeTemplateData): Promise<string[]> {
  const titleHtml = data.title?.trim() ? `<p class="notice-title">${escapeHtml(data.title.trim())}</p>` : '';
  const bodyHtml = titleHtml + bodyToHtml(data.body);

  const headerProbe = createProbeFrame();
  const noHeaderProbe = createProbeFrame();
  try {
    // Probe A: page WITH header, full body, no footer - gives the page
    // content box height, where the body starts under the header, and
    // every paragraph's real rendered height (unaffected by which page it
    // ends up on, since the content width never changes).
    await loadIntoFrame(headerProbe, buildPageHtml(data.date, bodyHtml, true, false));
    const docA = headerProbe.contentDocument!;
    const borderElA = docA.querySelector('.notice-border') as HTMLElement;
    const bodyElA = docA.querySelector('.notice-body') as HTMLElement;
    const pageContentHeight = borderElA.clientHeight;
    const firstPageAvailable = pageContentHeight - (bodyElA.offsetTop - borderElA.offsetTop);
    const paraNodes = Array.from(bodyElA.querySelectorAll('.notice-paragraph, .notice-title')) as HTMLElement[];
    const paraHeights = paraNodes.map((n) => n.offsetHeight);
    const paraHtml = paraNodes.map((n) => n.outerHTML);

    // Probe B: page with NO header, empty body, WITH footer - gives where
    // the body starts on a header-less continuation page, and the
    // footer's own real rendered height.
    await loadIntoFrame(noHeaderProbe, buildPageHtml(data.date, '', false, true));
    const docB = noHeaderProbe.contentDocument!;
    const borderElB = docB.querySelector('.notice-border') as HTMLElement;
    const bodyElB = docB.querySelector('.notice-body') as HTMLElement;
    const footerElB = docB.querySelector('.notice-footer') as HTMLElement;
    const continuationPageAvailable = pageContentHeight - (bodyElB.offsetTop - borderElB.offsetTop);
    const footerHeight = footerElB.offsetHeight;

    if (bodyElA.scrollHeight <= firstPageAvailable - footerHeight) {
      // Everything - body and footer - fits on one page.
      return [buildPageHtml(data.date, bodyHtml, true, true)];
    }

    // Greedily pack paragraphs: page 0 gets the header's reduced budget,
    // every later page gets the full (no-header) budget.
    const pages: string[][] = [[]];
    let currentHeight = 0;
    for (let i = 0; i < paraNodes.length; i++) {
      const budget = pages.length === 1 ? firstPageAvailable : continuationPageAvailable;
      const h = paraHeights[i];
      if (currentHeight + h > budget && pages[pages.length - 1].length > 0) {
        pages.push([]);
        currentHeight = 0;
      }
      pages[pages.length - 1].push(paraHtml[i]);
      currentHeight += h;
    }

    const lastPageBudget = pages.length === 1 ? firstPageAvailable : continuationPageAvailable;
    const footerFitsOnLastPage = currentHeight + footerHeight <= lastPageBudget;

    const htmlPages = pages.map((paras, i) => {
      const includeHeader = i === 0;
      const isLastPage = i === pages.length - 1;
      const includeFooter = isLastPage && footerFitsOnLastPage;
      return buildPageHtml(data.date, paras.join('\n'), includeHeader, includeFooter);
    });

    if (!footerFitsOnLastPage) {
      // The last page's body filled it right up to the edge - give the
      // signature block a page of its own rather than crowding/overflowing.
      htmlPages.push(buildPageHtml(data.date, '', false, true));
    }

    return htmlPages;
  } finally {
    document.body.removeChild(headerProbe);
    document.body.removeChild(noHeaderProbe);
  }
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

async function renderPageToCanvas(html: string, scale = 2.5): Promise<HTMLCanvasElement> {
  const iframe = createProbeFrame();

  try {
    await loadIntoFrame(iframe, html);
    const doc = iframe.contentDocument!;
    await waitForImages(doc);
    // Let the browser actually paint the freshly-loaded iframe before
    // snapshotting it - without this, html2canvas can occasionally
    // capture a page before its background/border have been painted.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const html2canvas = (await import('html2canvas')).default;
    const target = doc.querySelector('.notice-page') as HTMLElement;
    return await html2canvas(target, { scale, useCORS: true, backgroundColor: '#fbd4b4' });
  } finally {
    document.body.removeChild(iframe);
  }
}

// Renders just the first page as a PNG data URL, for single-image sharing
// ("Download Image") where a PNG is inherently one image. For on-screen
// display, use renderAllPagesDataUrls() instead so a multi-page notice is
// never silently truncated to page 1.
export async function renderNoticeDataUrl(data: NoticeTemplateData): Promise<string> {
  const [firstPage] = await renderNoticePages(data);
  const canvas = await renderPageToCanvas(firstPage);
  return canvas.toDataURL('image/png');
}

// Renders every page as a PNG data URL, in order - what this returns is
// exactly what downloadNoticePdf() would produce, so a preview built from
// it can never show less than the actual published notice.
export async function renderAllPagesDataUrls(data: NoticeTemplateData): Promise<string[]> {
  const pages = await renderNoticePages(data);
  const urls: string[] = [];
  for (const page of pages) {
    const canvas = await renderPageToCanvas(page);
    urls.push(canvas.toDataURL('image/png'));
  }
  return urls;
}

// Renders every page as a compact JPEG data URL, for inlining the exact
// rendered artifact into a Firestore notice document at publish time (this
// project's Spark plan has no Cloud Storage). Uses a lower raster scale and
// JPEG compression instead of renderAllPagesDataUrls()'s high-quality PNGs,
// purely so the result fits Firestore's 1 MiB document limit - the source
// HTML/CSS is identical, so what this captures is pixel-for-pixel the same
// notice, just compressed for storage.
export async function renderAllPagesForStorage(data: NoticeTemplateData): Promise<string[]> {
  const pages = await renderNoticePages(data);
  const urls: string[] = [];
  for (const page of pages) {
    const canvas = await renderPageToCanvas(page, 0.85);
    urls.push(canvas.toDataURL('image/jpeg', 0.55));
  }
  return urls;
}

// Assembles already-rendered page images (e.g. from renderAllPagesForStorage)
// into a real multi-page PDF, entirely client-side, with no re-render step.
function buildPdfFromImages(pageUrls: string[]): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  pageUrls.forEach((dataUrl, i) => {
    if (i > 0) doc.addPage('a4', 'portrait');
    const format = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.addImage(dataUrl, format, 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT);
  });
  return doc;
}

// Returns the assembled PDF as a base64 data: URI - suitable for storing as
// a Notice attachment (this project's Spark plan has no Cloud Storage, so
// attachments are inlined the same way file uploads already are). Opening
// this through the standard attachment "open" action (a real PDF, not an
// image) is what lets it launch the device's own PDF viewer, same as any
// manually attached PDF.
export function buildNoticePdfDataUrl(pageUrls: string[]): string {
  return buildPdfFromImages(pageUrls).output('datauristring');
}

// Builds a multi-page PDF directly from already-rendered page images (e.g.
// notice.pageImages stored at publish time), with no re-render step - so a
// student's downloaded PDF is assembled from the exact bytes the admin
// published rather than being regenerated from title/body.
export async function downloadNoticePdfFromImages(pageUrls: string[], title: string) {
  buildPdfFromImages(pageUrls).save(`${safeFileName(title)}.pdf`);
}

export function downloadImageDataUrl(dataUrl: string, title: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
  link.download = `${safeFileName(title)}.${ext}`;
  link.click();
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
    if (i > 0) doc.addPage('a4', 'portrait');
    doc.addImage(dataUrl, 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT);
  }
  doc.save(`${safeFileName(title)}.pdf`);
}
