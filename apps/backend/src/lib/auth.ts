import { verifyMessage } from "viem";

export class AuthError extends Error {
  status = 403;
}

export async function requireAuth(
  playerId: string,
  message: string,
  signature: string,
): Promise<void> {
  const recovered = await verifyMessage({
    address: playerId as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!recovered) {
    throw new AuthError("Invalid signature");
  }
}
