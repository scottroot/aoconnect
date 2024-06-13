import { loadTransactionMetaSchema, validateSchedulerSchema } from "../../dal";
import { eqOrIncludes, parseTags } from "../utils";
import type { GetSpawn, SpawnContext } from "./index";
import type { Logger } from "../../logger";
import type { LoadTransactionMetaFuncReturn } from "../../client/gateway";


export interface VerifyModule {
  loadTransactionMeta: (id: string, ...args_1: unknown[]) => Promise<LoadTransactionMetaFuncReturn>;
  logger: Logger;
  module: string;
}

async function verifyModule({ loadTransactionMeta, logger, module }: VerifyModule): Promise<boolean> {
  try {
    const validator = loadTransactionMetaSchema.implement(loadTransactionMeta);
    const data = await validator(module);
    const pt = parseTags(data.tags);
    if (!eqOrIncludes(pt["Data-Protocol"], "ao")) throw "Tag 'Data-Protocol': value 'ao' was not found on module";
    if (!eqOrIncludes(pt["Type"], "Module")) throw "Tag 'Data-Protocol': value 'Module' was not found on module";
    if (!pt["Module-Format"]) throw "Tag 'Module-Format': was not found on module";
    if (!pt["Input-Encoding"]) throw "Tag 'Input-Encoding': was not found on module";
    if (!pt["Output-Encoding"]) throw "Tag 'Output-Encoding': was not found on module";
    logger.tap("Verified module source");
    return true;
  } catch (err) {
    logger.tap(`Verifying module source failed: ${err}`);
    return false;
  }
}

export interface VerifyScheduler {
  logger: Logger;
  validateScheduler: (address: string) => Promise<boolean>;
  scheduler: string;
}

async function verifyScheduler({ logger, validateScheduler, scheduler }: VerifyScheduler): Promise<boolean> {
  try {
    /**
     * Ensure the provider scheduler wallet actually owns
     * a valid Scheduler-Location record on-chain
     */
    const validator = validateSchedulerSchema.implement(validateScheduler);
    const data = await validator(scheduler);
    if (data) {
      logger.tap("Verified scheduler");
      return true;
    } else {
      logger.tap(`Verifying scheduler failed: Valid Scheduler-Location owned by ${scheduler} not found`);
      return false;
    }
  } catch (err) {
    logger.tap(`Verifying scheduler failed: ${err}`);
    return false;
  }
}
interface VerifySigner {
  signer: any;
  logger: Logger
}
function verifySigner({ signer, logger }: VerifySigner): boolean {
  if (!signer) {
    logger.tap("signer not found");
    return false;
  }
  return true;
}

export async function verifyInputs(env: GetSpawn, args: SpawnContext): Promise<boolean> {
  const logger = env.logger.child("verifyInput");

  const verifiedModule = await verifyModule({
    loadTransactionMeta: env.loadTransactionMeta,
    module: args.module,
    logger,
  });
  if (!verifiedModule) {
    logger.tap("Failed to validate module.");
    return false;
  }

  const verifiedScheduler = await verifyScheduler({
    validateScheduler: env.validateScheduler,
    scheduler: args.scheduler,
    logger,
  });
  if (!verifiedScheduler) {
    logger.tap("Failed to validate scheduler.");
    return false;
  }

  const verifiedSigner = verifySigner({
    signer: args.signer,
    logger,
  });
  if (!verifiedSigner) {
    logger.tap("Failed to validate signer.");
    return false;
  }

  logger.tap("Successfully verified inputs");
  return true;
}
