module.exports = {
  overrides: [
    {
      files: ['packages/**/src/**/*.ts', 'packages/**/src/**/*.tsx'],
      excludedFiles: ['packages/config/**'],
      rules: {
        'no-restricted-properties': [
          'error',
          {
            object: 'process',
            property: 'env',
            message: 'No process.env in packages. Use config injection.'
          }
        ]
      }
    }
  ]
};
