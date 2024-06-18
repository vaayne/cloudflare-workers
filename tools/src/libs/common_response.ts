import { z } from "@hono/zod-openapi";

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

export function createErrorResponse(
    code: number,
    message: string
): CommonResponse<null> {
    return {
        success: false,
        errors: [{ code, message }],
    };
}

export function buildCommonResponseSchema(dataSchema: any) {
    return z.object({
        success: z.boolean().openapi({ example: true }),
        data: dataSchema,
        errors: z
            .array(
                z.object({
                    code: z.number().openapi({ example: 500 }),
                    message: z.string().openapi({ example: "error messages" }),
                })
            )
            .openapi("ErrorResponse"),
    });
}
