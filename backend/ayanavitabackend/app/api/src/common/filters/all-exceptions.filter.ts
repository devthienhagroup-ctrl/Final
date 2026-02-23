import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = isHttp
      ? exception.getResponse()
      : { message: "Internal server error" };

    // ✅ LOG FULL ERROR (đây là cái bạn đang thiếu)
    // eslint-disable-next-line no-console
    console.error("=== UNCAUGHT EXCEPTION ===");
    // eslint-disable-next-line no-console
    console.error("URL:", (req as any)?.method, (req as any)?.url);
    // eslint-disable-next-line no-console
    console.error(exception);

    res.status(status).json(
      typeof payload === "string"
        ? { statusCode: status, message: payload }
        : payload,
    );
  }
}
