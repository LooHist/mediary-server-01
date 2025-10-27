import {
	ArgumentsHost,
	BadRequestException,
	Catch,
	ExceptionFilter
} from '@nestjs/common'
import { Response } from 'express'

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
	catch(exception: BadRequestException, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		const status = exception.getStatus()
		const exceptionResponse = exception.getResponse()

		// Перетворюємо помилки валідації в зручний формат
		let errors: string[] = []

		if (
			typeof exceptionResponse === 'object' &&
			'message' in exceptionResponse
		) {
			const messages = (exceptionResponse as any).message
			errors = Array.isArray(messages) ? messages : [messages]
		} else if (typeof exceptionResponse === 'string') {
			errors = [exceptionResponse]
		}

		response.status(status).json({
			statusCode: status,
			timestamp: new Date().toISOString(),
			message: 'Validation failed',
			errors
		})
	}
}


