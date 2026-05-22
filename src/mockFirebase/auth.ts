// Mock Firebase Auth Support
import { mockStore } from './store';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: {
    providerId: string;
    email: string | null;
    displayName?: string | null;
  }[];
}

class MockAuth {
  private _currentUser: User | null = null;

  constructor() {
    this._currentUser = mockStore.getCurrentUser();
    // Synchronize current user updates from store
    mockStore.registerAuthListener((user) => {
      this._currentUser = user;
    });
  }

  get currentUser(): User | null {
    return this._currentUser;
  }
}

export const getAuth = (app?: any) => {
  return new MockAuth();
};

export const onAuthStateChanged = (auth: any, callback: (user: User | null) => void) => {
  return mockStore.registerAuthListener(callback);
};

export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
}

export const signInWithPopup = async (authObj: any, provider: any) => {
  const mockEmail = 'operator@example.com';
  const mockUser: User = {
    uid: 'demo-super-admin-uid-1234',
    email: mockEmail,
    displayName: 'Super Admin',
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: [{ providerId: 'google.com', email: mockEmail }]
  };
  mockStore.setCurrentUser(mockUser);
  return { user: mockUser };
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, password: string) => {
  const normEmail = email.toLowerCase().trim();
  // Safe default access uid
  const uid = 'demo-uid-' + normEmail.replace(/[^a-z0-9]/g, '');
  const mockUser: User = {
    uid,
    email: email,
    displayName: email.split('@')[0].toUpperCase(),
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: [{ providerId: 'password', email: email }]
  };
  mockStore.setCurrentUser(mockUser);
  return { user: mockUser };
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, password: string) => {
  return signInWithEmailAndPassword(authObj, email, password);
};

export const updateProfile = async (user: any, profile: { displayName?: string; photoURL?: string }) => {
  if (user) {
    const updatedUser = { ...user, displayName: profile.displayName ?? user.displayName };
    mockStore.setCurrentUser(updatedUser);
  }
};

export const updateEmail = async (user: any, email: string) => {
  if (user) {
    const updatedUser = { ...user, email };
    mockStore.setCurrentUser(updatedUser);
  }
};

export const signOut = async (authObj: any) => {
  mockStore.setCurrentUser(null);
};
