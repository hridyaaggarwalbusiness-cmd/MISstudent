import { GradeAnswersRequest, PracticeTestRequest, QuestionType } from '@/types';
import { DIFFICULTY_LABEL, LANGUAGE_LABEL, PAPER_TYPE_LABEL } from '@data/practiceTestOptions';

const PAPER_TYPE_GUIDANCE: Record<PracticeTestRequest['paperType'], string> = {
  practice_test: 'Produce a balanced mix across MCQ, short-answer, and long-answer sections.',
  unit_test:
    'Keep it short and tightly focused on these chapters/topics - typically 2-4 sections, weighted toward short and very-short answers.',
  half_yearly:
    "Follow a realistic CBSE half-yearly (mid-term) board pattern: Section A (MCQ + Very Short Answer), Section B (Short Answer), Section C (Long Answer), and a Case Study / Assertion-Reason section if the class and subject support it.",
  annual_exam:
    "Follow a realistic full CBSE annual/board exam pattern with 4-5 sections mirroring an actual board paper's structure and weightage for this subject and class.",
  mcq_practice:
    'At least 85% of the total marks must come from Multiple Choice Questions; only add a small Assertion-Reason section if it naturally fits, otherwise keep it pure MCQ.',
  revision_test:
    'Favor quick-recall formats: MCQ, Fill in the Blanks, True/False, and Very Short Answer. Minimize long-form questions.',
};

const SCHEMA_BLOCK = `{
  "title": string,
  "generalInstructions": string[],
  "sections": [
    {
      "id": string (kebab-case slug, e.g. "section-a"),
      "title": string (e.g. "Section A: Multiple Choice Questions"),
      "instructions": string (optional, e.g. "Answer all questions. 1 mark each."),
      "questions": [
        {
          "id": string (unique within the paper, e.g. "q1"),
          "number": number (sequential across the WHOLE paper, starting at 1),
          "type": "mcq" | "fill_blank" | "true_false" | "match_following" | "very_short" | "short" | "long" | "case_study" | "assertion_reason" | "numerical",
          "text": string,
          "marks": number,
          "options": string[] (for type "mcq" - exactly 4 options, no "A)"/"B)" prefixes; for type "assertion_reason" - see rule 3 below),
          "matchPairs": [{ "left": string, "right": string }] (ONLY for type "match_following", at least 4 pairs),
          "caseText": string (ONLY for type "case_study" or "assertion_reason" - the passage, or the Assertion (A) + Reason (R) statements),
          "answer": string (correct option / correct value / concise model answer),
          "explanation": string (optional, one sentence, only when it adds real value)
        }
      ]
    }
  ]
}`;

function topicsLine(topics: string[]): string {
  return topics.length > 1 ? topics.map((t, i) => `${i + 1}. ${t}`).join('\n') : topics[0] ?? '';
}

// Mirrors functions/src/practiceTest/prompt.ts - kept as a client-side copy
// since this app currently talks to the AI provider directly (see
// geminiProvider.ts) rather than through the Cloud Functions backend, which
// needs the Blaze plan. The two copies stay in sync by hand, same as the
// fee-receipt utilities elsewhere in this codebase.
export function buildGeneratePrompt(request: PracticeTestRequest): string {
  const { classLabel, subject, topics, paperType, totalMarks, difficulty, language, durationMinutes } = request;
  const languageLabel = LANGUAGE_LABEL[language];
  const languageInstruction =
    language === 'hindi'
      ? 'Write the ENTIRE paper - every instruction, section title, question and answer - in Hindi (Devanagari script).'
      : 'Write the entire paper in English.';
  const durationLine = durationMinutes
    ? `Time allowed: ${durationMinutes} minutes (mention this in the general instructions).`
    : '';
  const topicWord = topics.length > 1 ? 'Chapters / Topics' : 'Chapter / Topic';
  const topicsForTitle = topics.length > 1 ? `${topics[0]} & more` : topics[0];
  const coverageRule =
    topics.length > 1
      ? `Cover ALL of the following ${topics.length} topics in this one paper, with a roughly balanced spread of marks across them (no single topic should dominate unless the mark total makes an even split impossible) - clearly this is a combined/multi-topic paper, not just the first topic:\n${topicsLine(topics)}`
      : `Only include content genuinely relevant to "${topics[0]}" within ${subject} for ${classLabel} under the CBSE syllabus. Do not drift into unrelated chapters or topics.`;

  return `You are an expert CBSE (Central Board of Secondary Education, India) school examiner and question paper setter with 20 years of experience.

Generate one complete, syllabus-accurate CBSE question paper using ONLY the details below. Do not use any class, subject, or topic other than the ones specified here.

Class: ${classLabel}
Subject: ${subject}
${topicWord}: ${topicsLine(topics)}
Paper type: ${PAPER_TYPE_LABEL[paperType]}
Total marks: ${totalMarks} - the marks of every question, across every section, MUST sum to EXACTLY ${totalMarks}. This is a hard requirement; add them up yourself before responding and adjust if they don't match.
Difficulty: ${DIFFICULTY_LABEL[difficulty]}
Language: ${languageLabel}. ${languageInstruction}
${durationLine}

Rules:
1. ${coverageRule}
2. Structure the paper into sections appropriate for the paper type and class level, choosing only from these formats where they genuinely fit - never force one that doesn't:
   - Multiple Choice Questions (MCQs, usually 1 mark each, exactly 4 options)
   - Fill in the Blanks
   - True / False
   - Match the Following (only if there are at least 4 natural pairs)
   - Very Short Answer Questions (1-2 marks)
   - Short Answer Questions (2-3 marks)
   - Long Answer Questions (4-5 marks)
   - Case Study Questions (ONLY for Class 9 and above, and only when a topic genuinely supports a case-based passage)
   - Assertion-Reason Questions (ONLY for Class 9 and above, when appropriate) - these MUST follow the standard CBSE format: "caseText" holds "Assertion (A): ..." on one line and "Reason (R): ..." on the next, "text" asks the student to choose the correct relationship, and "options" is EXACTLY these four fixed choices in this order: "Both A and R are true and R is the correct explanation of A.", "Both A and R are true but R is NOT the correct explanation of A.", "A is true but R is false.", "A is false but R is true." - "answer" must be the exact text of the correct one of those four.
   - Numerical Problems (ONLY for Mathematics, Physics, Chemistry, or Science subjects where a topic involves calculation)
3. See the Assertion-Reason format requirement above - do not deviate from it when using that question type.
4. Every single question object must state the exact marks it is worth, and section/paper totals must be internally consistent with rule 1 above (or rule 1's multi-topic spread, when there is more than one topic).
5. Never repeat, or lightly reword, the same question within the paper - every question must be genuinely distinct.
6. Apply "${DIFFICULTY_LABEL[difficulty]}" difficulty consistently across the paper.
7. Every question needs a correct "answer": for MCQ/assertion-reason it must be the exact text of the correct option; for fill-blank/true-false/match/numerical it must be short and unambiguous; for short/long-answer/case-study questions give the key expected points in 2-4 sentences, not a full essay.
8. Write 3-6 short, natural general exam instructions in "generalInstructions" (e.g. "All questions are compulsory.", "Marks are indicated against each question.").
9. Give the paper a professional title in the form "${subject} — ${topicsForTitle} — ${PAPER_TYPE_LABEL[paperType]}".
10. Number every question sequentially across the WHOLE paper (1, 2, 3, ...), continuing the count across sections - never restart numbering per section.

Respond with ONLY raw JSON (no markdown code fences, no commentary before or after it) matching EXACTLY this shape:

${SCHEMA_BLOCK}`;
}

export function buildRegenerateQuestionPrompt(input: {
  request: PracticeTestRequest;
  existingQuestionTexts: string[];
  sectionTitle: string;
  questionType: QuestionType;
  marks: number;
}): string {
  const { request, existingQuestionTexts, sectionTitle, questionType, marks } = input;
  const languageLabel = LANGUAGE_LABEL[request.language];
  const languageInstruction = request.language === 'hindi' ? 'Write it entirely in Hindi (Devanagari script).' : 'Write it entirely in English.';
  const existingList = existingQuestionTexts.length
    ? existingQuestionTexts.map((t, i) => `${i + 1}. ${t}`).join('\n')
    : '(none)';
  const topicWord = request.topics.length > 1 ? 'Chapters / Topics' : 'Chapter / Topic';
  const assertionReasonNote =
    questionType === 'assertion_reason'
      ? '\nThis MUST follow the standard CBSE Assertion-Reason format: "caseText" holds "Assertion (A): ..." then "Reason (R): ...", and "options" is EXACTLY these four fixed choices in order: "Both A and R are true and R is the correct explanation of A.", "Both A and R are true but R is NOT the correct explanation of A.", "A is true but R is false.", "A is false but R is true." - "answer" is the exact text of the correct one.'
      : '';

  return `You are an expert CBSE examiner. Produce ONE replacement question for a CBSE paper, matching these constraints exactly:

Class: ${request.classLabel}
Subject: ${request.subject}
${topicWord}: ${topicsLine(request.topics)}
Section: ${sectionTitle}
Question type: ${questionType}
Marks: ${marks}
Difficulty: ${DIFFICULTY_LABEL[request.difficulty]}
Language: ${languageLabel}. ${languageInstruction}${assertionReasonNote}

The new question must be substantively different from every one of these questions already in the paper - do not repeat or lightly reword any of them:
${existingList}

Respond with ONLY raw JSON (no markdown, no commentary) matching exactly:
{
  "text": string,
  "options": string[] (for type "mcq" - exactly 4 options, no "A)"/"B)" prefixes; for "assertion_reason" - the four fixed choices described above),
  "matchPairs": [{ "left": string, "right": string }] (ONLY if type is "match_following", at least 4 pairs),
  "caseText": string (ONLY if type is "case_study" or "assertion_reason"),
  "answer": string,
  "explanation": string (optional)
}`;
}

// Grades a batch of subjective (free-text) answers in one call, rather than
// one AI request per question, to keep quota usage low on a single test
// submission.
export function buildGradeAnswersPrompt(input: GradeAnswersRequest): string {
  const { request, answers } = input;
  const questionsBlock = answers
    .map(
      (a, i) => `${i + 1}. [id: "${a.questionId}", max marks: ${a.maxMarks}]
Question: ${a.questionText}
Model answer: ${a.modelAnswer}
Student's answer: ${a.studentAnswer.trim() || '(left blank)'}`,
    )
    .join('\n\n');

  return `You are an expert, fair CBSE examiner grading a ${DIFFICULTY_LABEL[request.difficulty]}-difficulty ${request.subject} paper for ${request.classLabel}.

Grade each of the following ${answers.length} student answers against its model answer. Follow these rules strictly and apply them the same way to every answer:

1. Judge MEANING, never exact wording. The model answer is a reference for what correct understanding looks like, not a script to match word-for-word. Different phrasing, synonyms, different but equivalent examples, reordered points, different units/notation for the same value, or a shorter answer that still states the key idea correctly must NOT lose marks.
2. If the student's answer conveys everything the question requires and contains nothing factually wrong, award FULL marks - even if it's phrased completely differently from the model answer, is more concise, or adds correct extra detail.
3. Only deduct marks for a concrete, identifiable reason: a required point that is genuinely missing, a factual error, or a claim that contradicts the correct answer. Never deduct marks just because the wording differs from the model answer.
4. Award partial credit proportional to how many of the required key points are present when the answer is incomplete or partially correct.
5. Award 0 marks only for answers left blank or entirely unrelated to the question.
6. Be consistent: the same quality of answer must receive the same score every time you grade it - do not vary your standard between questions or students.

${questionsBlock}

Respond with ONLY raw JSON (no markdown, no commentary) - an array with exactly one object per question, in any order, matching exactly:
[
  {
    "questionId": string (copy the "id" given above),
    "marksAwarded": number (0 to the question's max marks, may be a whole or half number),
    "feedback": string (one short sentence - if marks were deducted, name the specific missing point or error; if full marks were awarded, briefly say why the answer is correct)
  }
]`;
}
