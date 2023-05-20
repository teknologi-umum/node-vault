import {ArgumentError} from "./errors/ArgumentError";
import {NotFoundError} from "./errors/NotFoundError";
import {HTTPError, RequestClient} from "./internal/RequestClient";

type GenerateResponse = {
  data: {
    code: string;
  };
}

type ValidateResponse = {
  data: {
    valid: boolean;
  };
}

export class TOTP {
  constructor(
    private readonly mountPath: string,
    private readonly client: RequestClient
  ) {
    if (mountPath === "") throw new ArgumentError("mountPath");
  }

  /**
   *
   * @param name
   * @param abortSignal
   * @see https://developer.hashicorp.com/vault/api-docs/secret/totp#generate-code
   */
  async generateCode(name: string, abortSignal?: AbortSignal): Promise<string> {
    const pathToRead = `${this.mountPath}/code/${name}`;

    try {
      const response = await this.client.get<GenerateResponse>(
        `v1/${pathToRead}`,
        {
          responseType: "json",
          signal: abortSignal
        }
      );

      return response.data.code;
    } catch (error: unknown) {
      if (error instanceof HTTPError) {
        if (error.statusCode === 400) {
          throw new NotFoundError(name);
        }
      }

      // Rethrow error
      throw error;
    }
  }

  /**
   *
   * @param name
   * @param code
   * @param abortSignal
   * @see https://developer.hashicorp.com/vault/api-docs/secret/totp#validate-code
   */
  async validateCode(name: string, code: string, abortSignal?: AbortSignal): Promise<boolean> {
    const pathToRead = `${this.mountPath}/code/${name}`;

    try {
      const response = await this.client.post<ValidateResponse>(
        `v1/${pathToRead}`,
        {
          responseType: "json",
          json: {
            code: code
          },
          signal: abortSignal
        }
      );

      return response.data.valid;
    } catch (error: unknown) {
      if (error instanceof HTTPError) {
        if (error.statusCode === 400) {
          throw new NotFoundError(name);
        }
      }

      // Rethrow error
      throw error;
    }
  }
}