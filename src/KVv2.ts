import {ArgumentError} from "./errors/ArgumentError";
import {Metadata, Secret} from "./Secrets";
import {NotFoundError} from "./errors/NotFoundError";
import { HTTPError, RequestClient } from "./internal/RequestClient";

type ReadResponse = {
  data: Secret;
}

type CreateResponse = {
  data: Metadata;
}

type PatchResponse = {
  data: Metadata;
}


export class KVv2 {
  constructor(
    private readonly mountPath: string,
    private readonly client: RequestClient
  ) {
    if (mountPath === "") throw new ArgumentError("mountPath");
  }

  /**
     *
     * @param secretPath
     * @param version Will acquire the latest version if left undefined
     * @param abortSignal
     * @see https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-version
     */
  async get(secretPath: string, version?: number, abortSignal?: AbortSignal): Promise<Secret> {
    const pathToRead = `${this.mountPath}/data/${secretPath}`;

    try {
      const response = await this.client.get<ReadResponse>(`v1/${pathToRead}`, {
        responseType: "json",
        searchParams: {
          version: version?.toString()
        },
        signal: abortSignal
      });

      return response.data;
    } catch (error: unknown) {
      if (error instanceof HTTPError) {
        if (error.statusCode === 404) {
          throw new NotFoundError(secretPath);
        }
      }

      // Rethrow error
      throw error;
    }
  }

  /**
     *
     * @param secretPath
     * @param data
     * @param abortSignal
     * @see https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#create-update-secret
     */
  async put(secretPath: string, data: Record<string, unknown>, abortSignal?: AbortSignal): Promise<Metadata> {
    const pathToWrite = `${this.mountPath}/data/${secretPath}`;

    const response = await this.client.post<CreateResponse>(`v1/${pathToWrite}`, {
      json: {
        data: data
      },
      responseType: "json",
      signal: abortSignal
    });

    return response.data;
  }

  /**
     *
     * @param secretPath
     * @param data
     * @param abortSignal
     * @see https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#patch-secret
     */
  async patch(secretPath: string, data: Record<string, unknown>, abortSignal?: AbortSignal): Promise<Metadata> {
    const pathToWrite = `${this.mountPath}/data/${secretPath}`;

    const response = await this.client.patch<PatchResponse>(`v1/${pathToWrite}`, {
      json: {
        data: data
      },
      headers: {
        "Content-Type": "application/merge-patch+json"
      },
      responseType: "json",
      signal: abortSignal

    });

    return response.data;
  }

  /**
     *
     * @param secretPath
     * @param abortSignal
     * @see https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#delete-latest-version-of-secret
     */
  async delete(secretPath: string, abortSignal?: AbortSignal): Promise<void> {
    const pathToDelete = `${this.mountPath}/data/${secretPath}`;

    await this.client.delete(`v1/${pathToDelete}`, { signal: abortSignal });
  }
}