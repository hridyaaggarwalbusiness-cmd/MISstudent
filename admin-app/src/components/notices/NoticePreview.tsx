import { useEffect, useRef, useState } from 'react';
import { fillNoticeTemplate, PAGE_WIDTH_PT, PAGE_HEIGHT_PT } from '@/utils/noticeTemplate';
import type { NoticeTemplateData } from '@/utils/noticeTemplate';
import styles from './NoticePreview.module.css';

const PAGE_WIDTH_PX = PAGE_WIDTH_PT * (96 / 72);
const PAGE_HEIGHT_PX = PAGE_HEIGHT_PT * (96 / 72);

// Renders the official notice template live as the admin edits the form, by
// loading the exact same fillNoticeTemplate() HTML used for exports into an
// iframe (scaled to fit the panel) - what's shown here is always what gets
// downloaded and published, since it's the same markup, not a re-drawing.
export function NoticePreview({ data }: { data: NoticeTemplateData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setScale(width / PAGE_WIDTH_PX);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (iframeRef.current) iframeRef.current.srcdoc = fillNoticeTemplate(data);
  }, [data]);

  return (
    <div ref={containerRef} className={styles.frame} style={{ aspectRatio: `${PAGE_WIDTH_PT} / ${PAGE_HEIGHT_PT}` }}>
      <iframe
        ref={iframeRef}
        title="Notice preview"
        className={styles.iframe}
        style={{ width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX, transform: `scale(${scale})` }}
      />
    </div>
  );
}
