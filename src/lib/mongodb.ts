export interface MongoDBCollection {
  find: (query: any) => any;
  findOne: (query: any) => Promise<any>;
  insertOne: (doc: any) => Promise<{ insertedId: any }>;
  insertMany: (docs: any[]) => Promise<any>;
  updateOne: (query: any, update: any, options?: any) => Promise<any>;
  findOneAndUpdate: (query: any, update: any, options?: any) => Promise<any>;
  deleteOne: (query: any) => Promise<{ deletedCount: number }>;
  countDocuments: () => Promise<number>;
  createIndex: (fields: any, options?: any) => Promise<void>;
}

class LocalStorageCollection implements MongoDBCollection {
  constructor(private collectionName: string) {}

  private getAll(): any[] {
    const data = localStorage.getItem(`mongodb_${this.collectionName}`);
    return data ? JSON.parse(data) : [];
  }

  private saveAll(data: any[]) {
    localStorage.setItem(`mongodb_${this.collectionName}`, JSON.stringify(data));
  }

  find(query: any = {}) {
    return {
      sort: (sort: any) => ({
        toArray: () => {
          let results = this.getAll().filter((doc) => this.matchesQuery(doc, query));
          const sortKey = Object.keys(sort)[0];
          if (sortKey) {
            results.sort((a, b) => {
              const aVal = a[sortKey];
              const bVal = b[sortKey];
              return sort[sortKey] === 1 ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
            });
          }
          return Promise.resolve(results);
        }
      }),
      project: (projection: any) => ({
        toArray: () => {
          const results = this.getAll().filter((doc) => this.matchesQuery(doc, query));
          return Promise.resolve(results.map((doc) => this.applyProjection(doc, projection)));
        }
      }),
      limit: (limit: number) => ({
        toArray: async () => {
          let results = this.getAll().filter((doc) => this.matchesQuery(doc, query));
          return results.slice(0, limit);
        }
      }),
      toArray: async () => {
        return this.getAll().filter((doc) => this.matchesQuery(doc, query));
      }
    };
  }

  async findOne(query: any): Promise<any> {
    const all = this.getAll();
    return all.find((doc) => this.matchesQuery(doc, query)) || null;
  }

  async insertOne(doc: any) {
    const all = this.getAll();
    const id = `${this.collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docWithId = { _id: id, ...doc };
    all.push(docWithId);
    this.saveAll(all);
    return { insertedId: id };
  }

  async insertMany(docs: any[]) {
    const all = this.getAll();
    const inserted = docs.map((doc) => {
      const id = `${this.collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docWithId = { _id: id, ...doc };
      all.push(docWithId);
      return docWithId;
    });
    this.saveAll(all);
    return { insertedIds: inserted.map((d) => d._id) };
  }

  async updateOne(query: any, update: any, options?: any) {
    const all = this.getAll();
    const index = all.findIndex((doc) => this.matchesQuery(doc, query));

    if (index === -1) {
      if (options?.upsert) {
        const docWithId = { _id: `${this.collectionName}_${Date.now()}`, ...query, ...update.$set };
        all.push(docWithId);
        this.saveAll(all);
        return { matchedCount: 0, upsertedId: docWithId._id };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }

    all[index] = { ...all[index], ...update.$set };
    this.saveAll(all);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async findOneAndUpdate(query: any, update: any, options?: any) {
    const all = this.getAll();
    const index = all.findIndex((doc) => this.matchesQuery(doc, query));

    if (index === -1) {
      return { value: null };
    }

    const updated = { ...all[index], ...update.$set };
    all[index] = updated;
    this.saveAll(all);

    return {
      value: options?.returnDocument === 'after' ? updated : all[index]
    };
  }

  async deleteOne(query: any) {
    const all = this.getAll();
    const index = all.findIndex((doc) => this.matchesQuery(doc, query));

    if (index === -1) {
      return { deletedCount: 0 };
    }

    all.splice(index, 1);
    this.saveAll(all);
    return { deletedCount: 1 };
  }

  async countDocuments() {
    return this.getAll().length;
  }

  async createIndex() {
    return Promise.resolve();
  }

  private matchesQuery(doc: any, query: any): boolean {
    if (Object.keys(query).length === 0) return true;

    for (const key in query) {
      if (query[key].$or) {
        if (!query[key].$or.some((condition: any) => this.matchesQuery(doc, condition))) {
          return false;
        }
      } else if (typeof query[key] === 'object' && query[key].$in) {
        if (!query[key].$in.includes(doc[key])) {
          return false;
        }
      } else if (doc[key] !== query[key]) {
        return false;
      }
    }
    return true;
  }

  private applyProjection(doc: any, projection: any): any {
    const result: any = {};
    for (const key in projection) {
      if (projection[key] === 1) {
        result[key] = doc[key];
      }
    }
    return result;
  }
}

let database: { [key: string]: MongoDBCollection } = {};

export async function connectToDatabase() {
  return Promise.resolve();
}

export function getCollection(name: string): MongoDBCollection {
  if (!database[name]) {
    database[name] = new LocalStorageCollection(name);
  }
  return database[name];
}

export function getDatabase() {
  return {
    collection: (name: string) => getCollection(name),
    listCollections: () => ({
      toArray: async () => Object.keys(database).map((name) => ({ name }))
    })
  };
}

export async function disconnectDatabase() {
  return Promise.resolve();
}
