import { errFrom } from "../utils.js";
import { sendAssign } from "./send-assign.js";
import type { WriteAssignArgs } from "../../client/ao-mu.js";
import type { Logger } from "../../logger.js";


export interface GetAssignProps {
  deployAssign: (args: WriteAssignArgs) => Promise<{ res: any; assignmentId: string }>;
  logger: Logger;
}

export type AssignFunc = (args: AssignFuncArgs) => Promise<{ assignmentId: string }>;

export interface AssignFuncArgs {
  process: string;
  message: string;
  exclude?: string[];
  baseLayer?: boolean;
}

export function getAssign(env: GetAssignProps): AssignFunc {
  return async (args: AssignFuncArgs) => {
    try {
      return await sendAssign(env, args);
    } catch (error) {
      throw errFrom(error);
    }
  };
}
