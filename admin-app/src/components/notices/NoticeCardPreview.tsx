import { useEffect, useState } from 'react';
import { renderNoticeDataUrl, PAGE_WIDTH_PT, PAGE_HEIGHT_PT } from '@/utils/noticeTemplate';
import { formatOfficialDate } from '@/utils/officialDate';
import styles from './NoticeCardPreview.module.css';

const ASPECT_RATIO = PAGE_WIDTH_PT / PAGE_HEIGHT_PT;

// Renders the first page of the official notice template as a small
// thumbnail, through the exact same render pipeline used for the PDF
// export - so an AI-generated notice shows its real logo, background and
// signature in the Notices list, not the plain title/body text used for
// ordinary (non-template) notices.
export function NoticeCardPreview({ date, title, body }: { date: string; title: string; body: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    renderNoticeDataUrl({ date: formatOfficialDate(date), title, body }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, title, body]);

  return (
    <div className={styles.frame} style={{ aspectRatio: `${PAGE_WIDTH_PT} / ${PAGE_HEIGHT_PT}` }}>
      {dataUrl && <img src={dataUrl} alt="" className={styles.image} style={{ aspectRatio: ASPECT_RATIO }} />}
    </div>
  );
}
