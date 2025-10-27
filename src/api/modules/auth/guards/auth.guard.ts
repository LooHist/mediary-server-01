import { UserService } from '@api/modules/users/user.service'
import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'

@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(private readonly userService: UserService) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()

		if (typeof request.session.userId === 'undefined') {
			throw new UnauthorizedException(
				'The user is not authorized. Please log in to gain access.'
			)
		}

		const user = await this.userService.findById(request.session.userId)

		request.user = user

		return true
	}
}
