import http from "http";
import https from "https";
import { ArgumentError } from "../errors/ArgumentError";

export type RequestOptions = {
  json?: Record<string, unknown>,
  searchParams?: Record<string, string | string[]>,
  responseType?: "text" | "json",
  headers?: Record<string, string>,
  abortSignal?: AbortSignal
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
    private readonly secure: boolean = false,
    private defaultRequestOptions?: http.RequestOptions | https.RequestOptions,
    private readonly maximumRetry?: number
  ) {
    if (this.maximumRetry < 0) throw new ArgumentError("maximumRetry must not be less than zero");
  }

  get<T = unknown>(url: URL | string, options?: RequestOptions): Promise<T> {
    let parsedUrl;
    if (typeof url === "string") {
      parsedUrl = new URL(url);
    } else {
      parsedUrl = url;
    }

    return this.send(Method.Get, parsedUrl, options);
  }

  post<T = unknown>(url: URL | string, options?: RequestOptions): Promise<T> {
    let parsedUrl;
    if (typeof url === "string") {
      parsedUrl = new URL(url);
    } else {
      parsedUrl = url;
    }

    return this.send(Method.Post, parsedUrl, options);
  }

  put<T = unknown>(url: URL | string, options?: RequestOptions): Promise<T> {
    let parsedUrl;
    if (typeof url === "string") {
      parsedUrl = new URL(url);
    } else {
      parsedUrl = url;
    }

    return this.send(Method.Put, parsedUrl, options);
  }

  patch<T = unknown>(url: URL | string, options?: RequestOptions): Promise<T> {
    let parsedUrl;
    if (typeof url === "string") {
      parsedUrl = new URL(url);
    } else {
      parsedUrl = url;
    }

    return this.send(Method.Patch, parsedUrl, options);
  }

  delete<T = unknown>(url: URL | string, options?: RequestOptions): Promise<T> {
    let parsedUrl;
    if (typeof url === "string") {
      parsedUrl = new URL(url);
    } else {
      parsedUrl = url;
    }

    return this.send(Method.Delete, parsedUrl, options);
  }


  private send<T>(method: Method, url: URL, options?: RequestOptions & {responseType: "json"}): Promise<T>
  private send<T = string>(method: Method, url: URL, options?: RequestOptions & { responseType: "text" }): Promise<T>
  private send<T = unknown>(method: Method, url: URL, options?: RequestOptions): Promise<T>
  private send<T = unknown>(method: Method, url: URL, options?: RequestOptions): Promise<T> {
    // Build request parameters
    const finalUrl: URL = url;
    let requestBody = "";
    let requestOptions: http.RequestOptions | https.RequestOptions = {
      ...this.defaultRequestOptions,
      method: method
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
        for (const [key, value] of Object.entries(options.searchParams)) {
          if (typeof value === "string") {
            finalUrl.searchParams.set(key, value);
            continue;
          }

          for (const value2 of value) {
            finalUrl.searchParams.set(key, value2);
          }
        }
      }

      if (options.responseType === "json") {
        requestOptions = {
          ...requestOptions,
          headers: {
            ...requestOptions?.headers,
            "Accept": "application/json"
          }
        };
      }

      if (options.abortSignal !== undefined) {
        requestOptions = {
          ...requestOptions,
          signal: options.abortSignal
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
    
    // Prepare response variables
    let request: http.ClientRequest;
    let responseBody = "";
    let responseStatusCode: number;
    let parsedResponseBody: T;

    return new Promise((resolve, reject) => {
      if (this.secure) {
        // Use https
        request = https.request(finalUrl, requestOptions, (res: http.IncomingMessage) => {
          responseStatusCode = res.statusCode;
          res.on("data", (chunk) => {
            responseBody += chunk;
          });

          res.on("error", (err: Error) => {
            if (err.message === "Error: aborted") {
              return reject(new RequestAbortedError(err.message));
            }
    
            return reject(new UnhandledRequestError(err.message));
          });
      
  
          res.on("end", () => {
            if (responseBody !== "") {
              if (options.responseType === "json") {
                parsedResponseBody = JSON.parse(responseBody) as T;
                return;
              }

              parsedResponseBody = responseBody as T;
            }
          });
        });
      } else {
        request = http.request(finalUrl, requestOptions, (res: http.IncomingMessage) => {
          responseStatusCode = res.statusCode;
          res.on("data", (chunk) => {
            responseBody += chunk;
          });

          
          res.on("error", (err: Error) => {
            if (err.message === "Error: aborted") {
              return reject(new RequestAbortedError(err.message));
            }

            return reject(new UnhandledRequestError(err.message));
          });
  
          res.on("end", () => {
            if (responseBody !== "") {
              if (options.responseType === "json") {
                parsedResponseBody = JSON.parse(responseBody) as T;
                return;
              }

              parsedResponseBody = responseBody as T;
            }
          });
        });
      }


      request.on("error", (err: Error) => {
        if (err.message === "Error: aborted") {
          return reject(new RequestAbortedError(err.message));
        }

        return reject(new UnhandledRequestError(err.message));
      });
      

      if (requestBody !== "") {
        request.write(requestBody);
      }
  
      request.end(() => {
        if (responseStatusCode >= 400) {
          reject(new HTTPError(responseStatusCode, responseBody, "non-2xx response"));
          return;
        }
      
        resolve(parsedResponseBody);
      });
    });
  }
}

