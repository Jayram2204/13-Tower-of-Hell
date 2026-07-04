export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { setup } = await import("./lib/setup");
    setup();
  }
}
