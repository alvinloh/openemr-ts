export class ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  static ok<T>(data: T): ApiResponse<T> {
    const response = new ApiResponse<T>();
    response.data = data;
    return response;
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): ApiResponse<T[]> {
    const response = new ApiResponse<T[]>();
    response.data = data;
    response.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
    return response;
  }
}
