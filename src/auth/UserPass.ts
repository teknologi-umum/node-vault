import {IAuth} from "./IAuth";
import {ArgumentError} from "../errors/ArgumentError";
import {RequestClient} from "../internal/RequestClient";

type UserPassLoginResponse = {
  auth: {
    client_token: string;
  };
}

export class UserPass implements IAuth {
  constructor(
    private readonly client: RequestClient,
    private readonly username: string,
    private readonly password: string
  ) {
    if (username === "") throw new ArgumentError("username");
    if (password === "") throw new ArgumentError("password");
  }

  async login(abortSignal?: AbortSignal): Promise<string> {
    const response = await this.client.post<UserPassLoginResponse>("v1/auth/userpass/login/" + this.username, {
      json: {
        password: this.password
      },
      responseType: "json",
      signal: abortSignal
    });

    return response.auth.client_token;
  }
}