export type CommonResponse<T> = {
  success: boolean;
  data?: T;
  errors: { code: number; message: string }[];
};

export function createSuccessResponse<T>(data: T): CommonResponse<T> {
  return {
    success: true,
    data,
    errors: [],
  };
}

export function createErrorResponse(code: number, message: string): CommonResponse<null> {
  return {
    success: false,
    errors: [{ code, message }],
  };
}
