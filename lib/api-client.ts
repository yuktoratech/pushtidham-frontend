export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "donor" | "admin";
  status: "active" | "disabled";
};
export type AuthResult = { accessToken: string; user: AuthUser };
export type ApiIssue = { path: string; message: string };
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: ApiIssue[] = [],
  ) {
    super(message);
  }
}
const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
let accessToken: string | null = null;
let revision = 0;
let refreshPromise: Promise<AuthResult> | null = null;
let onInvalidSession: () => void = () => {};
export function setSessionListener(listener: () => void) {
  onInvalidSession = listener;
}
export function clearAccessToken() {
  revision++;
  accessToken = null;
}
export function beginAuthChange() {
  clearAccessToken();
  return revision;
}
export function getSessionRevision() {
  return revision;
}
export function acceptAccessToken(token: string, version: number) {
  if (version !== revision) return false;
  accessToken = token;
  return true;
}
async function send<T>(
  path: string,
  options: RequestInit = {},
  token = accessToken,
): Promise<T> {
  if (!baseUrl)
    throw new ApiError(
      0,
      "API_CONFIGURATION",
      "Account services are not configured. Please contact the temple.",
    );
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Account services are unavailable. Please try again.",
    );
  }
  let payload: {
    success?: boolean;
    data?: T;
    error?: { code?: string; message?: string; details?: ApiIssue[] };
  };
  if (response.status === 204) {
    if (!response.ok)
      throw new ApiError(response.status, "API_ERROR", "The request could not be completed.");
    return undefined as T;
  }
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "Account services returned an unexpected response. Please try again.",
    );
  }
  if (!response.ok || payload.success !== true)
    throw new ApiError(
      response.status,
      payload.error?.code ?? "API_ERROR",
      payload.error?.message ?? "The request could not be completed.",
      payload.error?.details,
    );
  return payload.data as T;
}
export function refreshSession(): Promise<AuthResult> {
  if (refreshPromise) return refreshPromise;
  const version = revision;
  const refresh = async () => {
    const result = await send<AuthResult>(
      "/auth/refresh",
      { method: "POST", body: "{}" },
      null,
    );
    if (!acceptAccessToken(result.accessToken, version))
      throw new ApiError(
        401,
        "SESSION_CHANGED",
        "Your session changed. Please try again.",
      );
    return result;
  };
  // Serialize refresh across tabs as well as concurrent requests in this document.
  const pending = (async () => {
    if (typeof navigator !== "undefined" && navigator.locks)
      return await navigator.locks.request("pushtidham-auth-refresh", refresh);
    return await refresh();
  })();
  const shared = pending.finally(() => {
    refreshPromise = null;
  });
  refreshPromise = shared;
  return shared;
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const usedToken = accessToken;
  const usedRevision = revision;
  try {
    return await send<T>(path, options, usedToken);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      (path.startsWith("/auth/") && path !== "/auth/me")
    )
      throw error;
    if (usedRevision !== revision)
      throw new ApiError(
        401,
        "SESSION_CHANGED",
        "Your session changed. Please try again.",
      );
    try {
      if (accessToken === usedToken) await refreshSession();
      return await send<T>(path, options);
    } catch (retryError) {
      if (
        retryError instanceof ApiError &&
        retryError.status === 401 &&
        usedRevision === revision
      ) {
        clearAccessToken();
        onInvalidSession();
      }
      throw retryError;
    }
  }
}
export const authApi = {
  login: (email: string, password: string) =>
    send<AuthResult>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      null,
    ),
  register: (name: string, email: string, password: string) =>
    send<AuthResult>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ name, email, password }) },
      null,
    ),
  logout: () =>
    send<null>("/auth/logout", { method: "POST", body: "{}" }, null),
  me: () => apiRequest<AuthUser>("/auth/me"),
};
export type PaymentMethodFamily = "card" | "ach";
export type PaymentAttemptStatus = "created" | "requires_action" | "verification_pending" | "processing" | "succeeded" | "failed" | "canceled";
export type PaymentStart = { attemptId:string; status:PaymentAttemptStatus; baseDonationCents:number; feeContributionCents:number; totalChargeCents:number; currency:"USD"; statusToken?:string; checkoutUrl?:string; orderId?:string; approvalUrl?:string };
export type PaymentStatus = { id:string; status:PaymentAttemptStatus; baseDonationCents:number; feeContributionCents:number; totalChargeCents:number; currency:"USD" };
export type PaymentCapabilities = {stripe:{card:boolean;ach:boolean};paypal:{enabled:boolean;clientId?:string;environment:"sandbox"|"live";venmo:boolean}};
export const paymentApi={
 capabilities:()=>apiRequest<PaymentCapabilities>("/payments/capabilities"),
 stripe:(body:object,key:string)=>apiRequest<PaymentStart>("/payments/stripe/checkout-sessions",{method:"POST",headers:{"Idempotency-Key":key},body:JSON.stringify(body)}),
 paypalOrder:(body:object,key:string)=>apiRequest<PaymentStart>("/payments/paypal/orders",{method:"POST",headers:{"Idempotency-Key":key},body:JSON.stringify(body)}),
 paypalCapture:(orderId:string,token?:string)=>apiRequest<{attemptId:string;status:string}>(`/payments/paypal/orders/${encodeURIComponent(orderId)}/capture`,{method:"POST",headers:token?{"X-Payment-Status-Token":token}:undefined,body:"{}"}),
 status:(attemptId:string,token?:string)=>apiRequest<PaymentStatus>(`/payments/attempts/${encodeURIComponent(attemptId)}/status`,{headers:token?{"X-Payment-Status-Token":token}:undefined}),
};
export type DonationDisplayStatus="created"|"requires_action"|"verification_required"|"processing"|"succeeded"|"failed"|"canceled"|"pending"|"completed"|"refunded"|"partially_refunded"|"returned"|"disputed";
export type DonationRecord={id:string;donationNumber:string;type:"general"|"event";designationTitle:string;baseDonationCents:number;feeContributionCents:number|null;grossChargedCents:number|null;actualProviderFeeCents:number|null;adjustmentLossCents:number;netProceedsCents:number|null;currency:"USD";paymentProvider:"stripe"|"paypal"|null;paymentMethod:string;paymentLifecycle:PaymentAttemptStatus|null;displayStatus:DonationDisplayStatus;donationStatus:"pending"|"completed"|"rejected";recordKind:"verified_online"|"legacy_paypal"|"legacy_bank_transfer"|"legacy_online"|"offline";providerVerified:boolean;createdAt:string;completedAt?:string;donor?:{name:string;email:string;phone:string|null};references?:{external:string|null;bank:string|null;offline:string|null;payment:string|null};adjustments?:Array<{type:string;status:string;amountCents:number;occurredAt:string;reasonCode:string|null;providerReference:string}>};
export type FinancialReport={timezone:"UTC";range:{from:string|null;to:string|null};summary:{records:number;confirmedRecords:number;confirmedBaseCents:number;feeContributionCents:number;grossConfirmedCents:number;knownProviderFeesCents:number;unknownProviderFeeRecords:number;adjustmentLossCents:number;netProceedsKnownCents:number;netUnknownRecords:number;pendingBaseCents:number;failedCanceledBaseCents:number};providers:Array<{provider:string;records:number;baseDonationCents:number;grossChargedCents:number;adjustmentLossCents:number}>;designations:Array<{designation:string;records:number;baseDonationCents:number;grossChargedCents:number}>};
export const donationApi={
 list:(query="")=>apiRequest<DonationRecord[]>(`/donations${query?`?${query}`:""}`),
 adminList:(query="")=>apiRequest<DonationRecord[]>(`/admin/donations${query?`?${query}`:""}`),
 adminGet:(id:string)=>apiRequest<DonationRecord>(`/admin/donations/${encodeURIComponent(id)}`),
 createOffline:(body:object)=>apiRequest<DonationRecord>("/admin/donations/offline",{method:"POST",body:JSON.stringify(body)}),
 setOfflineStatus:(id:string,status:"completed"|"rejected",adminNote?:string)=>apiRequest<DonationRecord>(`/admin/donations/${encodeURIComponent(id)}/status`,{method:"PATCH",body:JSON.stringify({status,...(adminNote?{adminNote}:{})})}),
 report:(query="")=>apiRequest<FinancialReport>(`/admin/reports/financial${query?`?${query}`:""}`),
};
export function authErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CREDENTIALS")
      return "Incorrect email or password, or this account is disabled. Please try again or contact the temple.";
    if (error.status === 409)
      return "An account with this email address already exists. Please log in.";
    if (error.status === 429)
      return "Too many attempts. Please wait before trying again.";
    return error.message;
  }
  return "Unable to complete the request. Please try again.";
}
