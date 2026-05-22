// Mock Firebase App Initialization Support
export const initializeApp = (config?: any) => {
  return {
    name: '[MockFirebaseApp]',
    options: config || {},
    automaticDataCollectionEnabled: false,
  };
};

export interface FirebaseApp {
  name: string;
  options: any;
  automaticDataCollectionEnabled: boolean;
}
