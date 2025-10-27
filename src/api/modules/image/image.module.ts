import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MulterModule } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'

import { ImageController } from './image.controller'
import { ImageService } from './image.service'

@Module({
	imports: [
		ConfigModule,
		MulterModule.register({
			storage: diskStorage({
				destination: './tmp/uploads',
				filename: (req, file, callback) => {
					const uniqueSuffix =
						Date.now() + '-' + Math.round(Math.random() * 1e9)
					const extension = extname(file.originalname)
					callback(
						null,
						`${file.fieldname}-${uniqueSuffix}${extension}`
					)
				}
			}),
			limits: {
				fileSize: 5 * 1024 * 1024 // 5MB
			}
		})
	],
	controllers: [ImageController],
	providers: [ImageService],
	exports: [ImageService]
})
export class ImageModule {}
