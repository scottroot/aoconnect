import { describe, test } from "node:test";
import * as assert from "node:assert";

import { LoadProcessMeta } from "./ao-su.js";
import { loadProcessMetaSchema } from "../dal.js";
import { createLogger } from "../logger.js";

const logger = createLogger("ao-cu");

const SU_URL = globalThis.SU_URL || "https://su.foo";
const PROCESS_ID = "uPKuZ6SABUXvgaEL3ZS3ku5QR1RLwE70V6IUslmZJFI";

describe("ao-su", () => {
  describe("loadProcessMeta", () => {
    const tags = [
      {
        name: "Contract-Src",
        value: "gnVg6A6S8lfB10P38V7vOia52lEhTX3Uol8kbTGUT8w",
      },
      {
        name: "SDK",
        value: "ao",
      },
    ];

    test("return the process meta from the su", async () => {
      const loadProcessMeta = loadProcessMetaSchema.implement(
        new LoadProcessMeta({
          fetch: async (url, options): Promise<any> => {
            assert.equal(url, `${SU_URL}/processes/${PROCESS_ID}`);
            assert.deepStrictEqual(options, { method: "GET", redirect: "follow" });
            return new Response(JSON.stringify({ tags }));
          },
          cache: {
            has: (processId): boolean => {
              assert.equal(processId, PROCESS_ID);
              return false;
            },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            set: (processId, meta) => {
              assert.equal(processId, PROCESS_ID);
              assert.deepStrictEqual(meta, { tags });
            },
          },
          logger,
        }).execute,
      );

      const res = await loadProcessMeta({
        suUrl: SU_URL,
        processId: PROCESS_ID,
      });

      assert.deepStrictEqual(res, { tags });
    });

    test("return the process meta from the ", async () => {
      const loadProcessMeta = loadProcessMetaSchema.implement(
        new LoadProcessMeta({
          fetch: async (_): Promise<any> => assert.fail("Should not call su if cached"),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          cache: {
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            has: (processId) => {
              assert.equal(processId, PROCESS_ID);
              return true;
            },
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            get: (processId) => {
              assert.equal(processId, PROCESS_ID);
              return { tags };
            },
          },
          logger,
        }).execute,
      );

      const res = await loadProcessMeta({
        suUrl: SU_URL,
        processId: PROCESS_ID,
      });

      assert.deepStrictEqual(res, { tags });
    });
  });
});
