import { PrismaService } from '@database/prisma'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { MediaRequest, MediaSource, ModerationType, Prisma } from '@prisma/client'

import { ModerateRequestDto } from '../dto'

@Injectable()
export class MediaRequestModerationService {
	constructor(private readonly prisma: PrismaService) {}

	/** Moderate request (approve/reject) **/
	async moderate(
		id: string,
		moderatorId: string,
		moderateDto: ModerateRequestDto
	): Promise<MediaRequest> {
		const { status, moderatorNote } = moderateDto

		// Get request (moderator has access to all requests)
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
				collection: true
			}
		})

		if (!request) {
			throw new NotFoundException('Request not found')
		}

		// Check if request is not yet processed
		if (request.status !== ModerationType.PENDING) {
			throw new BadRequestException('Request already processed')
		}

		let approvedMediaId: string | null = null

		// If approving request, create media
		if (status === ModerationType.APPROVED) {
			// Get source and externalId from request
			const requestExternalIds = request.externalIds as any

			// Determine source: if there are externalIds, take first key, otherwise CUSTOM
			let requestSource: MediaSource = MediaSource.CUSTOM
			let requestExternalId: string | null = null

			if (requestExternalIds && typeof requestExternalIds === 'object') {
				const sourceKeys = Object.keys(requestExternalIds)
				if (sourceKeys.length > 0) {
					// Take first source from externalIds
					requestSource = sourceKeys[0] as MediaSource
					requestExternalId =
						requestExternalIds[requestSource] || null
				}
			}

			const createdMedia = await this.prisma.media.create({
				data: {
					source: requestSource,
					externalId: requestExternalId,
					mediaData: request.mediaData,
					searchableTitle: request.searchableTitle,
					externalIds: request.externalIds,
					collectionId: request.collectionId,
					addedById: request.requestedById // Request author becomes media author
				}
			})
			approvedMediaId = createdMedia.id
		}

		// Update request
		const updatedRequest = await this.prisma.mediaRequest.update({
			where: { id },
			data: {
				status,
				moderatorNote,
				moderatedById: moderatorId,
				approvedMediaId
			},
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

		// TODO: Create notification for user about moderation result

		return updatedRequest
	}
}

