export const configuration = () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    name: process.env.POSTGRES_DB,
    synchronize: process.env.NODE_ENV !== 'production',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    retryDelay: 100,
    maxRetryAttempts: 5,
    connectTimeout: 20000,
    commandTimeout: 10000,
    keepAlive: 10000,
    enableReadyCheck: true,
    enableOfflineQueue: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  websocket: {
    port: parseInt(process.env.WS_PORT, 10) || 3001,
  },
});

export type Configuration = ReturnType<typeof configuration>;
