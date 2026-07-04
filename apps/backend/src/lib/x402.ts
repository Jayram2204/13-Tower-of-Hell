import { http } from "viem";

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || "https://x402-facilitator.molandak.org";
const USDC_TESTNET = (process.env.X402_USDC_TESTNET ||
  "0x534b2f3A21130d7a60830c2Df862319e593943A3") as `0x${string}`;

interface PaymentRequest {
  amount: string;
  network: string;
  asset: `0x${string}`;
  payTo: string;
}

interface VerificationResult {
  isValid: boolean;
  payload?: any;
}

interface SettlementResult {
  success: boolean;
  txHash?: string;
  errorReason?: string;
}

export const x402 = {
  async getSupportedSchemes(): Promise<any> {
    try {
      const res = await fetch(`${FACILITATOR_URL}/supported`);
      if (!res.ok) throw new Error(`Facilitator /supported returned ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("[x402] Failed to get supported schemes:", err);
      return null;
    }
  },

  async verify(
    signature: string,
    authorization: any,
    resourceUrl: string,
  ): Promise<VerificationResult> {
    try {
      const body = {
        x402Version: 2,
        payload: { authorization, signature },
        resource: {
          url: resourceUrl,
          description: "13 Towers of Hell - Bounty Claim",
          mimeType: "application/json",
        },
        accepted: {
          scheme: "exact",
          network: `eip155:${process.env.MONAD_CHAIN_ID || "10143"}`,
          amount: authorization.value,
          asset: USDC_TESTNET,
          payTo: authorization.to,
          maxTimeoutSeconds: 300,
          extra: { name: "USDC", version: "2" },
        },
      };

      const res = await fetch(`${FACILITATOR_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return { isValid: false, payload: errBody };
      }

      return await res.json();
    } catch (err) {
      console.error("[x402] Verification failed:", err);
      return { isValid: false };
    }
  },

  async settle(authorization: any, signature: string): Promise<SettlementResult> {
    try {
      const body = {
        x402Version: 2,
        payload: { authorization, signature },
        accepted: {
          scheme: "exact",
          network: `eip155:${process.env.MONAD_CHAIN_ID || "10143"}`,
          amount: authorization.value,
          asset: USDC_TESTNET,
          payTo: authorization.to,
          maxTimeoutSeconds: 300,
          extra: { name: "USDC", version: "2" },
        },
      };

      const res = await fetch(`${FACILITATOR_URL}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      return await res.json();
    } catch (err) {
      console.error("[x402] Settlement failed:", err);
      return { success: false, errorReason: "Settlement request failed" };
    }
  },

  createPaymentRequirement(amountUsdc: string, payTo: string, description: string): PaymentRequest {
    return {
      amount: amountUsdc,
      network: `eip155:${process.env.MONAD_CHAIN_ID || "10143"}`,
      asset: USDC_TESTNET,
      payTo:
        payTo || process.env.SERVER_SIGNER_ADDRESS || "0x0000000000000000000000000000000000000000",
    };
  },
};

export { FACILITATOR_URL, USDC_TESTNET };
