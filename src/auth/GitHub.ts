import {ArgumentError} from "../VaultClient";
import {RequestClient} from "../internal/RequestClient";
import {IAuth} from "./IAuth";

type GitHubLoginResponse = {
  auth: {
    client_token: string;
  };
}

export class GitHub implements IAuth {
  constructor(
    private readonly client: RequestClient,
    private readonly personalToken: string
  ) {
    if (personalToken === "") throw new ArgumentError("personalToken");
  }

  async login(abortSignal?: AbortSignal): Promise<string> {
    const response = await this.client.post<GitHubLoginResponse>("v1/auth/github/login", {
      json: {
        token: this.personalToken
      },
      responseType: "json",
      signal: abortSignal
    });

    return response.auth.client_token;
  }
}