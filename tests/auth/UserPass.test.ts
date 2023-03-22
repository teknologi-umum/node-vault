import {afterAll, beforeAll, describe, it, expect} from "vitest";
import {RequestClient} from "../../src/internal/RequestClient";
import {UserPass} from "../../src/auth/UserPass";
import {ArgumentError} from "../../src/VaultClient";

describe("UserPass", () => {
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

  beforeAll(async () => {
    await client.post("v1/sys/auth/userpass", {
      json: {
        type: "userpass"
      },
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });

    await client.post("v1/auth/userpass/users/johndoe", {
      json: {
        password: "very strong password"
      },
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });
  });

  afterAll(async () => {
    await client.delete("v1/auth/userpass/users/johndoe", {
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });

    await client.delete("v1/sys/auth/userpass", {
      headers: {
        "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    });
  });

  it("should throw ArgumentError for empty username", () => {
    expect(() => new UserPass(client, "", ""))
      .toThrowError(new ArgumentError("username"));
  });

  it("should throw ArgumentError for empty password", () => {
    expect(() => new UserPass(client, "foo", ""))
      .toThrowError(new ArgumentError("password"));
  });

  it("should be able to login properly", async () => {
    const userPass = new UserPass(client, "johndoe", "very strong password");

    const token = await userPass.login();

    expect(token).not.toStrictEqual("");
  });
});