import {IAuth} from "./IAuth";
import {ArgumentError} from "../errors/ArgumentError";
import { RequestClient } from "../internal/RequestClient";

type LDAPLoginResponse = {
  auth: {
    client_token: string;
  };
}
export class LDAP implements IAuth {
  constructor(
    private readonly client: RequestClient,
    private readonly username: string,
    private readonly password: string
  ) {
    if (username === "") throw new ArgumentError("username");
    if (password === "") throw new ArgumentError("password");
  }

  async login(abortSignal?: AbortSignal): Promise<string> {
    const response = await this.client.post<LDAPLoginResponse>("v1/auth/ldap/login/" + this.username, {
      json: {
        password: this.password
      },
      responseType: "json",
      abortSignal: abortSignal
    });

    return response.auth.client_token;
  }
}