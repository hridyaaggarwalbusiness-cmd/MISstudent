import type { NoticeAudience, NoticePriority, NoticeType } from '@/types';

// The one contract every concrete AI backend must satisfy - swapping the
// underlying model (ChatGPT, Claude, Gemini, ...) means writing one new file
// that implements it and pointing index.ts at it, nothing else changes.
// Mirrors student-app/src/services/ai/paperProvider.ts's design.
export interface NoticeGenerateRequest {
  noticeType: NoticeType;
  audience: NoticeAudience;
  classLabels: string[];
  priority: NoticePriority;
  noticeDate: string;
  effectiveDate?: string;
  titleHint?: string;
  instruction: string;
}

export interface GeneratedNoticeContent {
  title: string;
  body: string;
}

export interface NoticeProvider {
  generateNotice(request: NoticeGenerateRequest): Promise<GeneratedNoticeContent>;
}

export class NoticeGenerationError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
    this.name = 'NoticeGenerationError';
  }
}
