module.exports = {
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    '@babel/plugin-transform-runtime',
  ],
  presets: [
    '@babel/preset-env',
    '@babel/preset-typescript',
  ],
};