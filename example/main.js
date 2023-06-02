const { Server } = require('../lib/server');
const { defineApi, defineSchema } = require('../lib/common/defines');

const server = new Server({
  rootDir: 'example',
  crud: {
    findMany: (entity) =>
      defineApi({
        params: defineSchema({ limit: 'boolean[]' }),
        method: async (args) => ({ args, entity }),
      }),
    findOne: (entity) => async (args) => ({ args, entity }),
    create: (entity) => async (args) => ({ args, entity }),
    update: (entity) => async (args) => ({ args, entity }),
    delete: (entity) => async (args) => ({ args, entity }),
  },
  config: {
    // explorer: false,
    // static: {
    //   port: 8080,
    // },
    network: {
      http: {
        port: 3001,
      },
      // ws: {
      //   port: 3002,
      // },
    },
    runOptions: {
      displayErrors: true,
    },
  },
});

server.start().then();
