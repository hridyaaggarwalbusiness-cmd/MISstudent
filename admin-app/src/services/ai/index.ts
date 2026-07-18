// Single swap point: change this one export to point at a different
// NoticeProvider implementation (ChatGPT, Claude, a future Cloud Function
// once Blaze is enabled, ...) and nothing else in the app needs to change.
export { geminiProvider as noticeProvider } from './geminiProvider';
export { NoticeGenerationError } from './noticeProvider';
export type { GeneratedNoticeContent, NoticeGenerateRequest, NoticeProvider } from './noticeProvider';
