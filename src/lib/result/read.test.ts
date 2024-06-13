import { describe, test } from "node:test";
import * as assert from "node:assert";

import { read } from "./read";
import type { GetResult } from "./index";
import { createLogger } from "../../logger";


const logger = createLogger("monitor");

describe("read", () => {
  test("should return the output", async () => {
    const env: GetResult = {
      logger,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      loadResult: async (args) => {
        assert.deepStrictEqual(args, {
          id: "message-123",
          processId: "process-123",
        });

        return {
          output: "",
          messages: [
            {
              owner: "SIGNERS_WALLET_ADDRESS",
              target: "myOVEwyX7QKFaPkXo3Wlib-Q80MOf5xyjL9ZyvYSVYc",
              anchor: "process-id:message-id:counter",
              tags: [
                { name: "Forwarded-For", value: "b09lyYWG6jZabiyZrZS2meWUyZXspaX4TCfDmH1KDmI" },
                { name: "Data-Protocol", value: "ao" },
                { name: "ao-type", value: "message" },
                { name: "function", value: "notify" },
                { name: "notify-function", value: "transfer" },
                { name: "from", value: "SIGNERS_WALLET_ADDRESS" },
                { name: "qty", value: "1000" },
              ],
              data: "",
            },
          ],
          spawns: [],
        };
      },
    };
    const args = {
      id: "message-123",
      processId: "process-123",
    };
    const res = await read(env, args);

    assert.deepStrictEqual(res, {
      output: "",
      messages: [
        {
          owner: "SIGNERS_WALLET_ADDRESS",
          target: "myOVEwyX7QKFaPkXo3Wlib-Q80MOf5xyjL9ZyvYSVYc",
          anchor: "process-id:message-id:counter",
          tags: [
            { name: "Forwarded-For", value: "b09lyYWG6jZabiyZrZS2meWUyZXspaX4TCfDmH1KDmI" },
            { name: "Data-Protocol", value: "ao" },
            { name: "ao-type", value: "message" },
            { name: "function", value: "notify" },
            { name: "notify-function", value: "transfer" },
            { name: "from", value: "SIGNERS_WALLET_ADDRESS" },
            { name: "qty", value: "1000" },
          ],
          data: "",
        },
      ],
      spawns: [],
    });
  });
});
