export type SubscriptionPlanCode = "monthly" | "annual";

export type SubscriptionPlan = {
  amount: number;
  code: SubscriptionPlanCode;
  currency: string;
  label: string;
};

export type SubscriptionMe = {
  appleProductIds: {
    annual: string;
    monthly: string;
  } | null;
  billingProvider: "stripe" | "apple" | null;
  cancelAtPeriodEnd: boolean;
  currentPlan: SubscriptionPlanCode | null;
  isVip: boolean;
  plans: SubscriptionPlan[];
  status: string | null;
  vipUntil: string | null;
};

export type CheckoutResponse = {
  checkoutUrl: string;
};

export type VerifyApplePurchaseRequest = {
  plan?: SubscriptionPlanCode;
  signedTransactionInfo: string;
};
