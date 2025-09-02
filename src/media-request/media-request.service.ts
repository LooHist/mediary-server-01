import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import {
	MediaRequest,
	MediaSource,
	ModerationType,
	Prisma,
	UserRole
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

import {
	CreateMediaRequestDto,
	FindRequestsDto,
	ModerateRequestDto,
	UpdateRequestDto
} from './dto'

@Injectable()
export class MediaRequestService {
	constructor(private readonly prisma: PrismaService) {}

	// Створення нового запиту на додавання медіа
	async create(
		userId: string,
		createRequestDto: CreateMediaRequestDto
	): Promise<MediaRequest> {
		const {
			mediaData,
			categoryId,
			source = MediaSource.TMDB,
			externalId,
			comment
		} = createRequestDto

		// Перевіряємо чи існує категорія
		const category = await this.prisma.category.findUnique({
			where: { id: categoryId }
		})

		if (!category) {
			throw new BadRequestException('Категорію не знайдено')
		}

		// TODO: Розширити перевірку для інших типів медіа
		// Наразі працюємо тільки з фільмами і серіалами з TMDB
		if (source !== MediaSource.TMDB) {
			throw new BadRequestException(
				'Наразі підтримуються тільки запити на фільми та серіали з TMDB'
			)
		}

		// Нормалізуємо назву для пошуку дублікатів
		const searchableTitle = this.normalizeTitle(mediaData.title)

		// Перевіряємо чи вже існує медіа з такими даними
		const existingMedia = await this.checkExistingMedia(
			searchableTitle,
			externalId,
			source
		)
		if (existingMedia) {
			throw new BadRequestException({
				message: 'Медіа вже існує в системі',
				existingMedia: {
					id: existingMedia.id,
					title: (existingMedia.mediaData as any).title,
					year: (existingMedia.mediaData as any).year
				}
			})
		}

		// Перевіряємо чи вже є запит на таке медіа
		const existingRequest = await this.checkExistingRequest(
			searchableTitle,
			externalId,
			source
		)
		if (existingRequest) {
			throw new BadRequestException({
				message: 'Запит на таке медіа вже існує',
				existingRequest: {
					id: existingRequest.id,
					title: (existingRequest.mediaData as any).title,
					status: existingRequest.status,
					createdAt: existingRequest.createdAt
				}
			})
		}

		// Створюємо externalIds масив
		const externalIds = externalId ? { [source]: externalId } : null

		const request = await this.prisma.mediaRequest.create({
			data: {
				mediaData: mediaData as Prisma.JsonObject,
				searchableTitle,
				externalIds: externalIds as Prisma.JsonObject,
				categoryId,
				requestedById: userId,
				comment,
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
				category: true
			}
		})

		// TODO: Додати створення сповіщення для адмінів про новий запит

		return request
	}

	// Отримання запитів з фільтрацією
	async findAll(
		findRequestsDto: FindRequestsDto,
		currentUserId?: string,
		userRole?: UserRole
	) {
		const {
			status,
			source = MediaSource.TMDB,
			categoryId,
			search,
			requestedById,
			moderatedById,
			year,
			page = 1,
			limit = 20,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = findRequestsDto

		const skip = (page - 1) * limit

		// Будуємо умови фільтрації
		const where: Prisma.MediaRequestWhereInput = {
			...(status && { status }),
			...(source && { source }),
			...(categoryId && { categoryId }),
			...(requestedById && { requestedById }),
			...(moderatedById && { moderatedById }),
			...(search && {
				OR: [
					{
						searchableTitle: {
							contains: this.normalizeTitle(search),
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

		// Якщо користувач не адмін, показуємо тільки його запити
		if (userRole !== UserRole.ADMIN && currentUserId) {
			where.requestedById = currentUserId
		}

		// Визначаємо сортування
		let orderBy: Prisma.MediaRequestOrderByWithRelationInput = {}
		switch (sortBy) {
			case 'title':
				orderBy = { searchableTitle: sortOrder }
				break
			case 'updatedAt':
				orderBy = { updatedAt: sortOrder }
				break
			default:
				orderBy = { [sortBy]: sortOrder }
		}

		// Виконуємо запити паралельно
		const [requests, total] = await Promise.all([
			this.prisma.mediaRequest.findMany({
				where,
				skip,
				take: limit,
				orderBy,
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
					category: true,
					approvedMedia: {
						select: {
							id: true
						}
					}
				}
			}),
			this.prisma.mediaRequest.count({ where })
		])

		return {
			data: requests,
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

	// Отримання конкретного запиту
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
				category: true,
				approvedMedia: true
			}
		})

		if (!request) {
			throw new NotFoundException('Запит не знайдено')
		}

		// Перевіряємо права доступу
		if (
			userRole !== UserRole.ADMIN &&
			request.requestedById !== currentUserId
		) {
			throw new ForbiddenException('Немає доступу до цього запиту')
		}

		return request
	}

	// Модерація запиту (схвалення/відхилення)
	async moderate(
		id: string,
		moderatorId: string,
		moderateDto: ModerateRequestDto
	): Promise<MediaRequest> {
		const { status, moderatorNote } = moderateDto

		const request = await this.findOne(id)

		// Перевіряємо чи запит ще не оброблено
		if (request.status !== ModerationType.PENDING) {
			throw new BadRequestException('Запит вже оброблено')
		}

		let approvedMediaId: string | null = null

		// Якщо схвалюємо запит, створюємо медіа
		if (status === ModerationType.APPROVED) {
			// Отримуємо source та externalId з запиту
			const requestExternalIds = request.externalIds as any
			const requestSource = MediaSource.TMDB // За замовчуванням TMDB
			const requestExternalId = requestExternalIds
				? requestExternalIds[requestSource]
				: null

			const createdMedia = await this.prisma.media.create({
				data: {
					source: requestSource,
					externalId: requestExternalId,
					mediaData: request.mediaData,
					searchableTitle: request.searchableTitle,
					externalIds: request.externalIds,
					categoryId: request.categoryId,
					addedById: request.requestedById // Автор запиту стає автором медіа
				}
			})
			approvedMediaId = createdMedia.id
		}

		// Оновлюємо запит
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
				category: true,
				approvedMedia: true
			}
		})

		// TODO: Створити сповіщення для користувача про результат модерації

		return updatedRequest
	}

	// Оновлення запиту користувачем
	async update(
		id: string,
		userId: string,
		updateDto: UpdateRequestDto
	): Promise<MediaRequest> {
		const request = await this.findOne(id, userId)

		// Перевіряємо чи запит ще можна редагувати
		if (request.status !== ModerationType.PENDING) {
			throw new BadRequestException(
				'Неможливо редагувати оброблений запит'
			)
		}

		// Перевіряємо чи користувач власник запиту
		if (request.requestedById !== userId) {
			throw new ForbiddenException(
				'Можна редагувати тільки власні запити'
			)
		}

		const { mediaData, comment } = updateDto
		let searchableTitle: string | undefined

		// Якщо оновлюємо mediaData, перерахуємо searchableTitle
		if (mediaData && mediaData.title) {
			searchableTitle = this.normalizeTitle(mediaData.title)
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
				...(searchableTitle && { searchableTitle }),
				...(comment !== undefined && { comment })
			},
			include: {
				requestedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				},
				category: true
			}
		})

		return updatedRequest
	}

	// Видалення запиту
	async remove(
		id: string,
		userId: string,
		userRole?: UserRole
	): Promise<void> {
		const request = await this.findOne(id, userId, userRole)

		// Тільки власник запиту або адмін можуть видаляти
		if (request.requestedById !== userId && userRole !== UserRole.ADMIN) {
			throw new ForbiddenException(
				'Немає прав для видалення цього запиту'
			)
		}

		// Неможливо видалити схвалений запит
		if (request.status === ModerationType.APPROVED) {
			throw new BadRequestException('Неможливо видалити схвалений запит')
		}

		await this.prisma.mediaRequest.delete({
			where: { id }
		})
	}

	// Статистика запитів
	async getRequestsStats() {
		const [
			totalRequests,
			pendingRequests,
			approvedRequests,
			rejectedRequests,
			requestsByCategory,
			recentRequests
		] = await Promise.all([
			// Загальна кількість запитів
			this.prisma.mediaRequest.count(),

			// Запити в очікуванні
			this.prisma.mediaRequest.count({
				where: { status: ModerationType.PENDING }
			}),

			// Схвалені запити
			this.prisma.mediaRequest.count({
				where: { status: ModerationType.APPROVED }
			}),

			// Відхилені запити
			this.prisma.mediaRequest.count({
				where: { status: ModerationType.REJECTED }
			}),

			// Розподіл за категоріями
			this.prisma.mediaRequest.groupBy({
				by: ['categoryId'],
				_count: { categoryId: true }
			}),

			// Останні 5 запитів
			this.prisma.mediaRequest.findMany({
				take: 5,
				orderBy: { createdAt: 'desc' },
				include: {
					requestedBy: {
						select: {
							id: true,
							displayName: true
						}
					},
					category: true
				}
			})
		])

		return {
			total: totalRequests,
			pending: pendingRequests,
			approved: approvedRequests,
			rejected: rejectedRequests,
			approvalRate:
				totalRequests > 0
					? (approvedRequests / totalRequests) * 100
					: 0,
			byCategory: [], // TODO: Виправити після правильного запиту
			recent: recentRequests.map(request => ({
				id: request.id,
				title: (request.mediaData as any).title,
				requestedBy: request.requestedBy.displayName,
				category: request.category.name,
				status: request.status,
				createdAt: request.createdAt
			}))
		}
	}

	// Отримання запитів користувача
	async getUserRequests(userId: string, status?: ModerationType) {
		const where: Prisma.MediaRequestWhereInput = {
			requestedById: userId,
			...(status && { status })
		}

		const requests = await this.prisma.mediaRequest.findMany({
			where,
			include: {
				category: true,
				moderatedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				},
				approvedMedia: {
					select: {
						id: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		})

		return requests
	}

	// Перевірка чи існує медіа
	private async checkExistingMedia(
		searchableTitle: string,
		externalId?: string,
		source?: MediaSource
	) {
		const where: Prisma.MediaWhereInput = {
			OR: [
				{
					searchableTitle: {
						equals: searchableTitle,
						mode: 'insensitive'
					}
				},
				...(externalId && source ? [{ source, externalId }] : [])
			]
		}

		return this.prisma.media.findFirst({ where })
	}

	// Перевірка чи існує запит
	private async checkExistingRequest(
		searchableTitle: string,
		externalId?: string,
		source?: MediaSource
	) {
		const where: Prisma.MediaRequestWhereInput = {
			status: { in: [ModerationType.PENDING, ModerationType.APPROVED] },
			OR: [
				{
					searchableTitle: {
						equals: searchableTitle,
						mode: 'insensitive'
					}
				}
				// TODO: Додати перевірку externalId коли буде потрібно
			]
		}

		return this.prisma.mediaRequest.findFirst({ where })
	}

	// Нормалізація назви для пошуку
	private normalizeTitle(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s]/gu, '') // Видаляємо спецсимволи
			.replace(/\s+/g, ' ') // Замінюємо множинні пробіли одним
			.trim()
	}
}
