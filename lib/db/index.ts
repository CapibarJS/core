// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const db = (options: any) => (entity: string) => ({
  async read() {
    return [];
  },

  async create(params = {}) {
    return { ...params };
  },

  async update() {
    return {};
  },

  async delete() {
    return;
  },
});
