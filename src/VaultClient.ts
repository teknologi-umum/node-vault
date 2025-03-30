import {type Agent as HttpAgent} from "http";
import {type Agent as HttpsAgent} from "https";
import {KVv2} from "./KVv2";
import {AppRole} from "./auth/AppRole";
import {LDAP} from "./auth/LDAP";
import {UserPass} from "./auth/UserPass";
import {TOTP} from "./TOTP";
import {RequestClient, RequestOptions} from "./internal/RequestClient";
import { SSH } from "./SSH";

type ClientOptions = {
  address: string;
  maximumRetry: number;
  timeoutMillisecond: number;
  agent: HttpAgent | HttpsAgent;
  secure: boolean
};

export const DEFAULT_CONFIG: ClientOptions = {
  address: "http://localhost:8200",
  maximumRetry: 3,
  timeoutMillisecond: 60_000,
  agent: undefined,
  secure: false
};

export class VaultClient {
  private readonly _baseUrl: URL;
  private readonly _maximumRetry: number;
  private readonly _timeout: number;
  private _token?: string;
  private _defaultRequestOptions: RequestOptions;
  private _client: RequestClient;

  constructor(options: Partial<ClientOptions>) {
    this._baseUrl = new URL(options.address ?? DEFAULT_CONFIG.address);
    this._maximumRetry = options.maximumRetry ?? DEFAULT_CONFIG.maximumRetry;
    this._timeout = options.timeoutMillisecond ?? DEFAULT_CONFIG.timeoutMillisecond;

    this._defaultRequestOptions = {
      timeout: this._timeout,
      headers: {
        "X-Vault-Token": this._token
      }
    };

    this._client = new RequestClient(
      this._baseUrl.toString(),
      this._defaultRequestOptions,
      this._maximumRetry
    );
  }

  public setToken(token: string) {
    this._token = token;
    this._defaultRequestOptions = {
      ...this._defaultRequestOptions,
      headers: {
        ...this._defaultRequestOptions.headers,
        "X-Vault-Token": token
      }
    };

    this._client = new RequestClient(
      this._baseUrl.toString(),
      this._defaultRequestOptions,
      this._maximumRetry
    );
  }

  public kvv2(mountPath: string): KVv2 {
    return new KVv2(mountPath, this._client);
  }

  public totp(mountPath: string): TOTP {
    return new TOTP(mountPath, this._client);
  }

  public ssh(mountPath: string): SSH {
    return new SSH(mountPath, this._client);
  }

  public appRoleAuth(roleId: string, secretId: string): AppRole {
    return new AppRole(this._client, roleId, secretId);
  }

  public ldapAuth(username: string, password: string): LDAP {
    return new LDAP(this._client, username, password);
  }

  public userPassAuth(username: string, password: string): UserPass {
    return new UserPass(this._client, username, password);
  }
}

export * from "./errors/ArgumentError";
export * from "./errors/NotFoundError";

export default VaultClient;