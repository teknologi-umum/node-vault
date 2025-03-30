import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RequestClient } from "../src/internal/RequestClient";
import { SSH } from "../src/SSH";
import { ArgumentError } from "../src";

describe("SSH", () => {
  const baseUrl: string = process.env.VAULT_ADDRESS ?? "http://localhost:8200/";
  const client = new RequestClient(baseUrl, {
    headers: {
      "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
    }
  });

  beforeAll(async () => {
    await client.post("v1/sys/mounts/ssh", {
      json: {
        type: "ssh"
      }
    });
  
    await client.post("v1/ssh/roles/contoso", {
      json: {
        default_user: "ubuntu",
        port: 22,
        cidr_list: "10.100.0.0/24",
        key_type: "otp"
      }
    });
  });

  afterAll(async () => {
    await client.delete("v1/sys/mounts/ssh");
  });

  it("should throw ArgumentError for empty mount path", () => {
    expect(() => new SSH("", client))
      .toThrowError(new ArgumentError("mountPath"));
  });

  it("should be able to generate and verify ssh credentials", async () => {
    const ssh = new SSH("ssh", client);

    const credentials = await ssh.generateSSHCredentials("contoso", "10.100.0.1", "ubuntu");

    expect(credentials).toMatchObject({
      ip: "10.100.0.1",
      key_type: "otp",
      port: 22,
      username: "ubuntu"
    });

    const verified = await ssh.verifySSHOTP(credentials.key);

    expect(verified).toMatchObject({
      ip: "10.100.0.1",
      username: "ubuntu"
    });
  });

  it("should be able to list roles by ip", async () => {
    const ssh = new SSH("ssh", client);

    const roles = await ssh.listRolesByIp("10.100.0.1");

    expect(roles).toStrictEqual(["contoso"]);
  });
});