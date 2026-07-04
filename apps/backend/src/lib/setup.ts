import { chain } from "./blockchain";

export function setup(): void {
  chain.initWallet();
  console.log("[Setup] 13 Towers of Hell backend initialized");
}
