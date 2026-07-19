import { useEffect, useState } from 'react';
import { renderAllPagesDataUrls, PAGE_WIDTH_PT, PAGE_HEIGHT_PT } from '@/utils/noticeTemplate';
import type { NoticeTemplateData } from '@/utils/noticeTemplate';
import styles from './NoticePreview.module.css';

// Renders every page of the official notice, stacked so a multi-page
// notice is reviewed by scrolling - each page image comes from the exact
// same html2canvas render pipeline used for the PDF export, so what's
// shown here is always what gets downloaded and published, page for page.
export function NoticePreview({ data }: { data: NoticeTemplateData }) {
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const dataKey = JSON.stringify(data);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      renderAllPagesDataUrls(data).then((urls) => {
        if (!cancelled) setPageUrls(urls);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  return (
    <div className={styles.pagesStack}>
      {(pageUrls.length ? pageUrls : [null]).map((url, i) => (
        <div key={i} className={styles.frame} style={{ aspectRatio: `${PAGE_WIDTH_PT} / ${PAGE_HEIGHT_PT}` }}>
          {url && <img src={url} alt={`Notice page ${i + 1}`} className={styles.pageImage} />}
        </div>
      ))}
    </div>
  );
}
