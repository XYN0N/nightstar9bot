// Use environment variables for sensitive data
export const REDIS_URL = import.meta.env.VITE_REDIS_URL || 'redis://localhost:6379';
export const MONGODB_URL = import.meta.env.VITE_MONGODB_URL || 'mongodb://localhost:27017/starnight';