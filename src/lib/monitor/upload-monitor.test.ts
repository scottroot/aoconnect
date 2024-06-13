import { describe, test } from "node:test";
import * as assert from "node:assert";

import { createLogger } from "../../logger";
import { uploadMonitor } from "./upload-monitor";
import type { DeployMonitorArgs } from "../../client/ao-mu";


const logger = createLogger("monitor");

describe("upload-monitor", () => {
  test("add the tags, sign, and upload the monitor, and return the monitorId", async () => {
    const env = {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      deployMonitor: async ({ processId, data, tags, signer }: DeployMonitorArgs): Promise<any> => {
        assert.ok(data);
        assert.equal(processId, "process-asdf");
        assert.deepStrictEqual(tags, []);
        assert.ok(signer);

        return { messageId: "monitor-id-123" };
      },
      logger,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      loadProcessMeta: async () => ({ tags: [] }),
    };
    const args = {
      id: "process-asdf",
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      signer: async () => ({ id: "", raw: "" }),
      process: "",
      data: "",
    };
    const res = await uploadMonitor(env, args);

    assert.equal(res.monitorId, "monitor-id-123");
  });
});
