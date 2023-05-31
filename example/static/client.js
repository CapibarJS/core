function objectSet(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

function objectGet(obj, key) {
  const keys = key.split('.');
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (!current[k]) return undefined;
    current = current[k];
  }
  return current;
}


class Transport {
  /**
   *
   * @param url {string}
   */
  constructor(url) {
    const { protocol, host, port } = new URL(url);
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.url = url;
  }

  /**
   * @interface
   * @param namespace
   * @param method
   * @returns {function(...[*]): Promise<*[]>}
   */
  getExecutor(namespace, method) {
    console.info(`Call method '${namespace}.${method}'`);
    return (...args) => Promise.resolve(args);
  }

  /**
   *
   * @param args {any}
   * @returns {Promise<unknown>}
   */
  build = (args) => Promise.resolve(args);

  /**
   *
   * @param url {string}
   * @returns {Transport}
   */
  static scaffold(url) {
    const protocol = url.startsWith('ws:') ? 'ws' : 'http';
    const transport = {
      ws: WsClient,
      http: HttpClient,
    };
    return new transport[protocol](url);
  }
}

class HttpClient extends Transport {
  constructor(url) {
    super(url);
  }

  getExecutor(namespace, method) {
    return (...args) =>
      new Promise((resolve, reject) => {
        fetch(`${this.url}/api/${namespace}/${method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: namespace, method, args }),
        }).then((res) => {
          if (res.status === 200) resolve(res.json());
          else reject(new Error(`Status Code: ${res.status}`));
        });
      });
  }
}

class WsClient extends Transport {
  /**
   * @type {WebSocket}
   */
  socket;

  constructor(url) {
    super(url);
    this.socket = new WebSocket(this.url);
  }

  getExecutor(namespace, method) {
    return (...args) =>
      new Promise((resolve) => {
        const packet = { name: namespace, method, args };
        this.socket.send(JSON.stringify(packet));
        this.socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve(data);
        };
      });
  }

  build = (args) =>
    new Promise((resolve, reject) => {
      this.socket.onopen = () => resolve(args);
      this.socket.onclose = () => reject('Cannot connect to socket.');
    });
}

class ApiRPC {
  api = {};
  structure = {};
  structureMap = new Map();
  schemas = {};
  config = {};

  constructor(url) {
    this.transport = Transport.scaffold(url);
    this.api = {};
    // TODO решить какую структуру оставить tree или map
    this.structure = {};
    this.structureMap = new Map();
  }

  async syncApi() {
    const syncStruct = this.transport.getExecutor('_', 'introspect');
    /**
     * @name introspect
     * @param typing {boolean} Upload full information about the handle
     */
    const response = await syncStruct({ typing: true });
    const {
      ['#schemas']: schemas,
      ['#api']: config,
      ...structure
    } = response;
    this.schemas = schemas;
    this.config = config;
    const setMethod = (namespace, method) => this.transport.getExecutor(namespace, method);
    for (const path of Object.keys(structure)) {
      const keys = path.split('.');
      const method = keys.pop();
      const namespace = keys.join('.');
      const options = structure[path];
      // Structure
      objectSet(this.structure, path, { method, namespace, ...options });
      this.structureMap.set(path, { method, namespace, ...options });
      // RPC
      objectSet(this.api, path, setMethod(namespace, method));
    }
  }

  build = async () => {
    this.transport.build(this.api).then();
    await this.syncApi();
    return this.api;
  };
}

class Application {
  clients = {};
  rpc = {};

  constructor(options = {}) {
    if (!options.clients) options.clients = {};
    // Clients
    for (const [name, defs] of Object.entries(options.clients)) {
      if (typeof defs === 'string') this.rpc[name] = new ApiRPC(defs);
    }
  }

  async build() {
    for await (const [name, apiRpc] of Object.entries(this.rpc)) {
      this.clients[name] = await apiRpc.build();
    }
  }
}

(async () => {
  const app = new Application({
    clients: {
      http: 'http://localhost:3001',
      // ws: 'ws://localhost:3001',
    },
  });
  await app.build();

  console.log(app);
  window.rpc = app.clients;

  const str = JSON.stringify(app.rpc.http.structure, null, 2);
  const strTypes = JSON.stringify(app.rpc.http.schemas, null, 2);
  document.body.innerHTML = `
  <div style='display: flex;'>
    <pre>${str}</pre>
    <pre>${strTypes}</pre>
  </div>`;
})();
