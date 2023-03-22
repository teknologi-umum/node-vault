import {afterAll, beforeAll, describe, expect, it} from "vitest";
import { RequestClient } from "../../src/internal/RequestClient";
import { AppRole} from "../../src/auth/AppRole";
import { ArgumentError } from "../../src/errors/ArgumentError";

type ReadRoleIdResponse = {
  data: {
    role_id: string;
  };
}

type ReadSecretIdResponse = {
  data: {
    secret_id: string;
  };
}

describe("AppRole", () => {
  const baseUrl: string = process.env.VAULT_ADDRESS ?? "http://localhost:8200/";
  const parsedBaseUrl = new URL(baseUrl);


  const client = new RequestClient(
    false,
    {
      host: parsedBaseUrl.host,
      port: parsedBaseUrl.port,
      protocol: parsedBaseUrl.protocol
    } 
  );

  let roleId = "";
  let secretId = "";

  beforeAll(async () => {
    await client.post("v1/sys/auth/approle", {
      json: {
        type: "approle"
      },
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });

    await client.post("v1/auth/approle/role/testing", {
      json: {
        password: "very strong password"
      },
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });

    const roleIdResponse = await client.get<ReadRoleIdResponse>("v1/auth/approle/role/testing/role-id", {
      responseType: "json",
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });

    roleId = roleIdResponse.data.role_id;

    const secretIdResponse = await client.post<ReadSecretIdResponse>("v1/auth/approle/role/testing/secret-id", {
      responseType: "json",
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });

    secretId = secretIdResponse.data.secret_id;
  });

  afterAll(async () => {
    await client.delete("v1/auth/approle/role/testing", {
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });

    await client.delete("v1/sys/auth/approle", {
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });
  });

  it("should throw ArgumentError on empty role id", () => {
    expect(() => new AppRole(client, "", ""))
      .toThrowError(new ArgumentError("roleId"));
  });

  it("should throw ArgumentError on empty secret id", () => {
    expect(() => new AppRole(client, "foo", ""))
      .toThrowError(new ArgumentError("secretId"));
  });

  it("should be able to login", async () => {
    const appRole = new AppRole(client, roleId, secretId);

    const token = await appRole.login();

    expect(token).not.toStrictEqual("");
  });
});