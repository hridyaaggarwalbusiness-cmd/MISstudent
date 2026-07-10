import { addDays, subDays, formatISO } from 'date-fns';
import { Homework } from '@/types';

const iso = (d: Date) => formatISO(d, { representation: 'date' });
const today = new Date();

let counter = 0;
function id(prefix: string) {
  counter += 1;
  return `${prefix}_${counter}`;
}

export const mockHomework: Homework[] = [
  {
    id: id('hw'),
    subject: 'Mathematics',
    title: 'Quadratic Equations — Practice Set 4',
    instructions:
      'Solve all 15 problems from Chapter 4, Exercise 4.3. Show complete step-by-step working for factorization and the quadratic formula method. Attach clear photos of your handwritten solutions.',
    assignedDate: iso(subDays(today, 2)),
    dueDate: iso(addDays(today, 1)),
    teacher: 'Mr. Arvind Rao',
    status: 'pending',
    attachments: [
      { id: id('att'), name: 'Exercise 4.3.pdf', type: 'pdf', url: 'mock://exercise-4.3.pdf', sizeLabel: '1.2 MB' },
    ],
  },
  {
    id: id('hw'),
    subject: 'English',
    title: 'Essay: "A Journey I Will Never Forget"',
    instructions:
      'Write a descriptive essay of 400-500 words. Focus on sensory details and a clear narrative arc. Use at least 5 vocabulary words from Unit 6.',
    assignedDate: iso(subDays(today, 1)),
    dueDate: iso(addDays(today, 3)),
    teacher: 'Ms. Priya Nair',
    status: 'pending',
    attachments: [],
  },
  {
    id: id('hw'),
    subject: 'Science',
    title: 'Lab Report — Acid-Base Titration',
    instructions:
      'Complete the lab report template based on Friday\'s titration experiment. Include observations, calculations, and a conclusion paragraph.',
    assignedDate: iso(subDays(today, 5)),
    dueDate: iso(subDays(today, 1)),
    teacher: 'Dr. Sunita Verma',
    status: 'submitted',
    attachments: [
      { id: id('att'), name: 'Lab Template.docx', type: 'doc', url: 'mock://lab-template.docx', sizeLabel: '340 KB' },
    ],
    submission: {
      submittedAt: iso(subDays(today, 1)),
      attachments: [
        { id: id('att'), name: 'my-lab-report.pdf', type: 'pdf', url: 'mock://my-lab-report.pdf', sizeLabel: '890 KB' },
      ],
      note: 'Completed all calculations, let me know if the graph needs redoing.',
    },
  },
  {
    id: id('hw'),
    subject: 'Social Studies',
    title: 'Map Work — Indian River Systems',
    instructions:
      'Label the major rivers, tributaries, and dams on the provided outline map of India. Color-code according to river basins.',
    assignedDate: iso(subDays(today, 8)),
    dueDate: iso(subDays(today, 4)),
    teacher: 'Mr. Karan Mehta',
    status: 'graded',
    attachments: [
      { id: id('att'), name: 'India Outline Map.pdf', type: 'pdf', url: 'mock://india-map.pdf', sizeLabel: '2.1 MB' },
    ],
    submission: {
      submittedAt: iso(subDays(today, 5)),
      attachments: [
        { id: id('att'), name: 'river-map-completed.jpg', type: 'image', url: 'mock://river-map.jpg', sizeLabel: '1.4 MB' },
      ],
    },
    remarks: {
      grade: 'A',
      marks: 18,
      maxMarks: 20,
      comment: 'Excellent labeling and neat coloring. Double-check the Godavari tributaries next time.',
      gradedAt: iso(subDays(today, 2)),
    },
  },
  {
    id: id('hw'),
    subject: 'Hindi',
    title: 'व्याकरण अभ्यास — संधि और समास',
    instructions: 'पाठ्यपुस्तक से संधि और समास पर 20 प्रश्न हल करें। उदाहरण सहित उत्तर दें।',
    assignedDate: iso(subDays(today, 10)),
    dueDate: iso(subDays(today, 6)),
    teacher: 'Mrs. Anjali Gupta',
    status: 'overdue',
    attachments: [],
  },
  {
    id: id('hw'),
    subject: 'Computer Science',
    title: 'Python Basics — Loops & Conditionals',
    instructions:
      'Write 5 short Python programs demonstrating for-loops, while-loops, and if-elif-else chains. Submit as a single .py file or PDF with screenshots of output.',
    assignedDate: iso(today),
    dueDate: iso(addDays(today, 6)),
    teacher: 'Mr. Rohit Malhotra',
    status: 'pending',
    attachments: [
      { id: id('att'), name: 'Loop Reference Notes.pdf', type: 'pdf', url: 'mock://loops.pdf', sizeLabel: '540 KB' },
      { id: id('att'), name: 'Demo walkthrough', type: 'video', url: 'mock://loops-demo.mp4', sizeLabel: '12:04' },
    ],
  },
];
