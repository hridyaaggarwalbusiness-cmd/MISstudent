import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { AppText, Button, Card, Chip, DetailHeader, SegmentedControl, Divider, PulsingIcon, TypingDots } from '@components/ui';
import { StepIndicator } from '@components/practiceTest/StepIndicator';
import { OptionCard } from '@components/practiceTest/OptionCard';
import { FormField } from '@components/practiceTest/FormField';
import { TopicTagInput } from '@components/practiceTest/TopicTagInput';
import { colors, radius, spacing } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { paperProvider, friendlyAiErrorMessage } from '@services/ai';
import {
  CLASS_OPTIONS,
  DIFFICULTY_OPTIONS,
  DURATION_PRESETS,
  LANGUAGE_LABEL,
  MARKS_PRESETS,
  PAPER_TYPE_OPTIONS,
  languagesForSubject,
  subjectsForClass,
} from '@data/practiceTestOptions';
import { Difficulty, PaperLanguage, PaperType, PracticeTestRequest } from '@/types';

const STEPS = ['Topic', 'Format', 'Review'];

function defaultClassLabel(className?: string): string {
  if (!className) return CLASS_OPTIONS[4];
  const match = CLASS_OPTIONS.find((c) => className.toLowerCase().includes(c.toLowerCase()));
  return match ?? CLASS_OPTIONS[4];
}

export function PracticeTestGeneratorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const student = useAuthStore((s) => s.student);

  const [step, setStep] = useState(0);
  const [classLabel, setClassLabel] = useState(() => defaultClassLabel(student?.className));
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [paperType, setPaperType] = useState<PaperType>('practice_test');
  const [totalMarks, setTotalMarks] = useState<number>(20);
  const [customMarks, setCustomMarks] = useState('');
  const [showCustomMarks, setShowCustomMarks] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [language, setLanguage] = useState<PaperLanguage>('english');
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(60);
  const [customDuration, setCustomDuration] = useState('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [skipDuration, setSkipDuration] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectOptions = useMemo(() => subjectsForClass(classLabel), [classLabel]);
  const availableLanguages = useMemo(() => languagesForSubject(subject || subjectOptions[0]), [subject, subjectOptions]);

  React.useEffect(() => {
    if (!subjectOptions.includes(subject)) setSubject('');
  }, [subjectOptions, subject]);

  React.useEffect(() => {
    if (!availableLanguages.includes(language)) setLanguage(availableLanguages[0]);
  }, [availableLanguages, language]);

  const step0Valid = classLabel.length > 0 && subject.length > 0 && topics.length > 0;
  const step1Valid = totalMarks > 0 && totalMarks <= 200;

  function goNext() {
    if (step === 0 && !step0Valid) return;
    if (step === 1 && !step1Valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleGenerate() {
    const request: PracticeTestRequest = {
      classLabel,
      subject,
      topics,
      paperType,
      totalMarks,
      difficulty,
      language,
      durationMinutes: skipDuration ? undefined : durationMinutes,
    };
    setGenerating(true);
    setError(null);
    try {
      const paper = await paperProvider.generatePaper(request);
      navigation.navigate('PracticeTestResult', { paper });
    } catch (err) {
      setError(friendlyAiErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <View style={styles.loadingSafe}>
        <PulsingIcon name="sparkles" size={84} iconSize={36} />
        <AppText variant="h2" align="center" style={{ marginTop: spacing.lg }}>
          Crafting your CBSE paper...
        </AppText>
        <AppText variant="body" color={colors.textSecondary} align="center" style={{ marginTop: 6, maxWidth: 280 }}>
          Our AI is writing {totalMarks} marks of {subject || 'your subject'} questions on {topics.map((t) => `“${t}”`).join(', ')}.
          This usually takes under a minute.
        </AppText>
        <View style={{ marginTop: spacing.lg }}>
          <TypingDots />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <DetailHeader title="AI Practice Test Generator" />
      <StepIndicator steps={STEPS} currentIndex={step} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <>
            <HeroBanner />
            <SectionLabel text="Class" />
            <ChipRow options={CLASS_OPTIONS} value={classLabel} onChange={setClassLabel} />

            <SectionLabel text="Subject" />
            <ChipRow options={subjectOptions} value={subject} onChange={setSubject} />

            <SectionLabel text="Chapters / Topics" />
            <TopicTagInput topics={topics} onChange={setTopics} placeholder="e.g. Photosynthesis, Fractions..." />
          </>
        )}

        {step === 1 && (
          <>
            <SectionLabel text="Paper Type" />
            {PAPER_TYPE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                title={opt.label}
                description={opt.description}
                selected={paperType === opt.value}
                onPress={() => setPaperType(opt.value)}
              />
            ))}

            <SectionLabel text="Total Marks" style={{ marginTop: spacing.md }} />
            <View style={styles.wrapRow}>
              {MARKS_PRESETS.map((m) => (
                <Chip
                  key={m}
                  label={String(m)}
                  active={!showCustomMarks && totalMarks === m}
                  onPress={() => {
                    setShowCustomMarks(false);
                    setTotalMarks(m);
                  }}
                  style={{ marginRight: 8, marginBottom: 8 }}
                />
              ))}
              <Chip
                label="Custom"
                active={showCustomMarks}
                onPress={() => setShowCustomMarks(true)}
                style={{ marginRight: 8, marginBottom: 8 }}
              />
            </View>
            {showCustomMarks && (
              <FormField
                placeholder="Enter total marks (e.g. 25)"
                keyboardType="number-pad"
                value={customMarks}
                onChangeText={(t) => {
                  setCustomMarks(t);
                  const n = parseInt(t, 10);
                  if (!Number.isNaN(n) && n > 0) setTotalMarks(n);
                }}
              />
            )}

            <SectionLabel text="Difficulty" />
            <SegmentedControl
              options={DIFFICULTY_OPTIONS.map((d) => d.label)}
              selectedIndex={DIFFICULTY_OPTIONS.findIndex((d) => d.value === difficulty)}
              onChange={(i) => setDifficulty(DIFFICULTY_OPTIONS[i].value)}
            />

            {availableLanguages.length > 1 && (
              <>
                <SectionLabel text="Language" />
                <SegmentedControl
                  options={availableLanguages.map((l) => LANGUAGE_LABEL[l])}
                  selectedIndex={availableLanguages.findIndex((l) => l === language)}
                  onChange={(i) => setLanguage(availableLanguages[i])}
                />
              </>
            )}

            <View style={styles.durationHeaderRow}>
              <SectionLabel text="Time Duration (Optional)" style={{ marginBottom: 0 }} />
              <Chip
                label={skipDuration ? 'Skipped' : 'Skip'}
                active={skipDuration}
                onPress={() => setSkipDuration((v) => !v)}
              />
            </View>
            {!skipDuration && (
              <>
                <View style={styles.wrapRow}>
                  {DURATION_PRESETS.map((d) => (
                    <Chip
                      key={d}
                      label={`${d} min`}
                      active={!showCustomDuration && durationMinutes === d}
                      onPress={() => {
                        setShowCustomDuration(false);
                        setDurationMinutes(d);
                      }}
                      style={{ marginRight: 8, marginBottom: 8 }}
                    />
                  ))}
                  <Chip
                    label="Custom"
                    active={showCustomDuration}
                    onPress={() => setShowCustomDuration(true)}
                    style={{ marginRight: 8, marginBottom: 8 }}
                  />
                </View>
                {showCustomDuration && (
                  <FormField
                    placeholder="Enter minutes (e.g. 75)"
                    keyboardType="number-pad"
                    value={customDuration}
                    onChangeText={(t) => {
                      setCustomDuration(t);
                      const n = parseInt(t, 10);
                      if (!Number.isNaN(n) && n > 0) setDurationMinutes(n);
                    }}
                  />
                )}
              </>
            )}
          </>
        )}

        {step === 2 && (
          <ReviewStep
            classLabel={classLabel}
            subject={subject}
            topics={topics}
            paperType={paperType}
            totalMarks={totalMarks}
            difficulty={difficulty}
            language={language}
            durationMinutes={skipDuration ? undefined : durationMinutes}
            error={error}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < STEPS.length - 1 ? (
          <Button
            label="Continue"
            onPress={goNext}
            disabled={step === 0 ? !step0Valid : !step1Valid}
            fullWidth
            icon="arrow-forward"
            iconPosition="right"
          />
        ) : (
          <Button label="Generate Paper" onPress={handleGenerate} fullWidth icon="sparkles" />
        )}
      </View>
    </View>
  );
}

function HeroBanner() {
  return (
    <View style={styles.hero}>
      <View style={styles.heroIconWrap}>
        <Ionicons name="sparkles" size={22} color={colors.textInverse} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <View style={styles.heroTitleRow}>
          <AppText variant="h3" color={colors.textInverse}>
            AI Practice Test Generator
          </AppText>
          <View style={styles.premiumBadge}>
            <AppText variant="tiny" color={colors.textInverse} style={{ fontWeight: '700' }}>
              PREMIUM
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
          Get a fresh CBSE-style question paper on any topic, instantly.
        </AppText>
      </View>
    </View>
  );
}

function SectionLabel({ text, style }: { text: string; style?: object }) {
  return (
    <AppText variant="bodySemibold" style={[{ marginTop: spacing.lg, marginBottom: spacing.sm }, style]}>
      {text}
    </AppText>
  );
}

function ChipRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.wrapRow}>
      {options.map((opt) => (
        <Chip key={opt} label={opt} active={value === opt} onPress={() => onChange(opt)} style={{ marginRight: 8, marginBottom: 8 }} />
      ))}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <AppText variant="caption" color={colors.textTertiary}>
        {label}
      </AppText>
      <AppText variant="bodySemibold">{value}</AppText>
    </View>
  );
}

function ReviewStep(props: {
  classLabel: string;
  subject: string;
  topics: string[];
  paperType: PaperType;
  totalMarks: number;
  difficulty: Difficulty;
  language: PaperLanguage;
  durationMinutes?: number;
  error: string | null;
}) {
  const paperTypeLabel = PAPER_TYPE_OPTIONS.find((o) => o.value === props.paperType)?.label ?? props.paperType;
  const difficultyLabel = DIFFICULTY_OPTIONS.find((o) => o.value === props.difficulty)?.label ?? props.difficulty;
  return (
    <View>
      <SectionLabel text="Review Your Paper" style={{ marginTop: spacing.sm }} />
      <Card>
        <ReviewRow label="Class" value={props.classLabel} />
        <Divider style={{ marginVertical: spacing.sm }} />
        <ReviewRow label="Subject" value={props.subject} />
        <Divider style={{ marginVertical: spacing.sm }} />
        <ReviewRow label={props.topics.length > 1 ? 'Chapters / Topics' : 'Chapter / Topic'} value={props.topics.join(', ')} />
        <Divider style={{ marginVertical: spacing.sm }} />
        <ReviewRow label="Paper Type" value={paperTypeLabel} />
        <Divider style={{ marginVertical: spacing.sm }} />
        <ReviewRow label="Total Marks" value={String(props.totalMarks)} />
        <Divider style={{ marginVertical: spacing.sm }} />
        <ReviewRow label="Difficulty" value={difficultyLabel} />
        <Divider style={{ marginVertical: spacing.sm }} />
        <ReviewRow label="Language" value={LANGUAGE_LABEL[props.language]} />
        <Divider style={{ marginVertical: spacing.sm }} />
        <ReviewRow label="Duration" value={props.durationMinutes ? `${props.durationMinutes} minutes` : 'Not specified'} />
      </Card>
      {props.error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <AppText variant="caption" color={colors.dangerStrong} style={{ marginLeft: 6, flex: 1 }}>
            {props.error}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  premiumBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  durationHeaderRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  loadingSafe: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  loadingIconWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
