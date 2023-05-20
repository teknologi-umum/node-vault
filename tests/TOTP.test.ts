import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {RequestClient} from "../src/internal/RequestClient";
import {TOTP} from "../src/TOTP";
import {ArgumentError, NotFoundError} from "../src";

describe("TOTP", () => {
  const baseUrl: string = process.env.VAULT_ADDRESS ?? "http://localhost:8200/";
  const client = new RequestClient(baseUrl, {
    headers: {
      "X-Vault-Token": process.env?.VAULT_TOKEN ?? "2852e82e-c84c-4a82-8339-61b9ec503816"
    }
  });

  beforeAll(async () => {
    await client.post("v1/sys/mounts/totptesting", {
      json: {
        type: "totp"
      }
    });

    await client.post("v1/totptesting/keys/application-testing", {
      json: {
        generate: true,
        issuer: "Teknologi Umum",
        account_name: "Application"
      }
    });
  });

  afterAll(async () => {
    await client.delete("v1/sys/mounts/totptesting");
  });

  it("should throw ArgumentError for empty mount path", () => {
    expect(() => new TOTP("", client))
      .toThrowError(new ArgumentError("mountPath"));
  });

  it("should be able to generate and validate correct otp code", async () => {
    const totp = new TOTP("totptesting", client);

    const otpCode = await totp.generateCode("application-testing");

    expect(otpCode).toHaveLength(6);

    const validated = await totp.validateCode("application-testing", otpCode);

    expect(validated).toStrictEqual(true);
  });

  it("should failed to validate otp code", async () => {
    const totp = new TOTP("totptesting", client);

    const validated = await totp.validateCode("application-testing", "000000");

    expect(validated).toStrictEqual(false);
  });

  it("should throw an error if an otp key name does not exists", () => {
    const totp = new TOTP("totptesting", client);

    expect(totp.generateCode("not-exists"))
      .rejects
      .toThrowError(new NotFoundError("not-exists"));

    expect(totp.validateCode("not-exists", "000000"))
      .rejects
      .toThrowError(new NotFoundError("not-exists"));
  });
});