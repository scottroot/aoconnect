import { errFrom } from "../utils";
import type { MessageContext } from "./upload-message";
import { buildData, buildTags } from "./upload-message";
import type { Logger } from "../../logger";
import type { LoadProcessMetaArgs } from "../../client/ao-su";
import type { DeployMessageArgs, DeployMessageReturn } from "../../client/ao-mu";
import { deployMessageSchema, signerSchema } from "../../dal";
import type { Signer, Tag } from "../../types";


export interface GetMessage {
  loadProcessMeta: ({ suUrl, processId }: LoadProcessMetaArgs) => Promise<any>;
  deployMessage: (args: DeployMessageArgs, ...args_1: unknown[]) => Promise<DeployMessageReturn>;
  logger: Logger;
}

export interface MessageFuncArgs {
  process: string;
  data: string;
  tags: Tag[];
  anchor: string;
  signer: Signer;
}

export type MessageFunc = (args: MessageFuncArgs) => Promise<DeployMessageReturn>;

export function getMessage(env: GetMessage): MessageFunc {
  const deployMessage = deployMessageSchema.implement(env.deployMessage);
  return async (ctx: MessageContext): Promise<DeployMessageReturn> => {
    try {
      const { process: processId, signer: _signer, ...restCtx } = ctx;
      if (!processId) throw "Missing process id";
      const signer = signerSchema.implement(_signer);

      const ctxWithTags: MessageContext = buildTags(restCtx);
      const ctxWithData: MessageContext = buildData(ctxWithTags, env.logger);

      const message: DeployMessageArgs = {
        ...ctxWithData,
        processId,
        signer: signerSchema.implement(signer),
      };
      const deployedMessage = await deployMessage(message);
      const messageResult = { ...ctx, messageId: deployedMessage.messageId };
      env.logger.tap('Deploy message result for process "%s": %O', processId)(messageResult);
      return deployedMessage;
    } catch (error) {
      throw errFrom(error);
    }
  };
}
