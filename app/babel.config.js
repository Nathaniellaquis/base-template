module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/components': './components',
            '@/hooks': './hooks',
            '@/lib': './lib',
            '@/app-utils': './utils',
            '@/providers': './providers',
            '@/styles': './styles',
            '@/types': './types',
            '@shared': '../types',
          },
        },
      ],
    ],
  };
};