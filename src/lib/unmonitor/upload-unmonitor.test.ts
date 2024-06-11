import { describe, test } from "node:test";
import * as assert from "node:assert";

import { createLogger } from "../../logger.js";
import { uploadUnmonitor } from "./upload-unmonitor.js";


const logger = createLogger("monitor");

describe("upload-unmonitor", () => {
  test("add the tags, sign, and upload the unmonitor, and return the monitorId", async () => {
    const env = {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      loadProcessMeta: async () => ({ tags: [] }),
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      deployUnmonitor: async ({ processId, data, tags, signer }) => {
        assert.ok(data);
        assert.equal(processId, "process-asdf");
        assert.deepStrictEqual(tags, []);
        assert.ok(signer);

        return { messageId: "monitor-id-123" };
      },
      logger,
    };
    const args = {
      id: "process-asdf",
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      signer: async () => [],
      process: "",
      data: "",
    };
    const res = await uploadUnmonitor(env, args);

    assert.equal(res.monitorId, "monitor-id-123");
  });
});
