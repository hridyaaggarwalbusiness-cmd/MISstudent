import { Difficulty, GradeAnswersRequest, PaperLanguage, PaperType, PracticeTestRequest, QuestionType } from './types';

const PAPER_TYPE_LABEL: Record<PaperType, string> = {
  practice_test: 'Practice Test',
  unit_test: 'Unit Test',
  half_yearly: 'Half-Yearly Pattern',
  annual_exam: 'Annual Exam Pattern',
  mcq_practice: 'MCQ Practice',
  revision_test: 'Revision Test',
};

const PAPER_TYPE_GUIDANCE: Record<PaperType, string> = {
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

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  mixed: 'Mixed (a deliberate spread of easy, medium and hard questions)',
};

const LANGUAGE_LABEL: Record<PaperLanguage, string> = {
  english: 'English',
  hindi: 'Hindi',
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

// Deliberately NOT a text-comparison prompt: it is never given a "model
// answer" to diff the student's response against - see prompt.ts's sibling
// student-app copy for the full reasoning. Kept in sync by hand.
export function buildGradeAnswersPrompt(input: GradeAnswersRequest): string {
  const { request, answers } = input;
  const questionsBlock = answers
    .map(
      (a, i) => `${i + 1}. [id: "${a.questionId}"]
Question: ${a.questionText}
Maximum marks: ${a.maxMarks}
Student's answer: ${a.studentAnswer.trim() || '(left blank)'}`,
    )
    .join('\n\n');

  return `You are an experienced, fair CBSE examiner evaluating answer sheets for a ${DIFFICULTY_LABEL[request.difficulty]}-difficulty ${request.subject} paper, ${request.classLabel}. You are marking from your own subject expertise, exactly as a real teacher checking a physical answer sheet would - not by comparing text against a prewritten answer key.

For each of the following ${answers.length} answers, first understand what the student is trying to say, then evaluate the CONCEPT, REASONING, FACTS, CALCULATIONS, and CONCLUSION - never the wording or sentence structure.

The student is free to:
- use different wording, sentence structure, or vocabulary than a textbook would
- explain the idea in their own words or in simple English
- give answer points/bullets instead of full paragraphs
- write a shorter or longer answer than expected
- use synonyms or different but equivalent examples

None of the above may ever cost the student marks by itself.

Strict grading rules - apply identically to every answer:
1. If the student's concept, reasoning, facts, and conclusion are correct, award FULL marks - regardless of how differently it is phrased, structured, or how short/long it is.
2. Deduct marks ONLY for a concrete, identifiable reason: a required concept/point is genuinely missing from the answer, a fact or calculation is wrong, or a claim contradicts the correct understanding of the topic. Never deduct for wording, structure, or language style alone.
3. Never mark all-or-nothing. When some concepts are present and correct but others are missing or wrong, award partial marks proportional to how much of the complete, correct answer is actually there.
4. Ignore grammar mistakes, spelling mistakes, punctuation, and writing style entirely, UNLESS the question itself is specifically testing language/grammar/composition skills (e.g. an English-subject writing question) - only then do those things matter.
5. Award 0 marks only when the answer is left blank or is entirely unrelated to what the question asks.
6. Be consistent: given the same answer quality, always arrive at the same score - apply one fixed standard across every question and every student, not a variable one.

${questionsBlock}

Respond with ONLY raw JSON (no markdown, no commentary) - an array with exactly one object per question, in any order, matching exactly:
[
  {
    "questionId": string (copy the "id" given above),
    "marksAwarded": number (0 to that question's maximum marks, may be a whole or half number),
    "explanation": string (1-2 sentences: what the student got right, in your own words - why this many marks),
    "missingConcepts": string[] (specific concepts/points required by the question that the answer did not cover; empty array if nothing is missing),
    "incorrectConcepts": string[] (specific facts, claims, or calculations in the answer that are wrong; empty array if none),
    "suggestions": string (one short, concrete, actionable sentence on how the student could improve this answer; empty string if the answer already earned full marks)
  }
]`;
}
