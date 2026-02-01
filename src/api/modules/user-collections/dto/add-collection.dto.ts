import { IsNotEmpty, IsString } from 'class-validator'

export class AddCollectionDto {
	@IsString()
	@IsNotEmpty()
	collectionId: string
}




