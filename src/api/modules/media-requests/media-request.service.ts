import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import { MediaRequest, ModerationType, UserRole } from '@prisma/client'

import {
	CreateMediaRequestDto,
	FindRequestsDto,
	ModerateRequestDto,
	UpdateRequestDto
} from './dto'
import { MediaRequestFilteringService } from './filtering'
import { MediaRequestModerationService } from './moderation'
import { MediaRequestCrudService } from './requests'
import { MediaRequestStatsService } from './stats'

@Injectable()
export class MediaRequestService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly crudService: MediaRequestCrudService,
		private readonly filteringService: MediaRequestFilteringService,
		private readonly moderationService: MediaRequestModerationService,
		private readonly statsService: MediaRequestStatsService
	) {}

	/** Create a new media request **/
	async create(
		userId: string,
		createRequestDto: CreateMediaRequestDto
	): Promise<MediaRequest> {
		return this.crudService.create(userId, createRequestDto)
	}

	/** Get requests with filtering **/
	async findAll(
		findRequestsDto: FindRequestsDto,
		currentUserId?: string,
		userRole?: UserRole
	) {
		const {
			page = 1,
			limit = 20,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = findRequestsDto

		const skip = (page - 1) * limit

		// Build filtering conditions
		// skipUserFilter = false for general endpoint (only admins see all)
		const where = this.filteringService.buildWhereConditions(
			findRequestsDto,
			currentUserId,
			userRole,
			false
		)

		// Determine sorting
		const orderBy = this.filteringService.getOrderBy(sortBy, sortOrder)

		// Execute queries in parallel
		const [requests, total] = await Promise.all([
			this.prisma.mediaRequest.findMany({
				where,
				skip,
				take: limit,
				orderBy,
				include: this.filteringService.getStandardInclude()
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

	/** Get a specific request **/
	async findOne(
		id: string,
		currentUserId?: string,
		userRole?: UserRole
	): Promise<MediaRequest> {
		return this.crudService.findOne(id, currentUserId, userRole)
	}

	/** Moderate request (approve/reject) **/
	async moderate(
		id: string,
		moderatorId: string,
		moderateDto: ModerateRequestDto
	): Promise<MediaRequest> {
		return this.moderationService.moderate(id, moderatorId, moderateDto)
	}

	/** Update request by user **/
	async update(
		id: string,
		userId: string,
		updateDto: UpdateRequestDto
	): Promise<MediaRequest> {
		return this.crudService.update(id, userId, updateDto)
	}

	/** Delete request **/
	async remove(
		id: string,
		userId: string,
		userRole?: UserRole
	): Promise<void> {
		return this.crudService.remove(id, userId, userRole)
	}

	/** Get requests statistics **/
	async getRequestsStats() {
		return this.statsService.getRequestsStats()
	}

	/** Get user requests **/
	async getUserRequests(userId: string, status?: ModerationType) {
		return this.statsService.getUserRequests(userId, status)
	}

	/** Get requests for moderation (moderators and admins see all requests) **/
	async findAllForModeration(
		findRequestsDto: FindRequestsDto,
		userRole?: UserRole
	) {
		const {
			page = 1,
			limit = 20,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = findRequestsDto

		const skip = (page - 1) * limit

		// Build filtering conditions with skipUserFilter = true
		// Moderators and admins see all requests
		const where = this.filteringService.buildWhereConditions(
			findRequestsDto,
			undefined, // currentUserId not needed
			userRole,
			true // skipUserFilter = true for moderation
		)

		// Determine sorting
		const orderBy = this.filteringService.getOrderBy(sortBy, sortOrder)

		// Execute queries in parallel
		const [requests, total] = await Promise.all([
			this.prisma.mediaRequest.findMany({
				where,
				skip,
				take: limit,
				orderBy,
				include: this.filteringService.getStandardInclude()
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
}
