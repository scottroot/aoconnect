// import "./hack.js";
// import { connect as schedulerUtilsConnect } from "@permaweb/ao-scheduler-utils";

import * as MuClient from "./client/ao-mu";
import * as CuClient from "./client/ao-cu";
import * as SuClient from "./client/ao-su";
import * as GatewayClient from "./client/gateway";
import { createLogger } from "./logger";

import type { ResultFunc } from "./lib/result";
import { getResult } from "./lib/result";
import type { MessageFunc } from "./lib/message";
import { getMessage } from "./lib/message";
import type { SpawnFunc } from "./lib/spawn";
import { getSpawn } from "./lib/spawn";
import type { MonitorFunc } from "./lib/monitor";
import { getMonitor } from "./lib/monitor";
import type { UnmonitorFunc } from "./lib/unmonitor";
import { getUnmonitor } from "./lib/unmonitor";
import type { DryrunFunc } from "./lib/dryrun";
import { getDryrun } from "./lib/dryrun";
import type { AssignFunc } from "./lib/assign";
import { getAssign } from "./lib/assign";
import { joinUrl } from "./lib/utils";
import type { ResultsFunc } from "./lib/results";
import { getResults } from "./lib/results";
import { connect as schedulerUtilsConnect } from "@permaweb/ao-scheduler-utils";


const DEFAULT_GATEWAY_URL = "https://arweave.net";
const DEFAULT_MU_URL = "https://mu.ao-testnet.xyz";
const DEFAULT_CU_URL = "https://cu.ao-testnet.xyz";

export { serializeCron } from "./lib/serializeCron";

/**
 * Establishes connection with mutliple different services and sets up various components related to process management.
 *
 * @param {Object} config - A configuration object including:
 *   - {string} GRAPHQL_URL - The URL of the GraphQL service; if not provided, it will use the `GATEWAY_URL` and append `/graphql`.
 *   - {string} GATEWAY_URL - The URL of the gateway service; if not provided, uses a pre-defined `DEFAULT_GATEWAY_URL`.
 *   - {string} MU_URL - The url of the Main Unit (MU) service; if not provided, uses a pre-defined `DEFAULT_MU_URL`.
 *   - {string} CU_URL - The url of the Control Unit (CU) service; if not provided, uses a pre-defined `DEFAULT_CU_URL`.
 *
 * @throws {Error} If neither `GRAPHQL_URL` nor `GATEWAY_URL` are provided.
 *
 * @returns {Object} Returns an object having following properties:
 // *   - {Function} result - An equipped function for fetching individual process' result.
 // *   - {Function} results - An equipped function for fetching batch of process results given a specified range.
 // *   - {Function} message - An out-of-box writeInteraction function which writes signed data item for message to the MU.
 // *   - {Function} spawn - An out-of box function for spawning the process via MU which takes care of validating inputs as well.
 // *   - {Function} monitor - An out-of-box function for posting a signed message via the MU /monitor/:process endpoint.
 // *   - {Function} unmonitor - An out-of-box function for posting a signed message (unmonitor request) via the MU /monitor/:process endpoint.
 // *   - {Function} dryrun - A function for sending a message object to the CU and returning a result.
 // *   - {Function} assign - A function for posting an Assignment to the MU.
 */
export function connect({
  GRAPHQL_URL = "", GATEWAY_URL = DEFAULT_GATEWAY_URL, MU_URL = DEFAULT_MU_URL, CU_URL = DEFAULT_CU_URL
} = {}): {
  result: ResultFunc;
  results: ResultsFunc;
  message: MessageFunc;
  spawn: SpawnFunc;
  monitor: MonitorFunc;
  unmonitor: UnmonitorFunc;
  dryrun: DryrunFunc;
  assign: AssignFunc;
} {
  const logger = createLogger();
  if (!GRAPHQL_URL) {
    GRAPHQL_URL = joinUrl({ url: GATEWAY_URL, path: "/graphql" });
  }
  // const schedulerUtilsConnect = await import("@permaweb/ao-scheduler-utils").then(m => m.connect);
  const { validate } = schedulerUtilsConnect({ cacheSize: 100, GRAPHQL_URL });
  // const { validate } = import("@permaweb/ao-scheduler-utils").then(m => m.connect({ cacheSize: 100, GRAPHQL_URL }));

  const processMetaCache = SuClient.createProcessMetaCache({ MAX_SIZE: 25 });

  const resultLogger = logger.child("result");
  const result = getResult({
    loadResult: new CuClient.LoadResult({ fetch, CU_URL, logger: resultLogger }).execute,
    logger: resultLogger,
  });

  /**
   * default writeInteraction that works OOTB
   * - writes signed data item for message to the MU
   */
  const messageLogger = logger.child("message");
  const message = getMessage({
    loadProcessMeta: new SuClient.LoadProcessMeta({ fetch, cache: processMetaCache, logger: messageLogger }).execute,
    // locateScheduler: locate,
    deployMessage: new MuClient.DeployMessage({ fetch, MU_URL, logger: messageLogger }).execute,
    logger: messageLogger,
  });

  /**
   * default spawn that works OOTB
   * - Verifies the inputs
   * - spawns the process via the MU
   */
  const spawnLogger = logger.child("spawn");
  const spawn = getSpawn({
    loadTransactionMeta: new GatewayClient.LoadTransactionMeta({ fetch, GRAPHQL_URL, logger: spawnLogger }).execute,
    validateScheduler: validate,
    deployProcess: new MuClient.DeployProcess({ fetch, MU_URL, logger: spawnLogger }).execute,
    logger: spawnLogger,
  });

  /**
   * default monitor that works OOTB
   * - Verifies the inputs
   * - post a signed message via the MU /monitor/:process endpoint
   */
  const monitorLogger = logger.child("monitor");
  const monitor = getMonitor({
    loadProcessMeta: new SuClient.LoadProcessMeta({
      fetch,
      cache: processMetaCache,
      logger: monitorLogger,
    }).execute,
    // locateScheduler: locate,
    deployMonitor: new MuClient.DeployMonitor({ fetch, MU_URL, logger: monitorLogger }).execute,
    logger: monitorLogger,
  });

  /**
   * default unmonitor that works OOTB
   * - Verifies the inputs
   * - post a signed message via the MU /monitor/:process endpoint
   */
  const unmonitorLogger = logger.child("unmonitor");
  const unmonitor = getUnmonitor({
    loadProcessMeta: new SuClient.LoadProcessMeta({
      fetch,
      cache: processMetaCache,
      logger: unmonitorLogger,
    }).execute,
    // locateScheduler: locate,
    deployUnmonitor: new MuClient.DeployUnmonitor({ fetch, MU_URL, logger: unmonitorLogger }).execute,
    logger: monitorLogger,
  });

  /**
   * results - returns batch of Process Results given a specified range
   */
  const resultsLogger = logger.child("results");
  const results = getResults({
    queryResults: new CuClient.QueryResults({ fetch, CU_URL, logger: resultsLogger }).execute,
    logger: resultsLogger,
  });

  /**
   * dryrun - sends a message object to the cu and returns a result
   */
  const dryrunLogger = logger.child("dryrun");
  const dryrun = getDryrun({
    dryrunFetch: new CuClient.DryrunFetch({ fetch, CU_URL, logger: dryrunLogger }).execute,
    logger: dryrunLogger,
  });

  /**
   * POSTs an Assignment to the MU
   */
  const assignLogger = logger.child("assign");
  const assign = getAssign({
    deployAssign: new MuClient.DeployAssign({
      fetch,
      MU_URL,
      logger: assignLogger,
    }).execute,
    logger: messageLogger,
  });

  return { result, results, message, spawn, monitor, unmonitor, dryrun, assign };
}
