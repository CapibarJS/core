definePlugin({
  async setup({ emitter }, ctx) {
    console.info('my-plugin', 'before init');
    emitter.on('schemas:initiated', ({ schemas }) => {
      console.info('my-plugin', 'schemas', schemas);
    });
    emitter.on('application:initiated', () => {
      console.info('my-plugin', 'initiated');
    });
  },
});
