import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { ConfirmModal } from "@/components/ConfirmModal";
import { ErrorState } from "@/components/ErrorState";
import { appLog } from "@/lib/app-log";
import {
  finishApplePurchase,
  isAppleIapPlatform,
  openAppleSubscriptionManagement,
  purchaseAppleSubscription,
  resolvePurchaseJws,
  restoreApplePurchases,
} from "../services/apple-iap";
import {
  cancelSubscription,
  changeSubscriptionPlan,
  createSubscriptionCheckout,
  fetchSubscriptionMe,
  verifyApplePurchase,
} from "../services/subscription.service";
import type {
  SubscriptionMe,
  SubscriptionPlan,
  SubscriptionPlanCode,
} from "../types/subscription.types";

type ConfirmDialog =
  | { type: "change"; plan: SubscriptionPlan }
  | { type: "cancel" }
  | null;

const SUCCESS_URL = "appconfraria://subscription/success";

function getErrorMessage(err: unknown, fallback: string) {
  const message = (
    err as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;

  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function formatAmount(plan: SubscriptionPlan) {
  return plan.amount.toLocaleString("pt-BR", {
    currency: plan.currency.toUpperCase() === "BRL" ? "BRL" : plan.currency,
    style: "currency",
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function planPeriodLabel(code: SubscriptionPlanCode) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return code === "annual" ? "por ano" : "por mês";
}

type MySubscriptionViewProps = {
  onBack: () => void;
};

export function MySubscriptionView({ onBack }: MySubscriptionViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [subscription, setSubscription] = useState<SubscriptionMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlanCode | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const inFlightRef = useRef(false);
  const hasAttemptedRef = useRef(false);
  const subscriptionRef = useRef<SubscriptionMe | null>(null);
  subscriptionRef.current = subscription;

  const load = useCallback(async () => {
    if (inFlightRef.current) return subscriptionRef.current;
    inFlightRef.current = true;

    const hasData = subscriptionRef.current != null;
    if (hasAttemptedRef.current && !hasData) {
      setIsRetrying(true);
    } else if (!hasData) {
      setIsLoading(true);
    }

    try {
      const data = await fetchSubscriptionMe();
      setSubscription(data);
      setHasError(false);
      return data;
    } catch {
      if (hasData) {
        Toast.show({
          type: "error",
          text1: "Não foi possível atualizar a assinatura",
          text2: "Mantivemos os dados anteriores.",
        });
      } else {
        setHasError(true);
      }
      return subscriptionRef.current;
    } finally {
      hasAttemptedRef.current = true;
      inFlightRef.current = false;
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const alternatePlan = useMemo(() => {
    if (!subscription?.currentPlan) return null;
    return (
      subscription.plans.find((plan) => plan.code !== subscription.currentPlan) ??
      null
    );
  }, [subscription]);

  const resolveAppleProductId = useCallback(
    (plan: SubscriptionPlanCode) => {
      const ids = subscription?.appleProductIds;
      if (!ids) {
        throw new Error(
          "Product IDs Apple ainda não configurados. Atualize AppleIapConfig no backend.",
        );
      }
      return plan === "annual" ? ids.annual : ids.monthly;
    },
    [subscription?.appleProductIds],
  );

  const subscribeWithApple = useCallback(
    async (plan: SubscriptionPlanCode) => {
      const productId = resolveAppleProductId(plan);
      const purchase = await purchaseAppleSubscription(productId);
      const signedTransactionInfo = await resolvePurchaseJws(purchase);
      const latest = await verifyApplePurchase({
        plan,
        signedTransactionInfo,
      });
      await finishApplePurchase(purchase);
      setSubscription(latest);
      appLog.info("apple.iap.verify.client_ok", {
        plan,
        productId,
      });
      Toast.show({
        type: "success",
        text1: latest.isVip ? "VIP ativado" : "Compra enviada",
        text2: latest.isVip
          ? "Sua assinatura Apple já está ativa."
          : "Aguarde a confirmação da Apple.",
      });
    },
    [resolveAppleProductId],
  );

  const subscribe = async (plan: SubscriptionPlanCode) => {
    if (busyPlan) return;

    setBusyPlan(plan);
    try {
      if (isAppleIapPlatform()) {
        await subscribeWithApple(plan);
        return;
      }

      const { checkoutUrl } = await createSubscriptionCheckout(plan);
      const result = await WebBrowser.openAuthSessionAsync(
        checkoutUrl,
        SUCCESS_URL,
      );

      if (result.type === "success") {
        const latest = await load();
        Toast.show({
          type: "success",
          text1: latest?.isVip ? "Pagamento confirmado" : "Checkout finalizado",
          text2: latest?.isVip
            ? "Seu VIP já está ativo."
            : "Se o pagamento foi aprovado, o VIP aparece em breve.",
        });
        return;
      }

      if (result.type === "dismiss") {
        await load();
        Toast.show({
          type: "info",
          text1: "Checkout fechado",
          text2: "Se você concluiu o pagamento, o VIP pode levar alguns segundos para ativar.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Não foi possível assinar",
        text2: getErrorMessage(error, "Tente novamente mais tarde."),
      });
    } finally {
      setBusyPlan(null);
    }
  };

  const handleRestoreApple = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const purchases = await restoreApplePurchases();
      if (purchases.length === 0) {
        Toast.show({
          type: "info",
          text1: "Nenhuma compra encontrada",
          text2: "Não há assinaturas Apple para restaurar nesta conta.",
        });
        return;
      }

      let latest: SubscriptionMe | null = null;
      for (const purchase of purchases) {
        const signedTransactionInfo = await resolvePurchaseJws(purchase);
        latest = await verifyApplePurchase({ signedTransactionInfo });
        await finishApplePurchase(purchase);
      }

      if (latest) {
        setSubscription(latest);
      } else {
        await load();
      }

      Toast.show({
        type: "success",
        text1: "Compras restauradas",
        text2: latest?.isVip
          ? "Seu VIP Apple foi reativado."
          : "Restauração concluída.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Falha ao restaurar",
        text2: getErrorMessage(error, "Tente novamente mais tarde."),
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleChangePlan = async (plan: SubscriptionPlanCode) => {
    if (isChangingPlan) return;

    if (
      isAppleIapPlatform() &&
      (subscription?.billingProvider === "apple" || !subscription?.billingProvider)
    ) {
      setConfirmDialog(null);
      try {
        await openAppleSubscriptionManagement();
      } catch {
        await Linking.openURL("https://apps.apple.com/account/subscriptions");
      }
      return;
    }

    setIsChangingPlan(true);
    try {
      const data = await changeSubscriptionPlan(plan);
      setSubscription(data);
      setConfirmDialog(null);
      Toast.show({
        type: "success",
        text1: "Plano atualizado",
        text2: `Agora você está no plano ${plan === "annual" ? "Anual" : "Mensal"}.`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao trocar plano",
        text2: getErrorMessage(error, "Tente novamente mais tarde."),
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleCancel = async () => {
    if (isCanceling) return;

    if (isAppleIapPlatform() && subscription?.billingProvider === "apple") {
      setConfirmDialog(null);
      try {
        await openAppleSubscriptionManagement();
      } catch {
        await Linking.openURL("https://apps.apple.com/account/subscriptions");
      }
      return;
    }

    setIsCanceling(true);
    try {
      const data = await cancelSubscription();
      setSubscription(data);
      setConfirmDialog(null);
      Toast.show({
        type: "success",
        text1: "Renovação cancelada",
        text2: "Seu VIP segue ativo até o fim do período.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao cancelar",
        text2: getErrorMessage(error, "Tente novamente mais tarde."),
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const changePlanDialog =
    confirmDialog?.type === "change" ? confirmDialog.plan : null;
  const changePlanLabel = changePlanDialog
    ? changePlanDialog.code === "annual"
      ? "Anual"
      : "Mensal"
    : "";
  const isConfirmLoading = isChangingPlan || isCanceling;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Voltar"
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Minha assinatura</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : hasError ? (
        <ErrorState
          description="Verifique a conexão e tente novamente."
          retrying={isRetrying}
          style={styles.errorState}
          title="Não foi possível carregar sua assinatura"
          onRetry={() => void load()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {subscription?.isVip ? (
            <>
              <View style={styles.statusCard}>
                <View style={styles.statusGlow} />
                <View style={styles.vipBadge}>
                  <MaterialCommunityIcons
                    color={colors.brandDark}
                    name="motorbike"
                    size={18}
                  />
                  <Text style={styles.vipBadgeText}>VIP ativo</Text>
                </View>
                <Text style={styles.vipPlan}>
                  Plano{" "}
                  {subscription.currentPlan === "annual" ? "Anual" : "Mensal"}
                </Text>
                <Text style={styles.vipMeta}>
                  {subscription.cancelAtPeriodEnd
                    ? `Ativo até ${formatDate(subscription.vipUntil)} · sem renovação`
                    : `Próxima renovação em ${formatDate(subscription.vipUntil)}`}
                </Text>
                <Text style={styles.vipBenefit}>
                  Seu perfil fica com o selo de moto verificado.
                </Text>
              </View>

              {alternatePlan && subscription.billingProvider !== "apple" ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Trocar plano</Text>
                  <Text style={styles.sectionHint}>
                    O cartão salvo será cobrado agora pela diferença proporcional.
                  </Text>
                  <View
                    style={[
                      styles.planCard,
                      alternatePlan.code === "annual" && styles.planCardFeatured,
                    ]}
                  >
                    {alternatePlan.code === "annual" ? (
                      <View style={styles.bestValueChip}>
                        <Text style={styles.bestValueChipText}>Melhor valor</Text>
                      </View>
                    ) : null}
                    <Text style={styles.planLabel}>{alternatePlan.label}</Text>
                    <Text style={styles.planAmount}>
                      {formatAmount(alternatePlan)}
                    </Text>
                    <Text style={styles.planPeriod}>
                      {planPeriodLabel(alternatePlan.code)}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isChangingPlan || isCanceling}
                      style={styles.primaryButton}
                      onPress={() =>
                        setConfirmDialog({ type: "change", plan: alternatePlan })
                      }
                    >
                      {isChangingPlan ? (
                        <ActivityIndicator color={colors.brandDark} />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          Mudar para {alternatePlan.label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {!subscription.cancelAtPeriodEnd ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isCanceling || isChangingPlan}
                  style={styles.cancelButton}
                  onPress={() => setConfirmDialog({ type: "cancel" })}
                >
                  {isCanceling ? (
                    <ActivityIndicator color={colors.brandDark} />
                  ) : (
                    <Text style={styles.cancelButtonText}>
                      {isAppleIapPlatform() ||
                      subscription.billingProvider === "apple"
                        ? "Gerenciar na App Store"
                        : "Cancelar no fim do período"}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.noticeBox}>
                  <Ionicons
                    color={colors.brandPrimary}
                    name="information-circle-outline"
                    size={18}
                  />
                  <Text style={styles.noticeText}>
                    A renovação já está cancelada. Você segue VIP até{" "}
                    {formatDate(subscription.vipUntil)}. Trocar de plano reativa
                    a renovação.
                  </Text>
                </View>
              )}

              {isAppleIapPlatform() || subscription.billingProvider === "apple" ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isRestoring}
                  style={styles.secondaryButton}
                  onPress={() => void handleRestoreApple()}
                >
                  {isRestoring ? (
                    <ActivityIndicator color={colors.brandDark} />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      Restaurar compras Apple
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.hero}>
                <View style={styles.heroIconWrap}>
                  <MaterialCommunityIcons
                    color={colors.brandDark}
                    name="motorbike"
                    size={28}
                  />
                </View>
                <Text style={styles.heroTitle}>Confraria VIP</Text>
                <Text style={styles.heroSubtitle}>
                  Assine e destaque seu perfil com o selo verificado de moto.
                </Text>
              </View>

              {(subscription?.plans ?? []).map((plan) => {
                const isAnnual = plan.code === "annual";
                return (
                  <View
                    key={plan.code}
                    style={[styles.planCard, isAnnual && styles.planCardFeatured]}
                  >
                    {isAnnual ? (
                      <View style={styles.bestValueChip}>
                        <Text style={styles.bestValueChipText}>Melhor valor</Text>
                      </View>
                    ) : null}
                    <Text style={styles.planLabel}>{plan.label}</Text>
                    <Text style={styles.planAmount}>{formatAmount(plan)}</Text>
                    <Text style={styles.planPeriod}>
                      {planPeriodLabel(plan.code)}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={busyPlan !== null}
                      style={styles.primaryButton}
                      onPress={() => void subscribe(plan.code)}
                    >
                      {busyPlan === plan.code ? (
                        <ActivityIndicator color={colors.brandDark} />
                      ) : (
                        <Text style={styles.primaryButtonText}>Assinar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}

              {isAppleIapPlatform() ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isRestoring}
                  style={styles.secondaryButton}
                  onPress={() => void handleRestoreApple()}
                >
                  {isRestoring ? (
                    <ActivityIndicator color={colors.brandDark} />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      Restaurar compras
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>
      )}

      <ConfirmModal
        cancelLabel={changePlanDialog ? "Cancelar" : "Manter"}
        confirmLabel={
          changePlanDialog
            ? `Confirmar ${changePlanLabel}`
            : isAppleIapPlatform()
              ? "Abrir App Store"
              : "Cancelar no fim do período"
        }
        description={
          changePlanDialog
            ? isAppleIapPlatform()
              ? `No iOS, a troca de plano é feita na App Store. Vamos abrir a gestão de assinaturas.`
              : `A troca é imediata. Calculamos a diferença proporcional do plano ${changePlanLabel} (${formatAmount(changePlanDialog)} ${planPeriodLabel(changePlanDialog.code)}) e cobramos no cartão salvo agora. Se o pagamento falhar, o plano não muda.`
            : isAppleIapPlatform()
              ? "No iOS, o cancelamento é feito na App Store. Vamos abrir a gestão de assinaturas."
              : "Você continua VIP até o fim do período já pago. A renovação automática será encerrada."
        }
        headerTitle={
          changePlanDialog ? `Mudar para ${changePlanLabel}` : "Cancelar assinatura"
        }
        isLoading={isConfirmLoading}
        title={
          changePlanDialog
            ? `Trocar para o plano ${changePlanLabel}?`
            : "Cancelar a renovação do VIP?"
        }
        variant={changePlanDialog ? "default" : "destructive"}
        visible={confirmDialog !== null}
        onClose={() => {
          if (!isConfirmLoading) setConfirmDialog(null);
        }}
        onConfirm={() => {
          if (changePlanDialog) {
            return handleChangePlan(changePlanDialog.code);
          }
          return handleCancel();
        }}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  screen: {
    backgroundColor: colors.surface.primary,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "700",
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 0,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 20,
    gap: 8,
    marginBottom: 4,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroIconWrap: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    marginBottom: 4,
    width: 56,
  },
  heroTitle: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#5B6570",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: colors.brandGray,
    borderRadius: 20,
    gap: 8,
    overflow: "hidden",
    padding: 20,
  },
  statusGlow: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 120,
    opacity: 0.35,
    position: "absolute",
    right: -40,
    top: -40,
    width: 120,
  },
  vipBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vipBadgeText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  vipPlan: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  vipMeta: {
    color: "#5B6570",
    fontSize: 14,
    lineHeight: 20,
  },
  vipBenefit: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 17,
    fontWeight: "700",
  },
  sectionHint: {
    color: "#5B6570",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  planCard: {
    backgroundColor: colors.brandGray,
    borderColor: "transparent",
    borderRadius: 20,
    borderWidth: 2,
    gap: 4,
    padding: 20,
  },
  planCardFeatured: {
    backgroundColor: "#F3F8E8",
    borderColor: colors.brandGreen,
  },
  bestValueChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bestValueChipText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  planLabel: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "700",
  },
  planAmount: {
    color: colors.brandPrimary,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  planPeriod: {
    color: "#5B6570",
    fontSize: 13,
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent.brand,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.text.onBrand,
    fontSize: 15,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    borderColor: colors.border.default,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 48,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 14,
    minHeight: 48,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
  },
  noticeBox: {
    alignItems: "flex-start",
    backgroundColor: colors.brandGray,
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  noticeText: {
    color: "#5B6570",
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
