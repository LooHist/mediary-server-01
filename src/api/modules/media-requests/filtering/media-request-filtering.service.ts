import { normalizeTitle } from '@common/utils'
import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import { MediaSource, Prisma, UserRole } from '@prisma/client'

import { FindRequestsDto } from '../dto'

@Injectable()
export class MediaRequestFilteringService {
	constructor(private readonly prisma: PrismaService) {}

	/** Build filtering conditions for request search **/
	buildWhereConditions(
		findRequestsDto: FindRequestsDto,
		currentUserId?: string,
		userRole?: UserRole,
		skipUserFilter: boolean = false
	): Prisma.MediaRequestWhereInput {
		const {
			status,
			categoryId,
			search,
			requestedById,
			moderatedById,
			year
		} = findRequestsDto

		const where: Prisma.MediaRequestWhereInput = {
			...(status && { status }),
			// Note: MediaRequest doesn't have 'source' field - it's only in Media model
			...(categoryId && { categoryId }),
			...(requestedById && { requestedById }),
			...(moderatedById && { moderatedById }),
			...(search && {
				OR: [
					{
						searchableTitle: {
							contains: normalizeTitle(search),
							mode: 'insensitive'
						}
					},
					{ mediaData: { path: ['title'], string_contains: search } },
					{
						mediaData: {
							path: ['originalTitle'],
							string_contains: search
						}
					}
				]
			}),
			...(year && {
				mediaData: {
					path: ['year'],
					equals: year
				}
			})
		}

		// Access logic:
		// - On client: all users (including moderators) see only their requests
		//   (endpoint /my is used)
		// - In admin: only admins see all requests via endpoint /
		//   Moderators use endpoint /pending for moderation (skipUserFilter=true)
		// Only admins see all requests via general endpoint
		if (!skipUserFilter && userRole !== UserRole.ADMIN && currentUserId) {
			where.requestedById = currentUserId
		}

		return where
	}

	/**
	 * Get standard include for requests
	 */
	getStandardInclude() {
		return {
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
			category: true,
			approvedMedia: {
				select: {
					id: true
				}
			}
		}
	}

	/**
	 * Determine sorting for requests
	 */
	getOrderBy(
		sortBy: string = 'createdAt',
		sortOrder: 'asc' | 'desc' = 'desc'
	): Prisma.MediaRequestOrderByWithRelationInput {
		// Allowed fields for sorting
		const allowedSortFields = ['createdAt', 'updatedAt', 'title']
		const normalizedSortBy = sortBy || 'createdAt'
		
		// Check if field is allowed for sorting
		switch (normalizedSortBy) {
			case 'title':
				return { searchableTitle: sortOrder }
			case 'updatedAt':
				return { updatedAt: sortOrder }
			case 'createdAt':
			default:
				return { createdAt: sortOrder }
		}
	}
}
