export interface IApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
}
