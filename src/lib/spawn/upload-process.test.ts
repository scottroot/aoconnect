import { describe, test } from "node:test";
import * as assert from "node:assert";

import { createLogger } from "../../logger";
import { uploadProcess } from "./upload-process";
import type { DeployProcessArgs } from "../../client/ao-mu";


const logger = createLogger("createProcess");

describe("upload-process", () => {
  test("add the tags, sign, upload the process, register the process, and return the processId", async () => {
    const env = {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      loadTransactionMeta: async(_: string) => ({ tags: [] }),
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      validateScheduler: async(_: string) => false,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      deployProcess: async ({ data, tags, signer }: DeployProcessArgs) => {
        assert.ok(data);
        assert.deepStrictEqual(tags, [
          { name: "foo", value: "bar" },
          { name: "Data-Protocol", value: "ao" },
          { name: "Variant", value: "ao.TN.1" },
          { name: "Type", value: "Process" },
          { name: "Module", value: "module-id-123" },
          { name: "Scheduler", value: "zVkjFCALjk4xxuCilddKS8ShZ-9HdeqeuYQOgMgWucro" },
          { name: "SDK", value: "aoconnect" },
          { name: "Content-Type", value: "text/plain" },
        ]);
        assert.ok(signer);

        return {
          res: "foobar",
          processId: "process-id-123",
          signedDataItem: { id: "process-id-123", raw: "raw-buffer" },
        };
      },
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      // registerProcess: async (signedDataItem) => {
      //   assert.deepStrictEqual(signedDataItem, { id: "process-id-123", raw: "raw-buffer" });
      //   return { foo: "bar" };
      // },
      logger,
    };
    const args = {
      module: "module-id-123",
      scheduler: "zVkjFCALjk4xxuCilddKS8ShZ-9HdeqeuYQOgMgWucro",
      tags: [
        { name: "foo", value: "bar" },
        { name: "Data-Protocol", value: "ao" },
        { name: "Variant", value: "ao.TN.1" },
      ],
      data: "",
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      signer: async () => ({ id: "process-id-123", raw: "raw-buffer" }),
    };
    const res = await uploadProcess(env, args);

    assert.equal(res.processId, "process-id-123");
  });

  test("defaults tags if none are provided", async () => {
    const env = {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      loadTransactionMeta: async(_: string) => ({ tags: [] }),
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      validateScheduler: async(_: string) => false,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      deployProcess: async ({ tags }: DeployProcessArgs) => {
        assert.deepStrictEqual(tags, [
          { name: "Data-Protocol", value: "ao" },
          { name: "Variant", value: "ao.TN.1" },
          { name: "Type", value: "Process" },
          { name: "Module", value: "module-id-123" },
          { name: "Scheduler", value: "zVkjFCALjk4xxuCilddKS8ShZ-9HdeqeuYQOgMgWucro" },
          { name: "SDK", value: "aoconnect" },
          { name: "Content-Type", value: "text/plain" },
        ]);

        return { res: "foobar", processId: "process-id-123" };
      },
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      registerProcess: async () => ({ foo: "bar" }),
      logger,
    };
    const args = {
      module: "module-id-123",
      scheduler: "zVkjFCALjk4xxuCilddKS8ShZ-9HdeqeuYQOgMgWucro",
      data: "",
      tags: [],
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      signer: async () => ({ id: "process-id-123", raw: "raw-buffer" }),
    };

    await uploadProcess(env, args);
  });

  test("does not overwrite data", async () => {
    const env = {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      loadTransactionMeta: async(_: string) => ({ tags: [] }),
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      validateScheduler: async(_: string) => false,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      deployProcess: async ({ data, tags }: DeployProcessArgs) => {
        assert.equal(data, "foobar");
        /**
         * Assert no Content-Type tag is added
         */
        assert.deepStrictEqual(tags, [
          { name: "foo", value: "bar" },
          { name: "Data-Protocol", value: "ao" },
          { name: "Variant", value: "ao.TN.1" },
          { name: "Type", value: "Process" },
          { name: "Module", value: "module-id-123" },
          { name: "Scheduler", value: "zVkjFCALjk4xxuCilddKS8ShZ-9HdeqeuYQOgMgWucro" },
          { name: "SDK", value: "aoconnect" },
        ]);
        return {
          res: "foobar",
          processId: "process-id-123",
          signedDataItem: { id: "process-id-123", raw: "raw-buffer" },
        };
      },
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      registerProcess: async () => {
        return { foo: "bar" };
      },
      logger,
    };
    const args = {
      module: "module-id-123",
      scheduler: "zVkjFCALjk4xxuCilddKS8ShZ-9HdeqeuYQOgMgWucro",
      tags: [{ name: "foo", value: "bar" }],
      data: "foobar",
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      signer: async () => ({ id: "process-id-123", raw: "raw-buffer" }),
    };

    await uploadProcess(env, args);
  });
});
