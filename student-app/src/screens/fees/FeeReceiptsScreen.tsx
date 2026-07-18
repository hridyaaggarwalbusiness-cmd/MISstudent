import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card, Button, SkeletonCard, EmptyState, DetailHeader } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { downloadReceiptPdf, viewReceiptPdf } from '@utils/receiptPdf';
import { INSTALLMENT_LABEL, PAYMENT_METHOD_LABEL, FEE_STATUS_LABEL, FEE_STATUS_TONE, safeDate } from '@utils/feeLabels';
import { FeePayment } from '@/types';

type School = { name: string; address: string; phone: string };

function ReceiptCard({ payment, school }: { payment: FeePayment; school: School }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText variant="bodySemibold">{INSTALLMENT_LABEL[payment.installmentId]}</AppText>
          <AppText variant="tiny" color={colors.textTertiary}>
            {safeDate(payment.paymentDate, 'd MMM yyyy')} · {payment.receiptNo}
          </AppText>
        </View>
        <Badge label={FEE_STATUS_LABEL[payment.statusAfter]} tone={FEE_STATUS_TONE[payment.statusAfter]} size="sm" />
      </View>

      <View style={styles.cardBody}>
        <View>
          <AppText variant="tiny" color={colors.textTertiary}>
            Amount Paid
          </AppText>
          <AppText variant="h3" color={colors.successStrong}>
            ₹{payment.amount.toLocaleString('en-IN')}
          </AppText>
        </View>
        <View>
          <AppText variant="tiny" color={colors.textTertiary} align="right">
            Payment Mode
          </AppText>
          <AppText variant="bodyMedium" align="right">
            {PAYMENT_METHOD_LABEL[payment.paymentMethod]}
          </AppText>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button
          label="View"
          icon="eye-outline"
          variant="outline"
          size="sm"
          onPress={() => viewReceiptPdf(payment, school)}
          style={{ flex: 1 }}
        />
        <Button
          label="Download PDF"
          icon="download-outline"
          size="sm"
          onPress={() => downloadReceiptPdf(payment, school)}
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

  const loading = payments === null;
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Fee Receipts" />

      {loading ? (
        <View style={styles.list}>
          <SkeletonCard lines={2} />
        </View>
      ) : payments!.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No receipts yet"
          message="Payment receipts recorded by the school will show up here automatically."
        />
      ) : (
        <FlatList
          data={payments!}
          keyExtractor={(p) => p.id}
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
          renderItem={({ item }) => <ReceiptCard payment={item} school={school} />}
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
