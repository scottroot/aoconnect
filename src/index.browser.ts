import { connect, serializeCron } from "./index.common";
import { WalletClient } from "./client/browser";


const GATEWAY_URL: string | undefined = globalThis.GATEWAY_URL || undefined;
const MU_URL: string | undefined = globalThis.MU_URL || undefined;
const CU_URL: string | undefined = globalThis.CU_URL || undefined;
const GRAPHQL_URL: string | undefined = globalThis.GRAPHQL_URL || undefined;

const {
  result,
  results,
  message,
  spawn,
  monitor,
  unmonitor,
  dryrun,
  assign
} = connect({ GATEWAY_URL, MU_URL, CU_URL, GRAPHQL_URL });

export { result, results, message, spawn, monitor, unmonitor, dryrun, assign };
export { connect };
export { serializeCron };
/**
 * A function that builds a signer using the global arweaveWallet
 * commonly used in browser-based dApps
 *
 * This is provided as a convenience for consumers of the SDK
 * to use, but consumers can also implement their own signer
 */
export const createDataItemSigner = WalletClient.createDataItemSigner;
