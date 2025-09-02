import {
	ConflictException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { MediaSource, Prisma, UserLibrary } from '@prisma/client'

import { sanitizePlainText } from '../libs/common/utils/sanitize-text.util'
import { PrismaService } from '../prisma/prisma.service'

import { AddFromSearchDto, GetLibraryDto, UpdateLibraryItemDto } from './dto'

@Injectable()
export class UserLibraryService {
	constructor(private readonly prisma: PrismaService) {}

	// Simple in-memory cache for genres
	private cachedAllGenres: string[] | null = null
	private cachedAllGenresAt: number | null = null
	private readonly genresCacheTtlMs = 6 * 60 * 60 * 1000 // 6 hours

	/* Fixed category mapping */
	private readonly categoryMap = {
		movie: 'Movies',
		tv_show: 'Series',
		book: 'Books',
		anime: 'Anime',
		game: 'Games',
		drama: 'Dramas',
		manga: 'Manga',
		manhwa: 'Manhwa'
	} as const

	/* Add media from search to library (creates media + adds to library) */
	async addFromSearch(
		userId: string,
		addFromSearchDto: AddFromSearchDto
	): Promise<UserLibrary> {
		const { searchResult, status, rating, notes } = addFromSearchDto

		let createdNewMedia = false

		// Determine category based on media type
		const categoryName =
			this.categoryMap[
				searchResult.type as keyof typeof this.categoryMap
			] || 'Movies'

		// Check if media already exists in database
		let media = await this.prisma.media.findFirst({
			where: {
				OR: [
					{
						externalId: searchResult.externalId,
						source: this.mapSourceToMediaSource(searchResult.source)
					},
					{
						searchableTitle: this.normalizeTitle(searchResult.title)
					}
				]
			},
			include: { category: true }
		})

		// If media doesn't exist, create it
		if (!media) {
			const mediaData = {
				title: searchResult.title,
				description: searchResult.subtitle || '',
				year: searchResult.year
					? parseInt(searchResult.year)
					: new Date().getFullYear(),
				posterUrl: searchResult.imageUrl,
				rating: searchResult.rating,
				genres: searchResult.genres || []
			}

			console.log('Creating media with data:', mediaData)

			media = await this.prisma.media.create({
				data: {
					source: this.mapSourceToMediaSource(searchResult.source),
					externalId: searchResult.externalId,
					mediaData: mediaData as Prisma.JsonObject,
					searchableTitle: this.normalizeTitle(searchResult.title),
					externalIds: {
						[searchResult.source]: searchResult.externalId
					} as Prisma.JsonObject,
					category: {
						connect: {
							name: categoryName
						}
					}
				},
				include: { category: true }
			})

			createdNewMedia = true
		}

		// Check if media already exists in user's library
		const existingLibraryItem = await this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId: media.id
				}
			}
		})

		if (existingLibraryItem) {
			throw new ConflictException('Media already exists in your library')
		}

		// Add to library
		const libraryItem = await this.prisma.userLibrary.create({
			data: {
				userId,
				mediaId: media.id,
				status,
				rating,
				notes: sanitizePlainText(notes)
			},
			include: {
				media: {
					include: {
						category: true,
						_count: {
							select: {
								library: true,
								reviews: true
							}
						}
					}
				}
			}
		})

		// Invalidate cached genres if we created new media
		if (createdNewMedia) {
			this.cachedAllGenres = null
			this.cachedAllGenresAt = null
		}

		return libraryItem
	}

	/* Update library item */
	async updateLibraryItem(
		userId: string,
		mediaId: string,
		updateDto: UpdateLibraryItemDto
	): Promise<UserLibrary> {
		const { status, rating, notes } = updateDto

		// Check if item exists in library
		const existingItem = await this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})

		if (!existingItem) {
			throw new NotFoundException('Media not found in your library')
		}

		// Update library item
		const updatedItem = await this.prisma.userLibrary.update({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			},
			data: {
				...(status && { status }),
				...(rating !== undefined && { rating }),
				...(notes !== undefined && { notes: sanitizePlainText(notes) })
			},
			include: {
				media: {
					include: {
						category: true,
						_count: {
							select: {
								library: true,
								reviews: true
							}
						}
					}
				}
			}
		})

		return updatedItem
	}

	/* Delete from library */
	async removeFromLibrary(userId: string, mediaId: string): Promise<void> {
		const existingItem = await this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})

		if (!existingItem) {
			throw new NotFoundException('Media not found in your library')
		}

		await this.prisma.userLibrary.delete({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})
	}

	/* Get user library with filtering */
	async getUserLibrary(userId: string, getLibraryDto: GetLibraryDto) {
		const {
			statuses,
			categoryName,
			source,
			search,
			genres,
			minRating,
			maxRating,
			minYear,
			maxYear,
			page = 1,
			limit = 20,
			sortBy = 'addedAt',
			sortOrder = 'desc'
		} = getLibraryDto

		const skip = (page - 1) * limit

		// Build filtering conditions
		const where: Prisma.UserLibraryWhereInput = {
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

		// Determine sorting
		let orderBy: Prisma.UserLibraryOrderByWithRelationInput = {}
		switch (sortBy) {
			case 'title':
				orderBy = { media: { searchableTitle: sortOrder } }
				break
			case 'year':
				// For now, sort by creation date
				orderBy = { addedAt: sortOrder }
				break
			case 'rating':
				// Put rated items first, unrated (NULL) last
				orderBy = { rating: { sort: sortOrder, nulls: 'last' } as any }
				break
			default:
				orderBy = { [sortBy]: sortOrder } as any
		}

		// Execute parallel queries
		const [libraryItems, total] = await Promise.all([
			this.prisma.userLibrary.findMany({
				where,
				skip,
				take: limit,
				orderBy,
				include: {
					media: {
						include: {
							category: true,
							_count: {
								select: {
									library: true,
									reviews: true
								}
							}
						}
					}
				}
			}),
			this.prisma.userLibrary.count({ where })
		])

		return {
			data: libraryItems,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				hasNextPage: page < Math.ceil(total / limit),
				hasPrevPage: page > 1
			}
		}
	}

	/* Check if media is in user's library */
	async isInLibrary(userId: string, mediaId: string): Promise<boolean> {
		const item = await this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})

		return !!item
	}

	/* Get specific item from library */
	async getLibraryItem(
		userId: string,
		mediaId: string
	): Promise<UserLibrary | null> {
		return this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			},
			include: {
				media: {
					include: {
						category: true,
						_count: {
							select: {
								library: true,
								reviews: true
							}
						}
					}
				}
			}
		})
	}

	/* Get recommendations based on user's library */
	async getRecommendations(userId: string, limit: number = 10) {
		// TODO: Expand recommendation algorithm for different media types
		// For now, simple algorithm based on favorite movies/TV shows

		// Find favorite media of user (high rating)
		const favoriteItems = await this.prisma.userLibrary.findMany({
			where: {
				userId,
				rating: { gte: 7 } // Високий рейтинг
			},
			include: {
				media: {
					include: {
						category: true
					}
				}
			}
		})

		if (favoriteItems.length === 0) {
			return { data: [], message: 'Not enough data for recommendations' }
		}

		// Get popular categories from favorite media
		const categoryIds = favoriteItems.map(item => item.media.categoryId)
		const uniqueCategoryIds = [...new Set(categoryIds)]

		// Find media that user hasn't added to library
		const recommendations = await this.prisma.media.findMany({
			where: {
				categoryId: { in: uniqueCategoryIds },
				library: {
					none: { userId } // Media that user hasn't added to library
				}
			},
			include: {
				category: true,
				_count: {
					select: {
						library: true,
						reviews: true
					}
				}
			},
			take: limit,
			orderBy: {
				library: { _count: 'desc' } // Popular media
			}
		})

		return { data: recommendations }
	}

	/* Get all unique genres from user's library */
	async getGenres(userId: string): Promise<string[]> {
		const libraryItems = await this.prisma.userLibrary.findMany({
			where: { userId },
			select: {
				media: {
					select: {
						mediaData: true
					}
				}
			}
		})

		const allGenres: string[] = []

		libraryItems.forEach(item => {
			const mediaData = item.media.mediaData as any
			if (mediaData?.genres && Array.isArray(mediaData.genres)) {
				allGenres.push(...mediaData.genres)
			}
		})

		// Remove duplicates and sort alphabetically
		const uniqueGenres = [...new Set(allGenres)].sort()

		return uniqueGenres
	}

	/* Get all unique genres from all media with simple in-memory caching (additional method, not yet used) */
	async getAllGenres(): Promise<string[]> {
		const now = Date.now()
		const isFresh =
			this.cachedAllGenres &&
			this.cachedAllGenresAt !== null &&
			now - this.cachedAllGenresAt < this.genresCacheTtlMs

		if (isFresh) {
			return this.cachedAllGenres as string[]
		}

		const allMedia = await this.prisma.media.findMany({
			select: {
				mediaData: true
			}
		})

		const allGenres: string[] = []

		allMedia.forEach(media => {
			const mediaData = media.mediaData as any
			if (mediaData?.genres && Array.isArray(mediaData.genres)) {
				allGenres.push(...mediaData.genres)
			}
		})

		const uniqueGenres = [...new Set(allGenres)].sort()

		this.cachedAllGenres = uniqueGenres
		this.cachedAllGenresAt = now

		return uniqueGenres
	}

	/* Helper methods */
	private mapSourceToMediaSource(source: string): MediaSource {
		const sourceMap: Record<string, MediaSource> = {
			tmdb: MediaSource.TMDB,
			google_books: MediaSource.GOOGLE_BOOKS,
			mal: MediaSource.MAL
		}
		return sourceMap[source] || MediaSource.TMDB
	}

	private normalizeTitle(title: string): string {
		return title.toLowerCase().trim()
	}
}
