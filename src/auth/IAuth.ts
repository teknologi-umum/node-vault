export interface IAuth {
  login(abortSignal?: AbortSignal): Promise<string>;
}