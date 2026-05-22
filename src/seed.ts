import { db } from './firebase';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { VehicleStatus, ReservationStatus } from './types';

const vehicles = [
  { 
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
  { 
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
  { 
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
];

export async function seedData() {
  try {
    // 1. Seed Vehicles
    const vehiclesCol = collection(db, 'vehicles');
    const vehicleIds: string[] = [];
    for (const v of vehicles) {
      const docRef = await addDoc(vehiclesCol, v);
      vehicleIds.push(docRef.id);
    }
    
    // 2. Seed a Customer
    const customersCol = collection(db, 'customers');
    const customerDoc = await addDoc(customersCol, {
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
      tags: ['New']
    });

    // 3. Seed a Reservation
    const reservationsCol = collection(db, 'reservations');
    await addDoc(reservationsCol, {
      customerId: customerDoc.id,
      vehicleId: vehicleIds[0], // Tesla
      startDate: Timestamp.fromDate(new Date()),
      endDate: Timestamp.fromDate(new Date(Date.now() + 86400000 * 3)), // 3 days later
      status: ReservationStatus.CONFIRMED,
      totalAmount: 360,
      depositStatus: 'held'
    });
    
    // 4. Add a bootstrap admin marker
    await setDoc(doc(db, 'admins', 'bootstrap_check'), { initialized: true });
    
    console.log("Seeding completed successfully");
  } catch (e) {
    console.error("Error seeding data:", e);
  }
}
