import { subDays, formatISO } from 'date-fns';
import { StudyMaterial } from '@/types';

const iso = (d: Date) => formatISO(d, { representation: 'date' });
const today = new Date();

export const mockMaterials: StudyMaterial[] = [
  {
    id: 'mat_1',
    title: 'Quadratic Equations — Complete Notes',
    description: 'Concept summary with solved examples covering all three solving methods.',
    subject: 'Mathematics',
    type: 'note',
    uploadedAt: iso(subDays(today, 2)),
    uploadedBy: 'Mr. Arvind Rao',
    attachment: { id: 'a1', name: 'quadratic-notes.pdf', type: 'pdf', url: 'mock://quadratic-notes.pdf' },
    sizeLabel: '3.4 MB',
  },
  {
    id: 'mat_2',
    title: 'Cell Structure & Function — Slides',
    description: 'Presentation used in class with labeled diagrams.',
    subject: 'Science',
    type: 'presentation',
    uploadedAt: iso(subDays(today, 4)),
    uploadedBy: 'Dr. Sunita Verma',
    attachment: { id: 'a2', name: 'cell-structure.pptx', type: 'doc', url: 'mock://cell-structure.pptx' },
    sizeLabel: '8.1 MB',
  },
  {
    id: 'mat_3',
    title: 'Grammar Worksheet — Reported Speech',
    subject: 'English',
    type: 'worksheet',
    uploadedAt: iso(subDays(today, 6)),
    uploadedBy: 'Ms. Priya Nair',
    attachment: { id: 'a3', name: 'reported-speech-ws.pdf', type: 'pdf', url: 'mock://reported-speech.pdf' },
    sizeLabel: '620 KB',
  },
  {
    id: 'mat_4',
    title: 'Previous Year Question Bank — Social Studies',
    description: 'Compiled questions from the last 5 years of mid-term and final exams.',
    subject: 'Social Studies',
    type: 'question_bank',
    uploadedAt: iso(subDays(today, 9)),
    uploadedBy: 'Mr. Karan Mehta',
    attachment: { id: 'a4', name: 'sst-question-bank.pdf', type: 'pdf', url: 'mock://sst-qb.pdf' },
    sizeLabel: '5.7 MB',
  },
  {
    id: 'mat_5',
    title: 'Recorded Lecture — Python Functions',
    subject: 'Computer Science',
    type: 'video',
    uploadedAt: iso(subDays(today, 3)),
    uploadedBy: 'Mr. Rohit Malhotra',
    attachment: { id: 'a5', name: 'python-functions.mp4', type: 'video', url: 'mock://python-functions.mp4' },
    durationLabel: '18:42',
  },
  {
    id: 'mat_6',
    title: 'संधि और समास — Practice Notes',
    subject: 'Hindi',
    type: 'note',
    uploadedAt: iso(subDays(today, 11)),
    uploadedBy: 'Mrs. Anjali Gupta',
    attachment: { id: 'a6', name: 'sandhi-samaas.pdf', type: 'pdf', url: 'mock://sandhi-samaas.pdf' },
    sizeLabel: '1.1 MB',
  },
  {
    id: 'mat_7',
    title: 'Acid-Base Titration — Lab Demo Recording',
    subject: 'Science',
    type: 'video',
    uploadedAt: iso(subDays(today, 7)),
    uploadedBy: 'Dr. Sunita Verma',
    attachment: { id: 'a7', name: 'titration-demo.mp4', type: 'video', url: 'mock://titration-demo.mp4' },
    durationLabel: '11:20',
  },
];

export const materialTypeLabels: Record<string, string> = {
  note: 'Notes',
  presentation: 'Presentations',
  worksheet: 'Worksheets',
  question_bank: 'Question Banks',
  video: 'Recorded Lectures',
  other: 'Other',
};
