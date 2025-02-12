export class ApiResponse<T> {
  status: boolean; // true para éxito, false para error
  data?: T;
  message?: string;

  constructor(status: boolean, data?: T, message?: string) {
    this.status = status;
    this.data = data;
    this.message = message;
  }
}

export class ResponseUtil {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(true, data, message); // true indica éxito
  }

  static error<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse(false, data, message); // false indica error
  }
}
