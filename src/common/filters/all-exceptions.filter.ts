import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name)

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		const request = ctx.getRequest<Request>()

		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR

		const message =
			exception instanceof HttpException
				? exception.message
				: 'Internal server error'

		const errorResponse = {
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			method: request.method,
			message,
			...(process.env.NODE_ENV === 'development' && {
				stack: exception instanceof Error ? exception.stack : undefined
			})
		}

		// Log critical errors
		if (status >= 500) {
			this.logger.error(
				`${request.method} ${request.url}`,
				JSON.stringify(errorResponse),
				exception instanceof Error ? exception.stack : undefined
			)
		} else {
			// Don't log 401 errors for /users/profile as it's expected behavior during session check
			const isUnauthorizedSessionCheck =
				status === HttpStatus.UNAUTHORIZED &&
				request.url === '/users/profile' &&
				request.method === 'GET'

			if (!isUnauthorizedSessionCheck) {
				this.logger.warn(
					`${request.method} ${request.url}`,
					JSON.stringify(errorResponse)
				)
			}
		}

		response.status(status).json(errorResponse)
	}
}


