import IORedis, { RedisOptions } from 'ioredis'

export function createRedisClient(redisUri: string): IORedis {
	const envHost = process.env.REDIS_HOST
	const envPort = process.env.REDIS_PORT
	const envPassword = process.env.REDIS_PASSWORD

	if (envHost || envPassword) {
		const config: RedisOptions = {
			host: envHost || 'localhost',
			port: envPort ? parseInt(envPort) : 6379,
			password: envPassword || undefined
		}
		return new IORedis(config)
	}

	let password: string | undefined
	let host = 'localhost'
	let port = 6379

	try {
		const url = new URL(redisUri)

		host = url.hostname || 'localhost'
		port = parseInt(url.port) || 6379

		password = url.password || undefined

		if (!password && url.username && url.username.includes(':')) {
			const parts = url.username.split(':')
			password = parts[parts.length - 1]
		}

		if (!password) {
			password = process.env.REDIS_PASSWORD
		}
	} catch (error) {
		const match = redisUri.match(/^redis:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^:]+)(?::(\d+))?/)
		if (match) {
			const [, username, uriPassword, uriHost, uriPort] = match
			host = uriHost || 'localhost'
			port = uriPort ? parseInt(uriPort) : 6379
			password = uriPassword || process.env.REDIS_PASSWORD || undefined
		}
	}

	const config: RedisOptions = {
		host,
		port,
		password: password || undefined,
		retryStrategy: (times: number) => {
			const delay = Math.min(times * 50, 2000)
			return delay
		},
		maxRetriesPerRequest: 3
	}

	return new IORedis(config)
}

