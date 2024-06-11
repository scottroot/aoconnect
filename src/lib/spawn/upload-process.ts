import { deployProcessSchema, signerSchema } from "../../dal.js";
import { removeTagsByNameMaybeValue } from "../utils.js";
import type { GetSpawnProps, SpawnContext } from "./index.js";
import type { Logger } from "../../logger.js";
import type { Tag } from "../../types.js";
import { tagsSchema } from "../../types.js";
import type { DeployProcessReturn } from "../../client/ao-mu.js";


export function buildTags({ tags, module, scheduler }: SpawnContext): Tag[] {
  const tagsToRemove = [
    { name: "Data-Protocol", value: "ao" },
    { name: "Variant" },
    { name: "Type" },
    { name: "Module" },
    { name: "Scheduler" },
    { name: "SDK" },
  ];
  let newTags = tagsToRemove.reduce((acc: Tag[], tag: Tag) => {
    return removeTagsByNameMaybeValue(acc, tag);
  }, tags || []);

  newTags = [
    ...newTags,
    { name: "Data-Protocol", value: "ao" },
    { name: "Variant", value: "ao.TN.1" },
    { name: "Type", value: "Process" },
    { name: "Module", value: module },
    { name: "Scheduler", value: scheduler },
    { name: "SDK", value: "aoconnect" },
  ];

  return tagsSchema.parse(newTags);
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

export async function uploadProcess(env: GetSpawnProps, args: SpawnContext): Promise<DeployProcessReturn> {
  const logger = env.logger.child("uploadProcess");

  const { data, tags } = buildData(args, logger);
  const newTags = buildTags({ ...args, tags });

  const deployProcess = deployProcessSchema.implement(env.deployProcess);
  return await deployProcess({
    data,
    tags: newTags,
    signer: signerSchema.implement(args.signer),
  });
}
