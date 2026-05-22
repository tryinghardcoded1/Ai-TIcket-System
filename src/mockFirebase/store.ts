// Mock Firebase Reactive Local Store
import { VehicleStatus, ReservationStatus } from '../types';

export class Timestamp {
  seconds: number;
  nanoseconds: number;
  __type = 'Timestamp';

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }

  static fromDate(date: Date) {
    return new Timestamp(Math.floor(date.getTime() / 1000), (date.getTime() % 1000) * 1000000);
  }

  static now() {
    return Timestamp.fromDate(new Date());
  }

  toISOString() {
    return this.toDate().toISOString();
  }
}

// Convert serialized timestamp objects back to Timestamp instances
export function deserializeTimestamps(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(deserializeTimestamps);
  }
  if (typeof obj === 'object') {
    if (obj.__type === 'Timestamp' && typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
      return new Timestamp(obj.seconds, obj.nanoseconds);
    }
    // Handle serialized JS dates if any
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = deserializeTimestamps(obj[key]);
    }
    return newObj;
  }
  return obj;
}

// Convert Timestamp instances to serializable objects for local storage
export function serializeTimestamps(obj: any): any {
  if (!obj) return obj;
  if (obj instanceof Timestamp) {
    return { __type: 'Timestamp', seconds: obj.seconds, nanoseconds: obj.nanoseconds };
  }
  if (obj instanceof Date) {
    const ts = Timestamp.fromDate(obj);
    return { __type: 'Timestamp', seconds: ts.seconds, nanoseconds: ts.nanoseconds };
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps);
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = serializeTimestamps(obj[key]);
    }
    return newObj;
  }
  return obj;
}

// Default Seed Data
const DEFAULT_VEHICLES = {
  'vehicle_1': {
    plateNumber: 'BCD 4567',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    status: VehicleStatus.RENTED,
    dailyRate: 120,
    mileage: 12400,
    fuelLevel: 78,
    location: { lat: 39.9526, lng: -75.1652, speed: 78, heading: 180 },
    vin: '1FA6P8CF8...'
  },
  'vehicle_2': {
    plateNumber: 'EFG 8901',
    make: 'Rivian',
    model: 'R1S',
    year: 2024,
    status: VehicleStatus.AVAILABLE,
    dailyRate: 180,
    mileage: 2100,
    fuelLevel: 92,
    location: { lat: 39.9626, lng: -75.1552, speed: 0, heading: 45 },
    vin: '1HGCP22...'
  },
  'vehicle_3': {
    plateNumber: 'XYZ 1234',
    make: 'Porsche',
    model: 'Taycan',
    year: 2023,
    status: VehicleStatus.AVAILABLE,
    dailyRate: 250,
    mileage: 18900,
    fuelLevel: 88,
    location: { lat: 39.9426, lng: -75.1752, speed: 0, heading: 270 },
    vin: 'WP0AA2Y...'
  }
};

const DEFAULT_CUSTOMERS = {
  'customer_1': {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    address: {
      street: '123 Philly Lane',
      city: 'Philadelphia',
      state: 'PA',
      zip: '19102',
      country: 'USA'
    },
    birthday: { __type: 'Timestamp', seconds: 642816000, nanoseconds: 0 }, // 1990-05-15
    driverLicense: {
      number: 'PA-9988112',
      expiry: { __type: 'Timestamp', seconds: 1842816000, nanoseconds: 0 }
    },
    tags: ['New', 'Preferred Renter']
  }
};

const DEFAULT_RESERVATIONS = {
  'reservation_1': {
    customerId: 'customer_1',
    vehicleId: 'vehicle_1', // Tesla
    startDate: { __type: 'Timestamp', seconds: Math.floor(Date.now() / 1000) - 86400, nanoseconds: 0 }, // Started yesterday
    endDate: { __type: 'Timestamp', seconds: Math.floor(Date.now() / 1000) + 86400 * 2, nanoseconds: 0 }, // Ends in 2 days
    status: ReservationStatus.CONFIRMED,
    totalAmount: 360,
    depositStatus: 'held'
  }
};

const DEFAULT_ADMINS = {
  'bootstrap_check': { initialized: true }
};

const DEFAULT_STORE = {
  vehicles: DEFAULT_VEHICLES,
  customers: DEFAULT_CUSTOMERS,
  reservations: DEFAULT_RESERVATIONS,
  admins: DEFAULT_ADMINS,
  incidents: {},
  quotes: {},
  notifications: {},
  fcmTokens: {}
};

class FirebaseMockStore {
  private state: Record<string, Record<string, any>> = {};
  private listeners: Set<(collection: string) => void> = new Set();
  private authListeners: Set<(user: any) => void> = new Set();
  private currentUser: any = null;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem('philly_car_rental_db');
      if (stored) {
        this.state = JSON.parse(stored);
      } else {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STORE));
        this.save();
      }

      const storedAuth = localStorage.getItem('philly_car_rental_auth');
      if (storedAuth) {
        this.currentUser = JSON.parse(storedAuth);
      }
    } catch (e) {
      console.error('Failed to load mock firebase store:', e);
      this.state = JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
  }

  public save() {
    try {
      localStorage.setItem('philly_car_rental_db', JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save mock firebase store:', e);
    }
  }

  // --- Auth API ---
  public getCurrentUser() {
    return this.currentUser;
  }

  public setCurrentUser(user: any) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('philly_car_rental_auth', JSON.stringify(user));
    } else {
      localStorage.removeItem('philly_car_rental_auth');
    }
    this.notifyAuth();
  }

  public registerAuthListener(callback: (user: any) => void) {
    this.authListeners.add(callback);
    // Call immediately with current value
    callback(this.currentUser);
    return () => {
      this.authListeners.delete(callback);
    };
  }

  private notifyAuth() {
    this.authListeners.forEach(cb => cb(this.currentUser));
  }

  // --- Firestore API ---
  public getCollection(collectionName: string): Record<string, any> {
    if (!this.state[collectionName]) {
      this.state[collectionName] = {};
    }
    return this.state[collectionName];
  }

  public getDocument(collectionName: string, id: string): any | undefined {
    const col = this.getCollection(collectionName);
    return col[id];
  }

  public setDocument(collectionName: string, id: string, data: any, merge = false) {
    const col = this.getCollection(collectionName);
    const cleanedData = serializeTimestamps(data);
    
    if (merge && col[id]) {
      col[id] = { ...col[id], ...cleanedData };
    } else {
      col[id] = cleanedData;
    }
    this.save();
    this.notifyCollection(collectionName);
  }

  public deleteDocument(collectionName: string, id: string) {
    const col = this.getCollection(collectionName);
    if (col[id]) {
      delete col[id];
      this.save();
      this.notifyCollection(collectionName);
    }
  }

  public registerCollectionListener(collectionName: string, callback: () => void) {
    const wrapper = (changedCol: string) => {
      if (changedCol === collectionName) {
        callback();
      }
    };
    this.listeners.add(wrapper);
    return () => {
      this.listeners.delete(wrapper);
    };
  }

  private notifyCollection(collectionName: string) {
    this.listeners.forEach(cb => cb(collectionName));
  }

  public resetAllData() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STORE));
    this.save();
    // Notify all listeners
    Object.keys(this.state).forEach(collectionName => this.notifyCollection(collectionName));
  }
}

export const mockStore = new FirebaseMockStore();
