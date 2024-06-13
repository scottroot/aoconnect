import { connect as connectCJS, serializeCron } from "./index.common";
import { WalletClient as WalletClientNode } from "./client/node/index";
import { WalletClient as WalletClientBrowser } from "./client/browser/index";


const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
const connect = connectCJS;
const WalletClient = isBrowser ? WalletClientBrowser : WalletClientNode;

const GATEWAY_URL = (isBrowser ? globalThis.GATEWAY_URL : process.env.GATEWAY_URL) ?? undefined;
const MU_URL = (isBrowser ? globalThis.MU_URL : process.env.MU_URL) ?? undefined;
const CU_URL = (isBrowser ? globalThis.CU_URL : process.env.CU_URL) ?? undefined;
const GRAPHQL_URL = (isBrowser ? globalThis.GRAPHQL_URL : process.env.GRAPHQL_URL) ?? undefined;


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
 * A function that builds a signer using the wallet interface
 * It uses a different WalletClient implementation based on the environment
 */
export const createDataItemSigner = WalletClient.createDataItemSigner;
export const version = "VERSION YES";