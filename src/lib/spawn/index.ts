import { verifyInputs } from "./verify-inputs.js";
import { uploadProcess } from "./upload-process.js";
import { errFrom } from "../utils.js";
import type { DeployProcessReturn, RegisterProcessArgs } from "../../client/ao-mu.js";
import type { Logger } from "../../logger.js";
import type { Signer, Tag } from "../../types.js";
import type { LoadTransactionMetaFuncReturn } from "../../client/gateway.js";


export interface GetSpawnProps {
  loadTransactionMeta: (id: string) => Promise<LoadTransactionMetaFuncReturn>;
  validateScheduler: (address: string) => Promise<boolean>;
  deployProcess: (args: RegisterProcessArgs, ...args_1: unknown[]) => Promise<DeployProcessReturn>;
  logger: Logger;
}

export type SpawnFunc = (args: SpawnContext) => Promise<DeployProcessReturn>;

export interface SpawnContext {
  module: string;
  scheduler: string;
  signer: Signer;
  tags: Tag[];
  data: string;
}

export function getSpawn(env: GetSpawnProps): SpawnFunc {
  return async (args: SpawnContext): Promise<DeployProcessReturn> => {
    try {
      const verifiedInputs = await verifyInputs(env, args);
      if (!verifiedInputs) {
        // TODO: move or get rid of all these local throws
        throw "Invalid inputs";
      }
      return await uploadProcess(env, args);
    } catch (error) {
      throw errFrom(error);
    }
  };
}
