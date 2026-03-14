interface GooglePayClient {
  isReadyToPay(request: Record<string, unknown> | object): Promise<{ result: boolean }>;
  createButton(options: object): HTMLElement;
  loadPaymentData(request: Record<string, unknown> | object): Promise<{
    paymentMethodData: {
      tokenizationData: { token: string };
    };
  }>;
}

interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: { label: string; amount: string };
}

interface ApplePaySessionInstance {
  onvalidatemerchant: (event: { validationURL: string }) => void;
  onpaymentauthorized: (event: { payment: { token: unknown } }) => void;
  oncancel: () => void;
  begin(): void;
  abort(): void;
  completeMerchantValidation(session: unknown): void;
  completePayment(status: number): void;
}

declare global {
  interface Window {
    google?: {
      payments: {
        api: {
          PaymentsClient: new (config: { environment: string }) => GooglePayClient;
        };
      };
    };
    ApplePaySession?: {
      canMakePayments(): boolean;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
      new (version: number, request: ApplePayPaymentRequest): ApplePaySessionInstance;
    };
  }
}

export {};
