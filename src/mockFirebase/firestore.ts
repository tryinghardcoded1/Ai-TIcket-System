// Mock Firebase Firestore Support
import { mockStore, Timestamp, deserializeTimestamps } from './store';

export { Timestamp };

export const serverTimestamp = () => {
  return Timestamp.now();
};

export const getFirestore = (app?: any) => {
  return { name: '[MockFirestore]' };
};

export const initializeFirestore = (app: any, config: any, databaseId?: string) => {
  return { name: '[MockFirestore]' };
};

export class CollectionReference {
  collectionName: string;
  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }
}

export class DocumentReference {
  collectionName: string;
  docId: string;
  constructor(collectionName: string, docId: string) {
    this.collectionName = collectionName;
    this.docId = docId;
  }
}

export class DocumentSnapshot {
  id: string;
  private rawData: any;
  constructor(id: string, rawData: any) {
    this.id = id;
    this.rawData = deserializeTimestamps(rawData);
  }

  exists() {
    return this.rawData !== undefined && this.rawData !== null;
  }

  data() {
    return this.rawData ? { ...this.rawData } : undefined;
  }
}

export class QuerySnapshot {
  docs: DocumentSnapshot[];
  constructor(docs: DocumentSnapshot[]) {
    this.docs = docs;
  }

  forEach(callback: (doc: DocumentSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

export const collection = (db: any, path: string) => {
  return new CollectionReference(path);
};

export const doc = (dbOrCollection: any, pathOrCreateId: string, docId?: string) => {
  if (dbOrCollection instanceof CollectionReference) {
    return new DocumentReference(dbOrCollection.collectionName, pathOrCreateId);
  } else if (docId) {
    return new DocumentReference(pathOrCreateId, docId);
  } else {
    // E.g. doc(db, 'collection/id')
    const parts = pathOrCreateId.split('/');
    return new DocumentReference(parts[0], parts.slice(1).join('/'));
  }
};

// Constraint creators
export const where = (field: string, op: string, value: any) => {
  return { type: 'where', field, op, value };
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return { type: 'orderBy', field, direction };
};

export const limit = (amount: number) => {
  return { type: 'limit', amount };
};

export class Query {
  collectionName: string;
  constraints: any[];

  constructor(collectionName: string, constraints: any[]) {
    this.collectionName = collectionName;
    this.constraints = constraints;
  }
}

export const query = (collectionRef: CollectionReference, ...constraints: any[]) => {
  return new Query(collectionRef.collectionName, constraints);
};

// Internal utility to apply query constraints
function evaluateQuery(targetCollection: string, constraints: any[]): DocumentSnapshot[] {
  const colData = mockStore.getCollection(targetCollection);
  const items = Object.keys(colData).map(id => ({
    id,
    ...colData[id]
  }));

  let filtered = [...items];

  for (const c of constraints) {
    if (!c) continue;
    if (c.type === 'where') {
      const { field, op, value } = c;
      filtered = filtered.filter(item => {
        const itemVal = item[field];
        if (op === '==' || op === '===') return itemVal === value;
        if (op === '!=') return itemVal !== value;
        if (op === '>') return itemVal > value;
        if (op === '>=') return itemVal >= value;
        if (op === '<') return itemVal < value;
        if (op === '<=') return itemVal <= value;
        if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(value);
        return true;
      });
    } else if (c.type === 'orderBy') {
      const { field, direction } = c;
      filtered.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        // Normalise timestamps for sorting
        if (valA && typeof valA === 'object' && valA.__type === 'Timestamp') {
          valA = valA.seconds * 1000 + valA.nanoseconds / 1000000;
        }
        if (valB && typeof valB === 'object' && valB.__type === 'Timestamp') {
          valB = valB.seconds * 1000 + valB.nanoseconds / 1000000;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (c.type === 'limit') {
      filtered = filtered.slice(0, c.amount);
    }
  }

  return filtered.map(item => {
    const { id, ...data } = item;
    return new DocumentSnapshot(id, data);
  });
}

// Write/Read Operations
export const addDoc = async (collectionRef: CollectionReference, data: any) => {
  const id = 'doc_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  mockStore.setDocument(collectionRef.collectionName, id, data);
  return new DocumentReference(collectionRef.collectionName, id);
};

export const setDoc = async (docRef: DocumentReference, data: any, options?: { merge?: boolean }) => {
  mockStore.setDocument(docRef.collectionName, docRef.docId, data, options?.merge);
};

export const updateDoc = async (docRef: DocumentReference, data: any) => {
  mockStore.setDocument(docRef.collectionName, docRef.docId, data, true);
};

export const deleteDoc = async (docRef: DocumentReference) => {
  mockStore.deleteDocument(docRef.collectionName, docRef.docId);
};

export const getDoc = async (docRef: DocumentReference) => {
  const data = mockStore.getDocument(docRef.collectionName, docRef.docId);
  return new DocumentSnapshot(docRef.docId, data);
};

export const getDocFromServer = async (docRef: DocumentReference) => {
  return getDoc(docRef);
};

export const getDocs = async (queryOrCollection: Query | CollectionReference) => {
  const colName = queryOrCollection.collectionName;
  const constraints = queryOrCollection instanceof Query ? queryOrCollection.constraints : [];
  const snaps = evaluateQuery(colName, constraints);
  return new QuerySnapshot(snaps);
};

export const onSnapshot = (
  queryOrCollection: Query | CollectionReference,
  onNext: (snapshot: QuerySnapshot) => void,
  onError?: (error: any) => void
) => {
  const colName = queryOrCollection.collectionName;
  const constraints = queryOrCollection instanceof Query ? queryOrCollection.constraints : [];

  const trigger = () => {
    try {
      const snaps = evaluateQuery(colName, constraints);
      onNext(new QuerySnapshot(snaps));
    } catch (err) {
      if (onError) onError(err);
    }
  };

  // Run on startup
  trigger();

  // Register in global registry for updates
  return mockStore.registerCollectionListener(colName, trigger);
};
