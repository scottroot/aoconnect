import { deployProcessSchema, signerSchema, tagSchema } from "../../dal";
import { removeTagsByNameMaybeValue } from "../utils";
import type { GetSpawn, SpawnContext } from "./index";
import type { Logger } from "../../logger";
import type { DataItemSigner, Tag } from "../../types";
import type { DeployProcessReturn } from "../../client/ao-mu";


export function buildTags({ tags, module, scheduler }: SpawnContext): Tag[] {
  const tagsToRemove: { name: string, value?: string }[] = [
    { name: "Data-Protocol", value: "ao" },
    { name: "Variant" },
    { name: "Type" },
    { name: "Module" },
    { name: "Scheduler" },
    { name: "SDK" },
  ];
  const oldTags: Tag[] = tags || [];
  let newTags = tagsToRemove.reduce((acc, curr) => {
    return removeTagsByNameMaybeValue(acc, curr);
  }, oldTags);

  newTags = [
    ...newTags,
    { name: "Data-Protocol", value: "ao" },
    { name: "Variant", value: "ao.TN.1" },
    { name: "Type", value: "Process" },
    { name: "Module", value: module },
    { name: "Scheduler", value: scheduler },
    { name: "SDK", value: "aoconnect" },
  ];

  // return tagsSchema.parse(newTags);
  return newTags.map(tag => tagSchema.parse(tag) as Tag);
}

export function buildData(ctx: Partial<SpawnContext>, logger: Logger): { data: string | ArrayBuffer; tags: Tag[] } {
  if (!ctx.tags) throw "No tags present when building data for spawn.";
  if (ctx.data) return { data: ctx.data, tags: ctx.tags };
  const { tags, ...rest } = ctx;
  const newData = Math.random().toString().slice(-4);
  const newTags = removeTagsByNameMaybeValue(tags, { name: "Content-Type" });
  newTags.push({ name: "Content-Type", value: "text/plain" });
  logger.tap(`added pseudo-random string as message "data"`);
  return {
    ...rest,
    data: newData,
    tags: newTags,
  };
}

export async function uploadProcess(env: GetSpawn, args: SpawnContext): Promise<DeployProcessReturn> {
  const logger = env.logger.child("uploadProcess");

  const { data, tags } = buildData(args, logger);
  const newTags = buildTags({ ...args, tags });

  const deployProcess = deployProcessSchema.implement(env.deployProcess);
  return await deployProcess({
    data,
    tags: newTags,
    signer: signerSchema.implement(args.signer) as DataItemSigner,
  });
}
