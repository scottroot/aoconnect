import { describe, test } from "node:test";
import * as assert from "node:assert";

import { createLogger } from "../../logger";
import { uploadUnmonitor } from "./upload-unmonitor";
import type { DataItemSigner } from "../../types";
import type { DeployUnmonitorArgs } from "client/ao-mu";
import type { LoadProcessMetaArgs } from "client/ao-su";
import type { GetUnmonitor } from "lib/unmonitor";


const logger = createLogger("monitor");
const testSigner: DataItemSigner = async () => ({ id: "", raw: "" });

describe("upload-unmonitor", () => {
  test("add the tags, sign, and upload the unmonitor, and return the monitorId", async () => {
    const env: GetUnmonitor = {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      loadProcessMeta: async (_: LoadProcessMetaArgs) => ({ tags: [] }),
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      deployUnmonitor: async ({ processId, data, tags, signer }: DeployUnmonitorArgs) => {
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
      signer: testSigner,
      process: "",
      data: "",
    };
    const res = await uploadUnmonitor(env, args);

    assert.equal(res.monitorId, "monitor-id-123");
  });
});
