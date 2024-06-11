import { connect as schedulerUtilsConnect } from "@permaweb/ao-scheduler-utils";

import * as MuClient from "./client/ao-mu.ts";
import * as CuClient from "./client/ao-cu.ts";
import * as SuClient from "./client/ao-su.ts";
import * as GatewayClient from "./client/gateway.ts";
import { createLogger } from "./logger.ts";

import type { ResultFunc } from "./lib/result/index.ts";
import { getResult } from "./lib/result/index.ts";
import type { MessageFunc } from "./lib/message/index.ts";
import { getMessage } from "./lib/message/index.ts";
import type { SpawnFunc } from "./lib/spawn/index.ts";
import { getSpawn } from "./lib/spawn/index.ts";
import type { MonitorFunc } from "./lib/monitor/index.ts";
import { getMonitor } from "./lib/monitor/index.ts";
import type { UnmonitorFunc } from "./lib/unmonitor/index.ts";
import { getUnmonitor } from "./lib/unmonitor/index.ts";
import type { DryrunFunc } from "./lib/dryrun/index.ts";
import { getDryrun } from "./lib/dryrun/index.ts";
import type { AssignFunc } from "./lib/assign/index.ts";
import { getAssign } from "./lib/assign/index.ts";
import { joinUrl } from "./lib/utils.ts";
import type { ResultsFunc } from "./lib/results/index.js";
import { getResults } from "./lib/results/index.js";

const DEFAULT_GATEWAY_URL = "https://arweave.net";
const DEFAULT_MU_URL = "https://mu.ao-testnet.xyz";
const DEFAULT_CU_URL = "https://cu.ao-testnet.xyz";

export { serializeCron } from "./lib/serializeCron/index.js";

export function connect({ GRAPHQL_URL = "", GATEWAY_URL = DEFAULT_GATEWAY_URL, MU_URL = DEFAULT_MU_URL, CU_URL = DEFAULT_CU_URL } = {}): {
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

  const { validate } = schedulerUtilsConnect({ cacheSize: 100, GRAPHQL_URL });

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
