definePlugin({
  async setup({ emitter }) {
    /**
     * Require package|module|common from files of application directory
     */
    load('./common/module1/index.js').initModule();
    /**
     * Require package from node_modules
     */
    load('ws');

    emitter.on('schemas:initiated', ({ schemas }, payload) => {
      console.info('my-plugin', 'schemas');
    });
    emitter.on('application:initiated', () => {
      console.info('my-plugin', 'initiated');
    });
  },
});
