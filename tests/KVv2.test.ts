import {afterAll, beforeAll, describe, expect, it} from "vitest";
import { RequestClient } from "../src/internal/RequestClient";
import { KVv2 } from "../src/KVv2";
import { ArgumentError, NotFoundError } from "../src/VaultClient";

describe("KVv2", () => {
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
    await client.post("v1/sys/mounts/kvtesting", {
      json: {
        type: "kv",
        options: {
          version: "2"
        }
      }
    });
  });

  afterAll(async () => {
    await client.delete("v1/sys/mounts/kvtesting");
  });

  it("should throw ArgumentError for empty mount path", () => {
    expect(() => new KVv2("", client))
      .toThrowError(new ArgumentError("mountPath"));
  });

  it("should be able to do integrated stuff", async () => {
    const kv = new KVv2("kvtesting", client);

    await kv.put("hello", {value: "world"});
    const firstSecret = await kv.get("hello");

    expect(firstSecret.data).toStrictEqual({value: "world"});

    await kv.patch("hello", {secondValue: "foobar"});

    const secondSecret = await kv.get("hello");

    expect(secondSecret.data).toStrictEqual({value: "world", secondValue: "foobar"});

    await kv.delete("hello");

    expect(kv.get("hello")).rejects.toThrowError(new NotFoundError("hello"));
  });

  it("should throw error on not found key", () => {
    const kv = new KVv2("kvtesting", client);

    expect(kv.get("not-exists"))
      .rejects
      .toThrowError(new NotFoundError("not-exists"));
  });
});