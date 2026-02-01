import { normalizeTitle } from '@common/utils'
import { PrismaService } from '@database/prisma'
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { MediaRequest, MediaSource, ModerationType, Prisma, UserRole } from '@prisma/client'

import { CreateMediaRequestDto, UpdateRequestDto } from '../dto'
import { MediaRequestValidationService } from '../validation'

@Injectable()
export class MediaRequestCrudService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly validationService: MediaRequestValidationService
	) {}

	/** Create a new media request **/
	async create(
		userId: string,
		createRequestDto: CreateMediaRequestDto
	): Promise<MediaRequest> {
		const {
			mediaData,
			collectionId,
			source = MediaSource.CUSTOM
		} = createRequestDto

		// Check if collection exists
		const collection = await this.prisma.collection.findUnique({
			where: { id: collectionId }
		})

		if (!collection) {
			throw new BadRequestException('Collection not found')
		}

		// For user requests, only CUSTOM source is allowed
		// If there's a TMDB ID, media can be added directly via global search (addFromSearch),
		// so requests are only needed for media without external IDs (CUSTOM)
		const finalSource = source || MediaSource.CUSTOM
		if (finalSource !== MediaSource.CUSTOM) {
			throw new BadRequestException(
				'User requests only support CUSTOM source. Media with TMDB can be added directly via global search.'
			)
		}

		// Normalize title for duplicate search
		const searchableTitle = normalizeTitle(mediaData.title)

		// Check if media with such data already exists
		const existingMedia = await this.validationService.checkExistingMedia(
			searchableTitle,
			finalSource,
			collectionId
		)
		if (existingMedia) {
			throw new BadRequestException({
				message: 'Media already exists in the system',
				existingMedia: {
					id: existingMedia.id,
					title: (existingMedia.mediaData as any).title,
					year: (existingMedia.mediaData as any).year
				}
			})
		}

		// Check if there's already a request for such media
		const existingRequest = await this.validationService.checkExistingRequest(
			searchableTitle,
			finalSource,
			collectionId
		)
		if (existingRequest) {
			throw new BadRequestException({
				message: 'Request for such media already exists',
				existingRequest: {
					id: existingRequest.id,
					title: (existingRequest.mediaData as any).title,
					status: existingRequest.status,
					createdAt: existingRequest.createdAt
				}
			})
		}

		const request = await this.prisma.mediaRequest.create({
			data: {
				mediaData: mediaData as Prisma.JsonObject,
				searchableTitle,
				externalIds: null, // For user requests, externalIds is always null
				collectionId,
				requestedById: userId,
				status: ModerationType.PENDING
			},
			include: {
				requestedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				},
				collection: true
			}
		})

		// TODO: Add notification creation for admins about new request

		return request
	}

	/** Get a specific request **/
	async findOne(
		id: string,
		currentUserId?: string,
		userRole?: UserRole
	): Promise<MediaRequest> {
		const request = await this.prisma.mediaRequest.findUnique({
			where: { id },
			include: {
				requestedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				},
				moderatedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				},
				collection: true,
				approvedMedia: true
			}
		})

		if (!request) {
			throw new NotFoundException('Request not found')
		}

		// Check access rights
		if (
			userRole !== UserRole.ADMIN &&
			request.requestedById !== currentUserId
		) {
			throw new ForbiddenException('No access to this request')
		}

		return request
	}

	/** Update request by user **/
	async update(
		id: string,
		userId: string,
		updateDto: UpdateRequestDto
	): Promise<MediaRequest> {
		const request = await this.findOne(id, userId)

		// Check if request can still be edited
		if (request.status !== ModerationType.PENDING) {
			throw new BadRequestException(
				'Cannot edit processed request'
			)
		}

		// Check if user is the owner of the request
		if (request.requestedById !== userId) {
			throw new ForbiddenException(
				'Can only edit own requests'
			)
		}

		const { mediaData } = updateDto
		let searchableTitle: string | undefined

		// If updating mediaData, recalculate searchableTitle
		if (mediaData && mediaData.title) {
			searchableTitle = normalizeTitle(mediaData.title)
		}

		const updatedRequest = await this.prisma.mediaRequest.update({
			where: { id },
			data: {
				...(mediaData && {
					mediaData: {
						...(request.mediaData as any),
						...mediaData
					} as Prisma.JsonObject
				}),
				...(searchableTitle && { searchableTitle })
			},
			include: {
				requestedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				},
				collection: true
			}
		})

		return updatedRequest
	}

	/** Delete request **/
	async remove(
		id: string,
		userId: string,
		userRole?: UserRole
	): Promise<void> {
		const request = await this.findOne(id, userId, userRole)

		// Only request owner or admin can delete
		if (request.requestedById !== userId && userRole !== UserRole.ADMIN) {
			throw new ForbiddenException(
				'No permission to delete this request'
			)
		}

		// Cannot delete approved request
		if (request.status === ModerationType.APPROVED) {
			throw new BadRequestException('Cannot delete approved request')
		}

		await this.prisma.mediaRequest.delete({
			where: { id }
		})
	}
}




