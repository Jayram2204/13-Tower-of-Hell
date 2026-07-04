export class AppError extends Error {
  constructor(
    message: string,
    public status = 500,
    public code = "INTERNAL_ERROR",
  ) {
    super(message);
  }
}

export function handleError(err: unknown): { status: number; body: object } {
  if (err instanceof AppError) {
    return { status: err.status, body: { error: err.message, code: err.code } };
  }
  console.error("[Unhandled Error]", err);
  return { status: 500, body: { error: "Internal error", code: "INTERNAL_ERROR" } };
}
