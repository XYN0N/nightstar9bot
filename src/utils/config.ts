type ConfigValue = string | number | boolean | readonly any[];

export function defineConfig<T extends Record<string, ConfigValue>>(config: T): T {
  const env = import.meta.env;
  
  // Create a new object with environment variables
  const processedConfig = { ...config };
  
  for (const key in config) {
    const envKey = `VITE_${key}`;
    if (envKey in env) {
      const value = env[envKey];
      if (typeof config[key] === 'number') {
        processedConfig[key] = Number(value) as T[typeof key];
      } else if (typeof config[key] === 'boolean') {
        processedConfig[key] = (value === 'true') as T[typeof key];
      } else {
        processedConfig[key] = value as T[typeof key];
      }
    }
  }
  
  return processedConfig;
}