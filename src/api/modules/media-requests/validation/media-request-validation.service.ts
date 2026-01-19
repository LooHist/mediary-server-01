import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import { MediaSource, ModerationType, Prisma } from '@prisma/client'

@Injectable()
export class MediaRequestValidationService {
	constructor(private readonly prisma: PrismaService) {}

	/** Check if media with such data exists **/
	async checkExistingMedia(
		searchableTitle: string,
		source?: MediaSource,
		categoryId?: string
	) {
		const where: Prisma.MediaWhereInput = {
			// For CUSTOM source, check by title + category
			// For other sources - only by title
			...(source === MediaSource.CUSTOM && categoryId
				? {
						searchableTitle: {
							equals: searchableTitle,
							mode: 'insensitive'
						},
						categoryId
				  }
				: {
						searchableTitle: {
							equals: searchableTitle,
							mode: 'insensitive'
						}
				  })
		}

		return this.prisma.media.findFirst({ where })
	}

	/** Check if request for such media exists **/
	async checkExistingRequest(
		searchableTitle: string,
		source?: MediaSource,
		categoryId?: string
	) {
		const where: Prisma.MediaRequestWhereInput = {
			status: { in: [ModerationType.PENDING, ModerationType.APPROVED] },
			// For CUSTOM source, check by title + category
			// For other sources - only by title
			...(source === MediaSource.CUSTOM && categoryId
				? {
						searchableTitle: {
							equals: searchableTitle,
							mode: 'insensitive'
						},
						categoryId
				  }
				: {
						searchableTitle: {
							equals: searchableTitle,
							mode: 'insensitive'
						}
				  })
		}

		return this.prisma.mediaRequest.findFirst({ where })
	}
}



