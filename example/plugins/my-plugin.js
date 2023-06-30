definePlugin({
  async setup({ emitter }, ctx) {
    console.info('my-plugin', 'before init');
    emitter.on('application:initiated', () => {
      console.info('my-plugin', 'initiated');
    });
  },
});
