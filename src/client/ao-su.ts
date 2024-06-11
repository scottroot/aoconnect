import { LRUMap } from "mnemonist";
import {Tag} from "../types.js";

type ProcessMetaCache = LRUMap<string, any>;

let processMetaCache: ProcessMetaCache;

export const createProcessMetaCache = ({ MAX_SIZE }): ProcessMetaCache => {
  if (processMetaCache) return processMetaCache;
  processMetaCache = new LRUMap(MAX_SIZE);
  return processMetaCache;
};


export interface SUEnv {
  logger: (message: string, ...args: any[]) => void;
  fetch: (url: string, options: RequestInit) => Promise<Response>;
  cache?: ProcessMetaCache;
}

export interface LoadProcessMetaArgs {
  suUrl: string;
  processId: string;
}

export class LoadProcessMeta {
  private logger: (message: string, ...args: any[]) => void;
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private cache: ProcessMetaCache;

  constructor({ logger, fetch, cache = new LRUMap<string, any>(100) }: SUEnv) {
    this.logger = logger;
    this.fetch = fetch;
    this.cache = cache;
  }

  // async execute({ suUrl, processId }: LoadProcessMetaArgs): Promise<any> {
  async execute({ suUrl, processId }: LoadProcessMetaArgs): Promise<{ tags: Tag[], [key: string]: any }> {
    if (this.cache.has(processId)) {
      return this.cache.get(processId);
    }

    try {
      const response = await this.fetch(`${suUrl}/processes/${processId}`, { method: "GET", redirect: "follow" });

      if (!response.ok) {
        this.logger("Error Encountered when fetching process meta from SU '%s' for process '%s'", suUrl, processId);
        throw new Error(`Encountered Error fetching scheduled messages from Scheduler Unit: ${response.status}: ${await response.text()}`);
      }
      const meta = await response.json();
      this.logger("Caching process meta for process '%s'", processId);
      this.cache.set(processId, { tags: meta.tags });
      return meta;
    } catch (error) {
      this.logger("Error: %s", error.message);
      throw error;
    }
  }
}
