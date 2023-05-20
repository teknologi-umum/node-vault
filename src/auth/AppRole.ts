import {IAuth} from "./IAuth";
import {ArgumentError} from "../errors/ArgumentError";
import { RequestClient } from "../internal/RequestClient";

type AppRoleLoginResponse = {
  auth: {
    client_token: string;
  };
}

export class AppRole implements IAuth {
  constructor(
    private readonly client: RequestClient,
    private readonly roleId: string,
    private readonly secretId: string
  ) {
    if (roleId === "") throw new ArgumentError("roleId");
    if (secretId === "") throw new ArgumentError("secretId");
  }

  async login(abortSignal?: AbortSignal): Promise<string> {
    const response = await this.client.post<AppRoleLoginResponse>("v1/auth/approle/login", {
      json: {
        role_id: this.roleId,
        secret_id: this.secretId
      },
      responseType: "json",
      signal: abortSignal
    });

    return response.auth.client_token;
  }
}