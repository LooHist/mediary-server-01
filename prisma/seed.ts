import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	console.log('🌱 Starting seeding...')

	// Створюємо категорії
	const categories = [
		{ name: 'Movies' },
		{ name: 'Series' },
		{ name: 'Books' },
		{ name: 'Anime' },
		{ name: 'Games' },
		{ name: 'Dramas' },
		{ name: 'Manga' },
		{ name: 'Manhwa' }
	]

	for (const categoryData of categories) {
		await prisma.category.upsert({
			where: { name: categoryData.name },
			update: {},
			create: categoryData
		})
	}

	console.log('✅ Categories seeded successfully')
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
