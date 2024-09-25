export enum ApiResponseMessageOptions {
    Success = 'success',
}
export interface IApiResponse<T> {
  message: ApiResponseMessageOptions;
  data: T;
}
