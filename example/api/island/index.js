defineConfig({
  private: true,

  meta: {
    name: 'Islands',
    description: 'Island crud description',
  },
  Entity: {},
  crud: {
    exclude: ['update', 'delete', 'create'],
  },
});
