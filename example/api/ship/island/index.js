defineConfig({
  meta: {
    name: 'Ship Islands',
    description: 'Ship Island crud description',
  },
  Entity: {},
  crud: {
    exclude: ['update', 'delete', 'create'],
  },
});
