import { errFrom } from "../utils";
import { verifyInputs } from "./verify-inputs";
import { uploadProcess } from "./upload-process";
import type { Logger } from "../../logger";
import type { DeployProcessReturn, DeployProcessArgs } from "../../client/ao-mu";
import type { DataItemSigner, Tag } from "../../types";
import type { LoadTransactionMetaFuncReturn } from "../../client/gateway";


export interface GetSpawn {
  loadTransactionMeta: (id: string) => Promise<LoadTransactionMetaFuncReturn>;
  validateScheduler: (address: string) => Promise<boolean>;
  deployProcess: (args: DeployProcessArgs, ...args_1: unknown[]) => Promise<DeployProcessReturn>;
  logger: Logger;
}

export type SpawnFunc = (args: SpawnContext) => Promise<DeployProcessReturn>;

export interface SpawnContext {
  module: string;
  scheduler: string;
  signer: DataItemSigner;
  tags: Tag[];
  data: string;
}

export function getSpawn(env: GetSpawn): SpawnFunc {
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
