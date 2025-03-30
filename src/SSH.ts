import { ArgumentError } from "./errors/ArgumentError";
import { RequestClient } from "./internal/RequestClient";

type GenerateSSHCredentialsResponse = {
  lease_id: string;
  lease_duration: number;
  renewable: boolean;
  data: {
    ip: string;
    key: string;
    key_type: "otp" | "ca";
    port: number;
    username: string;
  }
}

type ListRolesByIpResponse = {
  lease_id: string;
  lease_duration: number;
  renewable: boolean;
  data: {
    roles: string[];
  }
}

type VerifySSHOTPResponse = {
  lease_id: string;
  lease_duration: number;
  renewable: boolean;
  data: {
    ip: string;
    username: string;
  }
}

export class SSH {
  constructor(
    private readonly mountPath: string,
    private readonly client: RequestClient
  ) {
    if (mountPath === "") throw new ArgumentError("mountPath");
  }

  /**
   * This endpoint creates credentials for a specific username and IP with the parameters defined in the given role.
   * @param role Specifies the name of the role to create credentials against.
   * @param ip Specifies the IP of the remote host.
   * @param username  Specifies the username on the remote host.
   * @param signal 
   * @returns 
   * @see https://developer.hashicorp.com/vault/api-docs/secret/ssh#generate-ssh-credentials
   */
  async generateSSHCredentials(role: string, ip: string, username?: string, signal?: AbortSignal): Promise<GenerateSSHCredentialsResponse["data"]> {
    const pathToWrite = `${this.mountPath}/creds/${role}`;
    const body = {
      ip: ip,
      username: username
    };

    const response = await this.client.post<GenerateSSHCredentialsResponse>(`v1/${pathToWrite}`, {
      json: body,
      responseType: "json",
      signal: signal
    });

    return response.data;
  }

  /**
   * This endpoint lists all of the roles with which the given IP is associated.
   * @param ip Specifies the IP of the remote host.
   * @param signal 
   * @returns An array of roles as a secret structure.
   * @see https://developer.hashicorp.com/vault/api-docs/secret/ssh#list-roles-by-ip
   */
  async listRolesByIp(ip: string, keyType: "otp" | "ca", signal?: AbortSignal): Promise<string[]> {
    const pathToWrite = `${this.mountPath}/roles/${ip}`;
    const body = {
      ip: ip,
      key_type: keyType
    };

    const response = await this.client.post<ListRolesByIpResponse>(`v1/${pathToWrite}`, {
      json: body,
      responseType: "json",
      signal: signal
    });

    return response.data.roles;
  }

  /**
   * This endpoint verifies if the given OTP is valid. This is an unauthenticated endpoint.
   * @param otp  Specifies the One-Time-Key that needs to be validated.
   * @param signal 
   * @returns 
   * @see https://developer.hashicorp.com/vault/api-docs/secret/ssh#verify-ssh-otp
   */
  async verifySSHOTP(otp: string, signal?: AbortSignal): Promise<VerifySSHOTPResponse["data"]> {
    const pathToWrite = `${this.mountPath}/verify`;
    const body = {
      otp: otp
    };

    const response = await this.client.post<VerifySSHOTPResponse>(`v1/${pathToWrite}`, {
      json: body,
      responseType: "json",
      signal: signal
    });

    return response.data;
  }
}