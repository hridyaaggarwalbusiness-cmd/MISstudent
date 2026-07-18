import { useEffect, useRef } from 'react';
import { drawNoticeOnCanvas } from '@/utils/noticeTemplate';
import type { NoticeTemplateData } from '@/utils/noticeTemplate';
import styles from './NoticePreview.module.css';

// Renders the official notice template live as the admin edits the form -
// this is the exact same draw routine used for the PDF/image exports, so
// what's shown here is always what gets downloaded and published.
export function NoticePreview({ data }: { data: NoticeTemplateData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawNoticeOnCanvas(canvasRef.current, data);
  }, [data]);

  return (
    <div className={styles.frame}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
