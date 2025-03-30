import { ArgumentError } from "./errors/ArgumentError";
import { RequestClient } from "./internal/RequestClient";

type GenerateSSHCredentialsResponse = {
  lease_id: string;
  lease_duration: number;
  renewable: boolean;
  data: {
    ip: string;
    key: string;
    key_type: string;
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

  async listRolesByIp(ip: string, signal?: AbortSignal): Promise<string[]> {
    const pathToWrite = `${this.mountPath}/roles/${ip}`;
    const body = {
      ip: ip
    };

    const response = await this.client.post<ListRolesByIpResponse>(`v1/${pathToWrite}`, {
      json: body,
      responseType: "json",
      signal: signal
    });

    return response.data.roles;
  }

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