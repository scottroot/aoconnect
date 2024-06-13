import { test } from "node:test";
import * as assert from "node:assert";

import { verifyInput } from "./verify-input";


test("verify input of a message", async () => {
  const res = verifyInput({
    Id: "1234",
    Target: "FOO_PROCESS",
    Owner: "FOO_OWNER",
    Data: "SOME DATA",
    Tags: [
      { name: "Action", value: "Balance" },
      { name: "Target", value: "MY_WALLET" },
    ],
  });

  assert.deepStrictEqual(res, {
    Id: "1234",
    Target: "FOO_PROCESS",
    Owner: "FOO_OWNER",
    Data: "SOME DATA",
    Tags: [
      { name: "Action", value: "Balance" },
      { name: "Target", value: "MY_WALLET" },
      { name: "Data-Protocol", value: "ao" },
      { name: "Type", value: "Message" },
      { name: "Variant", value: "ao.TN.1" },
    ],
  });
});
