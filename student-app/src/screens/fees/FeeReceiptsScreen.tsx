import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card, Button, SkeletonCard, EmptyState, DetailHeader } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { downloadReceiptPdf, viewReceiptPdf } from '@utils/receiptPdf';
import { buildCombinedReceipt, CombinedReceipt } from '@utils/combinedReceipt';
import { INSTALLMENT_LABEL, FEE_STATUS_LABEL, FEE_STATUS_TONE, safeDate } from '@utils/feeLabels';
import { FeePayment, InstallmentId } from '@/types';

type School = { name: string; address: string; phone: string };

function ReceiptCard({ receipt, school }: { receipt: CombinedReceipt; school: School }) {
  const lastPart = receipt.parts[receipt.parts.length - 1];
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText variant="bodySemibold">{INSTALLMENT_LABEL[receipt.installmentId]}</AppText>
          <AppText variant="tiny" color={colors.textTertiary}>
            Last payment {safeDate(lastPart.paymentDate, 'd MMM yyyy')} · {receipt.parts.length}{' '}
            {receipt.parts.length === 1 ? 'payment' : 'payments'}
          </AppText>
        </View>
        <Badge label={FEE_STATUS_LABEL[receipt.status]} tone={FEE_STATUS_TONE[receipt.status]} size="sm" />
      </View>

      <View style={styles.cardBody}>
        <View>
          <AppText variant="tiny" color={colors.textTertiary}>
            Total Paid
          </AppText>
          <AppText variant="h3" color={colors.successStrong}>
            ₹{receipt.totalPaid.toLocaleString('en-IN')}
          </AppText>
        </View>
        <View>
          <AppText variant="tiny" color={colors.textTertiary} align="right">
            Balance
          </AppText>
          <AppText variant="bodyMedium" align="right" color={receipt.balance > 0 ? colors.danger : colors.successStrong}>
            ₹{receipt.balance.toLocaleString('en-IN')}
          </AppText>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button
          label="View"
          icon="eye-outline"
          variant="outline"
          size="sm"
          onPress={() => viewReceiptPdf(receipt, school)}
          style={{ flex: 1 }}
        />
        <Button
          label="Download PDF"
          icon="download-outline"
          size="sm"
          onPress={() => downloadReceiptPdf(receipt, school)}
          style={{ flex: 1, marginLeft: spacing.sm }}
        />
      </View>
    </Card>
  );
}

export function FeeReceiptsScreen() {
  const student = useAuthStore((s) => s.student);
  const [payments, setPayments] = useState<FeePayment[] | null>(null);
  const [school, setSchool] = useState<School>({ name: 'MIS School', address: '', phone: '' });

  // Live listener, not a one-shot fetch - a receipt the admin records must
  // appear here the instant it's written, with no refresh required.
  useEffect(() => {
    if (!student) return;
    return repo.feePayments.subscribeForStudent(student.id, setPayments);
  }, [student?.id]);

  useEffect(() => repo.school.subscribe((s) => s && setSchool(s)), []);

  // Every payment folds into one consolidated receipt per installment - a
  // student who paid an installment in three parts sees one receipt with
  // all three parts listed, not three separate receipts.
  const receipts = useMemo(() => {
    if (!payments) return [];
    const groups = new Map<InstallmentId, FeePayment[]>();
    payments.forEach((p) => {
      const list = groups.get(p.installmentId) ?? [];
      list.push(p);
      groups.set(p.installmentId, list);
    });
    return (['1', '2'] as InstallmentId[])
      .map((id) => buildCombinedReceipt(groups.get(id) ?? []))
      .filter((r): r is CombinedReceipt => r !== null);
  }, [payments]);

  const loading = payments === null;
  const totalPaid = receipts.reduce((sum, r) => sum + r.totalPaid, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Fee Receipts" />

      {loading ? (
        <View style={styles.list}>
          <SkeletonCard lines={2} />
        </View>
      ) : receipts.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No receipts yet"
          message="Payment receipts recorded by the school will show up here automatically."
        />
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(r) => r.installmentId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.summary}>
              <AppText variant="caption" color={colors.textTertiary}>
                Total Paid
              </AppText>
              <AppText variant="displayMd" color={colors.primary}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </AppText>
            </View>
          }
          renderItem={({ item }) => <ReceiptCard receipt={item} school={school} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl, flexGrow: 1 },
  summary: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  cardActions: { flexDirection: 'row', marginTop: spacing.md },
});
