import { AuthMethod, PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'argon2'

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

	// Створюємо головного адміністратора
	const adminEmail = 'admin@mediary.com'
	const adminPassword = 'Admin123!'
	const hashedAdminPassword = await hash(adminPassword)

	const admin = await prisma.user.upsert({
		where: { email: adminEmail },
		update: {},
		create: {
			email: adminEmail,
			password: hashedAdminPassword,
			displayName: 'Головний Адміністратор',
			picture: '',
			role: UserRole.ADMIN,
			method: AuthMethod.CREDENTIALS,
			isVerified: true
		}
	})

	console.log('✅ Головний адміністратор створено успішно')
	console.log(`📧 Email: ${adminEmail}`)
	console.log(`🔑 Password: ${adminPassword}`)

	// Створюємо тестового модератора
	const moderatorEmail = 'moderator@mediary.com'
	const moderatorPassword = 'Moderator123!'
	const hashedModeratorPassword = await hash(moderatorPassword)

	const moderator = await prisma.user.upsert({
		where: { email: moderatorEmail },
		update: {},
		create: {
			email: moderatorEmail,
			password: hashedModeratorPassword,
			displayName: 'Тестовий Модератор',
			picture: '',
			role: UserRole.MODERATOR,
			method: AuthMethod.CREDENTIALS,
			isVerified: true
		}
	})

	console.log('✅ Тестовий модератор створено успішно')
	console.log(`📧 Email: ${moderatorEmail}`)
	console.log(`🔑 Password: ${moderatorPassword}`)

	// Створюємо тестового користувача для перевірки доступу
	const testUserEmail = 'user@mediary.com'
	const testUserPassword = 'User123!'
	const hashedTestUserPassword = await hash(testUserPassword)

	const testUser = await prisma.user.upsert({
		where: { email: testUserEmail },
		update: {},
		create: {
			email: testUserEmail,
			password: hashedTestUserPassword,
			displayName: 'Тестовий Користувач',
			picture: '',
			role: UserRole.REGULAR,
			method: AuthMethod.CREDENTIALS,
			isVerified: true
		}
	})

	console.log('✅ Тестовий користувач створено успішно')
	console.log(`📧 Email: ${testUserEmail}`)
	console.log(`🔑 Password: ${testUserPassword}`)
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
