import { IsEnum, IsOptional, IsString } from 'class-validator'

import { SEARCH_MEDIA_TYPE, SearchMediaType } from '../search.types'

export class SearchQueryDto {
	@IsString()
	query: string

	@IsOptional()
	@IsEnum(Object.values(SEARCH_MEDIA_TYPE).map(type => type.value))
	mediaType?: SearchMediaType
}
