import { Controller, Get, Query } from '@nestjs/common'

import { SearchQueryDto } from './dto/search.dto'
import { SearchService } from './search.service'
import { SearchQuery, SearchResponse } from './search.types'

@Controller('search')
export class SearchController {
	constructor(private readonly searchService: SearchService) {}

	@Get()
	async search(@Query() query: SearchQueryDto): Promise<SearchResponse> {
		const searchQuery: SearchQuery = {
			query: query.query,
			mediaType: query.mediaType
		}

		return await this.searchService.search(searchQuery)
	}
}
