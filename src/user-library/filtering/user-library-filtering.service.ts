import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'
import { GetLibraryDto } from '../dto'

@Injectable()
export class UserLibraryFilteringService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Build filtering conditions for library query
	 */
	buildWhereConditions(
		userId: string,
		getLibraryDto: GetLibraryDto
	): Prisma.UserLibraryWhereInput {
		const {
			statuses,
			categoryName,
			source,
			search,
			genres,
			minRating,
			maxRating,
			minYear,
			maxYear
		} = getLibraryDto

		return {
			userId,
			...(statuses &&
				statuses.length > 0 && { status: { in: statuses } }),
			...(minRating && { rating: { gte: minRating } }),
			...(maxRating && { rating: { lte: maxRating } }),
			media: {
				...(source && { source }), // Filter by source (TMDB for movies/TV shows)
				...(categoryName && {
					category: {
						name: categoryName
					}
				}),
				...(search && {
					OR: [
						{
							searchableTitle: {
								contains: search,
								mode: 'insensitive'
							}
						},
						{
							mediaData: {
								path: ['title'],
								string_contains: search
							}
						},
						{
							mediaData: {
								path: ['originalTitle'],
								string_contains: search
							}
						}
					]
				}),
				// Require all selected genres (AND semantics)
				...(genres &&
					genres.length > 0 && {
						AND: genres.map(g => ({
							mediaData: {
								path: ['genres'],
								array_contains: g
							}
						}))
					}),
				...(minYear && {
					mediaData: {
						path: ['year'],
						gte: minYear
					}
				}),
				...(maxYear && {
					mediaData: {
						path: ['year'],
						lte: maxYear
					}
				})
			}
		}
	}

	/**
	 * Get standard include for library queries
	 */
	getStandardInclude(userId: string) {
		return {
			media: {
				include: {
					category: true,
					favorites: {
						where: { userId },
						select: { id: true }
					},
					_count: {
						select: {
							library: true,
							reviews: true
						}
					}
				}
			}
		}
	}
}
