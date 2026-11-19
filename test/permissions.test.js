import test from "node:test";
import assert from "node:assert/strict";
import { requestMealieOriginAccess } from "../src/permissions.js";

test("requests only the exact configured Mealie origin", async () => {
  const requests = [];
  const permissions = {
    async request(permission) {
      requests.push(permission);
      return true;
    },
    async contains() {
      return false;
    },
    async remove() {
      return true;
    },
  };

  await requestMealieOriginAccess(
    permissions,
    "https://mealie.example:9922/instance",
    "",
  );

  assert.deepEqual(requests, [{ origins: ["https://mealie.example:9922/*"] }]);
});

test("removes the previous origin when Mealie is reconfigured and never requests supermarket access", async () => {
  const requests = [];
  const checks = [];
  const removals = [];
  const permissions = {
    async request(permission) {
      requests.push(permission);
      return true;
    },
    async contains(permission) {
      checks.push(permission);
      return true;
    },
    async remove(permission) {
      removals.push(permission);
      return true;
    },
  };

  await requestMealieOriginAccess(
    permissions,
    "https://new-mealie.example",
    "http://old-mealie.local:8080/path",
  );

  assert.deepEqual(requests, [{ origins: ["https://new-mealie.example/*"] }]);
  assert.deepEqual(checks, [{ origins: ["http://old-mealie.local:8080/*"] }]);
  assert.deepEqual(removals, [{ origins: ["http://old-mealie.local:8080/*"] }]);
  assert.ok(
    [...requests, ...checks, ...removals].every((permission) =>
      permission.origins.every((origin) => !origin.includes("supermarket")),
    ),
  );
});
