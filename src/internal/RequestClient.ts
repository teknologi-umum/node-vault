import { request } from "undici";
import { ArgumentError } from "../errors/ArgumentError";

export type RequestOptions = {
  json?: Record<string, unknown>,
  searchParams?: Record<string, string | string[]>,
  responseType?: "text" | "json",
  headers?: Record<string, string>,
  signal?: AbortSignal,
  timeout?: number
}

enum Method {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Patch = "PATCH",
  Delete = "DELETE"
}

export class RequestAbortedError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "RequestAbortedError";
  }
}

export class UnhandledRequestError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "UnhandledRequestError";
  }
}

export class HTTPError extends Error {
  constructor(public readonly statusCode: number, public readonly responseBody: string, message: string) {
    super(message);

    this.name = "HTTPError";
  }
}

export class RequestClient {
  constructor(
    private readonly baseURL: string,
    private defaultRequestOptions?: RequestOptions,
    private readonly maximumRetry?: number
  ) {
    if (this.maximumRetry < 0) throw new ArgumentError("maximumRetry must not be less than zero");
  }

  get<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    return this.send(Method.Get, url, options);
  }

  post<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    return this.send(Method.Post, url, options);
  }

  put<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    return this.send(Method.Put, url, options);
  }

  patch<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    return this.send(Method.Patch, url, options);
  }

  delete<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    return this.send(Method.Delete, url, options);
  }


  private send<T>(method: Method, url: string, options?: RequestOptions & { responseType: "json" }): Promise<T>
  private send<T = string>(method: Method, url: string, options?: RequestOptions & { responseType: "text" }): Promise<T>
  private send<T = unknown>(method: Method, url: string, options?: RequestOptions): Promise<T>
  private async send<T = unknown>(method: Method, url: string, options?: RequestOptions): Promise<T> {
    // Build request parameters
    const finalUrl = new URL(url, this.baseURL);
    let requestBody: string | null = null;
    let requestOptions: RequestOptions = {
      ...this.defaultRequestOptions,
      responseType: options?.responseType
    };

    if (options !== undefined) {
      if (options.json !== undefined) {
        requestBody = JSON.stringify(options.json);
        
        requestOptions = {
          ...requestOptions,
          headers: {
            ...requestOptions?.headers,
            "Content-Type": "application/json"
          }
        };
      }

      if (options.searchParams !== undefined) {
        requestOptions = {
          ...requestOptions,
          searchParams: {
            ...requestOptions?.searchParams,
            ...options.searchParams
          }
        };

        for (const [key, value] of Object.entries(requestOptions.searchParams)) {
          if (typeof value === "string") {
            finalUrl.searchParams.set(key, value);
            continue;
          }

          if (Array.isArray(value)) {
            for (const value2 of value) {
              finalUrl.searchParams.set(key, value2);
            }
          }
        }
      }

      if (options?.responseType === "json") {
        requestOptions = {
          ...requestOptions,
          headers: {
            ...requestOptions?.headers,
            "Accept": "application/json"
          }
        };
      }

      if (options.signal !== undefined) {
        requestOptions = {
          ...requestOptions,
          signal: options.signal
        };
      }

      if (options.headers !== undefined) {
        requestOptions = {
          ...requestOptions,
          headers: {
            ...requestOptions?.headers,
            ...options.headers
          }
        };
      }
    }

    const response = await request(finalUrl, {
      method: method,
      signal: requestOptions?.signal,
      body: requestBody,
      headers: requestOptions?.headers ?? null,
      bodyTimeout: requestOptions?.timeout ?? null,
      throwOnError: false
    });

    if (response.statusCode >= 400) {
      const responseBody = await response.body.text();
      throw new HTTPError(
        response.statusCode,
        responseBody,
        `Received response with non successful status code of ${response.statusCode} while requesting to ${method} ${finalUrl.toString()}: ${responseBody}`
      );
    }

    if (requestOptions?.responseType === "json") {
      const responseBody = await response.body.json() as T;
      return responseBody;
    }

    if (requestOptions?.responseType === "text") {
      const responseBody = await response.body.text() as T;
      return responseBody;
    }

    // Does not expect a response body
    return undefined;
  }
}

