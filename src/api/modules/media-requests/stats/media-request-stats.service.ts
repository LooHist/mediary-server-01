import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import { ModerationType, Prisma } from '@prisma/client'

@Injectable()
export class MediaRequestStatsService {
	constructor(private readonly prisma: PrismaService) {}

	/** Get requests statistics **/
	async getRequestsStats() {
		const [
			totalRequests,
			pendingRequests,
			approvedRequests,
			rejectedRequests,
			requestsByCategory,
			recentRequests
		] = await Promise.all([
			// Total number of requests
			this.prisma.mediaRequest.count(),

			// Pending requests
			this.prisma.mediaRequest.count({
				where: { status: ModerationType.PENDING }
			}),

			// Approved requests
			this.prisma.mediaRequest.count({
				where: { status: ModerationType.APPROVED }
			}),

			// Rejected requests
			this.prisma.mediaRequest.count({
				where: { status: ModerationType.REJECTED }
			}),

			// Distribution by categories
			this.prisma.mediaRequest.groupBy({
				by: ['categoryId'],
				_count: { categoryId: true }
			}),

			// Last 5 requests
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
			byCategory: [], // TODO: Fix after correct query
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

	/** Get user requests **/
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
}




