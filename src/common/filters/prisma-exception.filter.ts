import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpStatus,
	Logger
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { Response } from 'express'

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(PrismaExceptionFilter.name)

	catch(
		exception: Prisma.PrismaClientKnownRequestError,
		host: ArgumentsHost
	) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()

		let status = HttpStatus.INTERNAL_SERVER_ERROR
		let message = 'Database error occurred'

		switch (exception.code) {
			case 'P2002':
				// Unique constraint violation
				status = HttpStatus.CONFLICT
				const target = exception.meta?.target as string[] | undefined
				const field = target ? target.join(', ') : 'field'
				message = `Duplicate entry: ${field} already exists`
				break

			case 'P2025':
				// Record not found
				status = HttpStatus.NOT_FOUND
				message = 'Record not found'
				break

			case 'P2003':
				// Foreign key constraint failed
				status = HttpStatus.BAD_REQUEST
				message = 'Related record not found'
				break

			case 'P2014':
				// Required relation violation
				status = HttpStatus.BAD_REQUEST
				message =
					'The change you are trying to make would violate a required relation'
				break

			case 'P2016':
				// Query interpretation error
				status = HttpStatus.BAD_REQUEST
				message = 'Query interpretation error'
				break

			case 'P2021':
				// Table does not exist
				status = HttpStatus.INTERNAL_SERVER_ERROR
				message = 'Database table does not exist'
				break

			case 'P2022':
				// Column does not exist
				status = HttpStatus.INTERNAL_SERVER_ERROR
				message = 'Database column does not exist'
				break

			default:
				this.logger.error(
					`Unhandled Prisma error: ${exception.code}`,
					exception.stack
				)
				message = 'Database operation failed'
		}

		const errorResponse = {
			statusCode: status,
			message,
			timestamp: new Date().toISOString(),
			...(process.env.NODE_ENV === 'development' && {
				details: exception.message,
				code: exception.code
			})
		}

		response.status(status).json(errorResponse)
	}
}


