import { IsNotEmpty, IsString } from 'class-validator'

export class RemoveCollectionDto {
	@IsString()
	@IsNotEmpty()
	collectionId: string
}




