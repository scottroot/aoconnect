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

export function connect({
  GRAPHQL_URL = "",
  GATEWAY_URL = DEFAULT_GATEWAY_URL,
  MU_URL = DEFAULT_MU_URL,
  CU_URL = DEFAULT_CU_URL
}): {
  result: ResultFunc;
  results: ResultsFunc;
  message: MessageFunc;
  spawn: SpawnFunc;
  monitor: MonitorFunc;
  unmonitor: UnmonitorFunc;
  dryrun: DryrunFunc;
  assign: AssignFunc;
} {
  console.log(JSON.stringify({ CU_URL, MU_URL, GATEWAY_URL, GRAPHQL_URL }));
  const logger = createLogger();
  if (!GRAPHQL_URL) {
    GRAPHQL_URL = joinUrl({ url: GATEWAY_URL, path: "/graphql" });
  }
  const { validate } = schedulerUtilsConnect({ cacheSize: 100, GRAPHQL_URL });

  const processMetaCache = SuClient.createProcessMetaCache({ MAX_SIZE: 25 });

  const resultLogger = logger.child("result");
  const loadResultInstance = new CuClient.LoadResult({
    fetch, CU_URL, logger: resultLogger
  });
  const result = getResult({
    loadResult: loadResultInstance.execute.bind(loadResultInstance),
    logger: resultLogger,
  });

  /**
   * default writeInteraction that works OOTB
   * - writes signed data item for message to the MU
   */
  const messageLogger = logger.child("message");
  const messageLoadInstance = new SuClient.LoadProcessMeta({
    fetch, cache: processMetaCache, logger: messageLogger
  });
  const deployMessageInstance = new MuClient.DeployMessage({
    fetch, MU_URL, logger: messageLogger
  });
  const message = getMessage({
    loadProcessMeta: messageLoadInstance.execute.bind(messageLoadInstance),
    deployMessage: deployMessageInstance.execute.bind(deployMessageInstance),
    logger: messageLogger,
  });

  /**
   * default spawn that works OOTB
   * - Verifies the inputs
   * - spawns the process via the MU
   */
  const spawnLogger = logger.child("spawn");
  const loadTransactionMetaInstance = new GatewayClient.LoadTransactionMeta({
    fetch, GRAPHQL_URL, logger: spawnLogger
  });
  const deployProcessInstance = new MuClient.DeployProcess({
    fetch, MU_URL, logger: spawnLogger
  });
  const spawn = getSpawn({
    loadTransactionMeta: loadTransactionMetaInstance.execute.bind(loadTransactionMetaInstance),
    validateScheduler: validate,
    deployProcess: deployProcessInstance.execute.bind(deployProcessInstance),
    logger: spawnLogger,
  });

  /**
   * default monitor that works OOTB
   * - Verifies the inputs
   * - post a signed message via the MU /monitor/:process endpoint
   */
  const monitorLogger = logger.child("monitor");
  const monitorLoadInstance = new SuClient.LoadProcessMeta({
    fetch, cache: processMetaCache, logger: monitorLogger,
  });
  const deployMonitorInstance = new MuClient.DeployMonitor({
    fetch, MU_URL, logger: monitorLogger
  });
  const monitor = getMonitor({
    loadProcessMeta: monitorLoadInstance.execute.bind(monitorLoadInstance),
    deployMonitor: deployMonitorInstance.execute.bind(deployMonitorInstance),
    logger: monitorLogger,
  });

  /**
   * default unmonitor that works OOTB
   * - Verifies the inputs
   * - post a signed message via the MU /monitor/:process endpoint
   */
  const unmonitorLogger = logger.child("unmonitor");
  const unmonitorLoadInstance = new SuClient.LoadProcessMeta({
    fetch, cache: processMetaCache, logger: unmonitorLogger,
  });
  const unmonitor = getUnmonitor({
    loadProcessMeta: unmonitorLoadInstance.execute.bind(unmonitorLoadInstance),
    // locateScheduler: locate,
    deployUnmonitor: new MuClient.DeployUnmonitor({ fetch, MU_URL, logger: unmonitorLogger }).execute,
    logger: monitorLogger,
  });

  /**
   * results - returns batch of Process Results given a specified range
   */
  const resultsLogger = logger.child("results");
  const queryResultsInstance = new CuClient.QueryResults({
    fetch, CU_URL, logger: resultsLogger
  });
  const results = getResults({
    queryResults: queryResultsInstance.execute.bind(queryResultsInstance),
    logger: resultsLogger,
  });

  /**
   * dryrun - sends a message object to the cu and returns a result
   */
  const dryrunLogger = logger.child("dryrun");
  const dryrunFetchInstance = new CuClient.DryrunFetch({
    fetch, CU_URL, logger: dryrunLogger
  });
  const dryrun = getDryrun({
    dryrunFetch: dryrunFetchInstance.execute.bind(dryrunFetchInstance),
    logger: dryrunLogger,
  });

  /**
   * POSTs an Assignment to the MU
   */
  const assignLogger = logger.child("assign");
  const deployAssignInstance = new MuClient.DeployAssign({
    fetch, MU_URL, logger: assignLogger,
  })
  const assign = getAssign({
    deployAssign: deployAssignInstance.execute.bind(deployAssignInstance),
    logger: messageLogger,
  });

  return { result, results, message, spawn, monitor, unmonitor, dryrun, assign };
}
