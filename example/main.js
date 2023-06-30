const { Server } = require('../lib/server');
const { defineApi, defineSchema } = require('../lib/common/defines');
const packageJSON = require('../package.json');

const server = new Server({
  meta: {
    name: packageJSON.name,
    description: packageJSON.description,
    version: packageJSON.version,
  },
  rootDir: 'example',
  crud: {
    findMany: (entity, ctx) => {
      console.log(entity, ctx);
      return defineApi({
        params: defineSchema({ limit: 'boolean[]' }),
        method: async (args) => ({ args, entity }),
      });
    },
    findOne: (entity) => async (args) => ({ args, entity }),
    create: (entity) => async (args) => ({ args, entity }),
    update: (entity) => async (args) => ({ args, entity }),
    delete: (entity) => async (args) => ({ args, entity }),
  },
  config: {
    static: {
      port: 8080,
    },
    network: {
      http: {
        port: 3001,
      },
      ws: {
        port: 3002,
      },
    },
  },
});

server.start().then();
