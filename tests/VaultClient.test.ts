import {afterAll, beforeAll, describe, it, expect} from "vitest";
import { RequestClient } from "../src/internal/RequestClient";
import { VaultClient, NotFoundError } from "../src/VaultClient";

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

describe("VaultClient", () => {
  const baseUrl: string = process.env.VAULT_ADDRESS ?? "http://localhost:8200/";

  const internalClient = new RequestClient(
    baseUrl,
    false,
    {
      headers: {
        "X-Vault-Token": process.env.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
      }
    } 
  );

  let roleId = "";
  let secretId = "";

  beforeAll(async () => {
    await Promise.all([
      // Enable kvapprole and kvuserpass secret engine using KVv2
      internalClient.post("v1/sys/mounts/kvapprole", {
        json: {
          type: "kv",
          options: {
            version: "2"
          }
        }
      }),

      internalClient.post("v1/sys/mounts/kvuserpass", {
        json: {
          type: "kv",
          options: {
            version: "2"
          }
        }
      }),

      // Enable the TOTP engine using approle and userpass
      internalClient.post("v1/sys/mounts/totpapprole", {
        json: {
          type: "totp"
        }
      }),

      internalClient.post("v1/sys/mounts/totpuserpass", {
        json: {
          type: "totp"
        }
      }),

      // Enable AppRole and Username-password authentication mechanism
      internalClient.post("v1/sys/auth/approle", {
        json: {
          type: "approle"
        }
      }),

      internalClient.post("v1/sys/auth/userpass", {
        json: {
          type: "userpass"
        }
      }),

      internalClient.post("v1/sys/policy/anything", {
        json: {
          policy: "# Read system health check\n" +
                        "path \"sys/health\" {\n" +
                        "  capabilities = [\"read\", \"sudo\"]\n" +
                        "}\n" +
                        "\n" +
                        "# Manage auth methods broadly across Vault\n" +
                        "path \"auth/*\" {\n" +
                        "  capabilities = [\"create\", \"read\", \"update\", \"delete\", \"list\", \"sudo\"]\n" +
                        "}\n" +
                        "\n" +
                        "path \"kvapprole/*\" {\n" +
                        "  capabilities = [\"create\", \"read\", \"update\", \"patch\", \"delete\", \"list\", \"sudo\"]\n" +
                        "}\n" +
                        "\n" +
                        "path \"kvuserpass/*\" {\n" +
                        "  capabilities = [\"create\", \"read\", \"update\", \"patch\", \"delete\", \"list\", \"sudo\"]\n" +
                        "}\n" +
                        "\n" +
                        "path \"totpapprole/*\" {\n" +
                        "  capabilities = [\"create\", \"read\", \"update\", \"patch\", \"delete\", \"list\", \"sudo\"]\n" +
                        "}\n" +
                        "\n" +
                        "path \"totpuserpass/*\" {\n" +
                        "  capabilities = [\"create\", \"read\", \"update\", \"patch\", \"delete\", \"list\", \"sudo\"]\n" +
                        "}"
        }
      })
    ]);

    // Create a role for AppRole
    await internalClient.post("v1/auth/approle/role/vaultclienttest", {
      json: {
        policies: "anything",
        token_policies: "anything",
        token_type: "service"
      }
    });

    // Acquire Role ID and Secret ID for AppRole authentication method
    const [roleIdResponse, secretIdResponse] = await Promise.all([
      internalClient.get<ReadRoleIdResponse>("v1/auth/approle/role/vaultclienttest/role-id", {
        responseType: "json"
      }),

      internalClient.post<ReadSecretIdResponse>("v1/auth/approle/role/vaultclienttest/secret-id", {
        responseType: "json"
      }),
            
      // And add annedoe user.
      internalClient.post("v1/auth/userpass/users/annedoe", {
        json: {
          password: "very strong password",
          policies: "anything",
          token_policies: "anything"
        }
      })
    ]); 

    roleId = roleIdResponse.data.role_id;

    secretId = secretIdResponse.data.secret_id;
  });

  afterAll(async () => {
    await Promise.all([
      internalClient.delete("v1/sys/mounts/kvapprole"),
            
      internalClient.delete("v1/sys/mounts/kvuserpass"),

      internalClient.delete("v1/sys/mounts/totpapprole"),

      internalClient.delete("v1/sys/mounts/totpuserpass"),

      internalClient.delete("v1/auth/approle/role/vaultclienttest"),

      internalClient.delete("v1/auth/userpass/users/annedoe")
    ]);

    await Promise.all([
      internalClient.delete("v1/sys/policy/anything"),

      internalClient.delete("v1/sys/auth/approle"),
    
      internalClient.delete("v1/sys/auth/userpass")
    ]);
  });

  it("should be able to do kv things with userpass", async () => {
    const client = new VaultClient({address: process.env.VAULT_ADDRESS ?? "http://localhost:8200/"});

    const userPassAuth = client.userPassAuth("annedoe", "very strong password");

    const vaultToken = await userPassAuth.login();

    client.setToken(vaultToken);

    const kv = client.kvv2("kvuserpass");

    await kv.put("hello", {value: "world"});
    const firstSecret = await kv.get("hello");

    expect(firstSecret.data).toStrictEqual({value: "world"});

    await kv.patch("hello", {secondValue: "foobar"});

    const secondSecret = await kv.get("hello");

    expect(secondSecret.data).toStrictEqual({value: "world", secondValue: "foobar"});

    await kv.delete("hello");

    expect(kv.get("hello")).rejects.toThrowError(new NotFoundError("hello"));
  });

  it("should be able to do kv things with approle", async () => {
    const client = new VaultClient({ address: process.env.VAULT_ADDRESS ?? "http://localhost:8200/" });

    const appRoleAuth = client.appRoleAuth(roleId, secretId);

    const vaultToken = await appRoleAuth.login();

    client.setToken(vaultToken);

    const kv = client.kvv2("kvapprole");

    await kv.put("hello", {value: "world"});
    const firstSecret = await kv.get("hello");

    expect(firstSecret.data).toStrictEqual({value: "world"});

    await kv.patch("hello", {secondValue: "foobar"});

    const secondSecret = await kv.get("hello");

    expect(secondSecret.data).toStrictEqual({value: "world", secondValue: "foobar"});

    await kv.delete("hello");

    expect(kv.get("hello")).rejects.toThrowError(new NotFoundError("hello"));
  });

  it("should be able to do totp things with userpass", async () => {
    const client = new VaultClient({address: process.env.VAULT_ADDRESS ?? "http://localhost:8200/"});

    const userPassAuth = client.userPassAuth("annedoe", "very strong password");

    const vaultToken = await userPassAuth.login();

    client.setToken(vaultToken);

    await internalClient.post("v1/totpuserpass/keys/application-testing", {
      json: {
        generate: true,
        issuer: "Teknologi Umum",
        account_name: "Application"
      }
    });

    const totp = client.totp("totpuserpass");

    const otpCode = await totp.generateCode("application-testing");

    expect(otpCode).toHaveLength(6);

    const validated = await totp.validateCode("application-testing", otpCode);

    expect(validated).toStrictEqual(true);
  });

  it("should be able to do totp things with approle", async () => {
    const client = new VaultClient({ address: process.env.VAULT_ADDRESS ?? "http://localhost:8200/" });

    const appRoleAuth = client.appRoleAuth(roleId, secretId);

    const vaultToken = await appRoleAuth.login();

    client.setToken(vaultToken);

    await internalClient.post("v1/totpapprole/keys/application-testing", {
      json: {
        generate: true,
        issuer: "Teknologi Umum",
        account_name: "Application"
      }
    });

    const totp = client.totp("totpapprole");

    const otpCode = await totp.generateCode("application-testing");

    expect(otpCode).toHaveLength(6);

    const validated = await totp.validateCode("application-testing", otpCode);

    expect(validated).toStrictEqual(true);
  });
});