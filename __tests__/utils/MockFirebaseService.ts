import { jest } from '@jest/globals';

export interface MockCollection {
  docs: MockDoc[];
  size: number;
  empty: boolean;
  forEach: (callback: (doc: MockDoc) => void) => void;
}

export interface MockDoc {
  id: string;
  data: () => any;
  exists: () => boolean;
  ref: MockDocRef;
}

export interface MockDocRef {
  id: string;
  path: string;
  collection: (path: string) => MockCollectionRef;
  set: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  get: jest.MockedFunction<any>;
}

export interface MockCollectionRef {
  path: string;
  doc: (id?: string) => MockDocRef;
  add: jest.MockedFunction<any>;
  get: jest.MockedFunction<any>;
  where: jest.MockedFunction<any>;
  orderBy: jest.MockedFunction<any>;
  limit: jest.MockedFunction<any>;
}

export interface NetworkCondition {
  name: string;
  latency: number; // milliseconds
  errorRate: number; // 0-1
  timeoutRate: number; // 0-1
}

export class MockFirebaseService {
  private static instance: MockFirebaseService;
  private networkCondition: NetworkCondition = {
    name: 'normal',
    latency: 100,
    errorRate: 0,
    timeoutRate: 0,
  };
  private isOffline = false;
  private mockData = new Map<string, any>();
  private listeners = new Map<string, Function[]>();

  static getInstance(): MockFirebaseService {
    if (!MockFirebaseService.instance) {
      MockFirebaseService.instance = new MockFirebaseService();
    }
    return MockFirebaseService.instance;
  }

  // Network Simulation Methods
  simulateOffline(): void {
    this.isOffline = true;
    console.log('[MockFirebase] Simulating offline mode');
  }

  simulateOnline(): void {
    this.isOffline = false;
    console.log('[MockFirebase] Simulating online mode');
  }

  simulateSlowNetwork(): void {
    this.networkCondition = {
      name: 'slow',
      latency: 2000,
      errorRate: 0.1,
      timeoutRate: 0.05,
    };
    console.log('[MockFirebase] Simulating slow network');
  }

  simulateFastNetwork(): void {
    this.networkCondition = {
      name: 'fast',
      latency: 50,
      errorRate: 0,
      timeoutRate: 0,
    };
    console.log('[MockFirebase] Simulating fast network');
  }

  simulateUnstableNetwork(): void {
    this.networkCondition = {
      name: 'unstable',
      latency: 500,
      errorRate: 0.2,
      timeoutRate: 0.1,
    };
    console.log('[MockFirebase] Simulating unstable network');
  }

  setCustomNetworkCondition(condition: NetworkCondition): void {
    this.networkCondition = condition;
    console.log(`[MockFirebase] Custom network condition: ${condition.name}`);
  }

  // Mock Firestore Operations
  private async simulateNetworkDelay(): Promise<void> {
    if (this.isOffline) {
      throw new Error('Network request failed - offline');
    }

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, this.networkCondition.latency));

    // Simulate random errors
    if (Math.random() < this.networkCondition.errorRate) {
      throw new Error('Network request failed - simulated error');
    }

    // Simulate timeouts
    if (Math.random() < this.networkCondition.timeoutRate) {
      throw new Error('Network request failed - timeout');
    }
  }

  mockCollection(path: string): MockCollectionRef {
    const collectionRef: MockCollectionRef = {
      path,
      doc: (id?: string) => this.mockDoc(`${path}/${id || this.generateId()}`),
      add: jest.fn(async (data: any) => {
        await this.simulateNetworkDelay();
        const docId = this.generateId();
        const docPath = `${path}/${docId}`;
        this.mockData.set(docPath, { id: docId, ...data });
        return this.mockDoc(docPath);
      }),
      get: jest.fn(async () => {
        await this.simulateNetworkDelay();
        const docs = Array.from(this.mockData.entries())
          .filter(([key]) => key.startsWith(path + '/'))
          .map(([key, value]) => this.createMockDoc(key, value));
        
        return this.createMockCollection(docs);
      }),
      where: jest.fn(() => collectionRef), // Chainable
      orderBy: jest.fn(() => collectionRef), // Chainable
      limit: jest.fn(() => collectionRef), // Chainable
    };

    return collectionRef;
  }

  mockDoc(path: string): MockDocRef {
    const docRef: MockDocRef = {
      id: path.split('/').pop() || '',
      path,
      collection: (subPath: string) => this.mockCollection(`${path}/${subPath}`),
      set: jest.fn(async (data: any) => {
        await this.simulateNetworkDelay();
        this.mockData.set(path, { id: docRef.id, ...data });
        this.notifyListeners(path, data);
      }),
      update: jest.fn(async (data: any) => {
        await this.simulateNetworkDelay();
        const existing = this.mockData.get(path) || {};
        const updated = { ...existing, ...data };
        this.mockData.set(path, updated);
        this.notifyListeners(path, updated);
      }),
      delete: jest.fn(async () => {
        await this.simulateNetworkDelay();
        this.mockData.delete(path);
        this.notifyListeners(path, null);
      }),
      get: jest.fn(async () => {
        await this.simulateNetworkDelay();
        const data = this.mockData.get(path);
        return this.createMockDoc(path, data);
      }),
    };

    return docRef;
  }

  private createMockDoc(path: string, data: any): MockDoc {
    return {
      id: path.split('/').pop() || '',
      data: () => data,
      exists: () => !!data,
      ref: this.mockDoc(path),
    };
  }

  private createMockCollection(docs: MockDoc[]): MockCollection {
    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
      forEach: (callback: (doc: MockDoc) => void) => docs.forEach(callback),
    };
  }

  // Real-time listener simulation
  onSnapshot(path: string, callback: Function): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    this.listeners.get(path)!.push(callback);

    // Immediately call with current data
    const data = this.mockData.get(path);
    if (data) {
      setTimeout(() => callback(this.createMockDoc(path, data)), 0);
    }

    // Return unsubscribe function
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        const index = pathListeners.indexOf(callback);
        if (index > -1) {
          pathListeners.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(path: string, data: any): void {
    const listeners = this.listeners.get(path);
    if (listeners) {
      listeners.forEach(callback => {
        setTimeout(() => callback(this.createMockDoc(path, data)), 10);
      });
    }
  }

  // Real-time update simulation
  triggerRealtimeUpdate(path: string, data: any): void {
    this.mockData.set(path, data);
    this.notifyListeners(path, data);
    console.log(`[MockFirebase] Triggered real-time update for ${path}`);
  }

  // Multi-user simulation
  simulateMultiUserOperation(operations: Array<{
    path: string;
    operation: 'set' | 'update' | 'delete';
    data?: any;
    delay?: number;
  }>): Promise<void[]> {
    return Promise.all(
      operations.map(async (op, index) => {
        if (op.delay) {
          await new Promise(resolve => setTimeout(resolve, op.delay));
        }

        const docRef = this.mockDoc(op.path);
        
        switch (op.operation) {
          case 'set':
            return docRef.set(op.data);
          case 'update':
            return docRef.update(op.data);
          case 'delete':
            return docRef.delete();
        }
      })
    );
  }

  // Conflict simulation
  simulateConflict(path: string, user1Data: any, user2Data: any): void {
    // Simulate two users trying to update the same document
    setTimeout(() => {
      this.mockData.set(path, { ...user1Data, conflictedBy: 'user1' });
      this.notifyListeners(path, this.mockData.get(path));
    }, 50);

    setTimeout(() => {
      const existing = this.mockData.get(path);
      this.mockData.set(path, { ...existing, ...user2Data, conflictedBy: 'user2' });
      this.notifyListeners(path, this.mockData.get(path));
    }, 100);
  }

  // Data management
  seedData(path: string, data: any): void {
    this.mockData.set(path, data);
    console.log(`[MockFirebase] Seeded data at ${path}`);
  }

  clearData(): void {
    this.mockData.clear();
    this.listeners.clear();
    console.log('[MockFirebase] Cleared all mock data');
  }

  getData(path: string): any {
    return this.mockData.get(path);
  }

  getAllData(): Map<string, any> {
    return new Map(this.mockData);
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Auth simulation
  mockAuth() {
    return {
      currentUser: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      },
      signInWithCredential: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChanged: jest.fn(),
    };
  }

  // Functions simulation
  mockFunctions() {
    return {
      httpsCallable: jest.fn((name: string) => {
        return jest.fn(async (data: any) => {
          await this.simulateNetworkDelay();
          console.log(`[MockFirebase] Called function ${name} with data:`, data);
          
          // Simulate function responses based on function name
          switch (name) {
            case 'createCircleDirect':
              return { data: { circleId: this.generateId() } };
            case 'removeCircleMember':
              return { data: { success: true } };
            default:
              return { data: { success: true } };
          }
        });
      }),
    };
  }

  // Storage simulation
  mockStorage() {
    return {
      ref: jest.fn((path: string) => ({
        put: jest.fn(async (file: any) => {
          await this.simulateNetworkDelay();
          return {
            ref: { getDownloadURL: jest.fn(() => `https://mock-storage.com/${path}`) },
          };
        }),
        delete: jest.fn(async () => {
          await this.simulateNetworkDelay();
        }),
        getDownloadURL: jest.fn(async () => {
          await this.simulateNetworkDelay();
          return `https://mock-storage.com/${path}`;
        }),
      })),
    };
  }

  // Reset to default state
  reset(): void {
    this.networkCondition = {
      name: 'normal',
      latency: 100,
      errorRate: 0,
      timeoutRate: 0,
    };
    this.isOffline = false;
    this.clearData();
    console.log('[MockFirebase] Reset to default state');
  }
}

// Export singleton instance
export const mockFirebaseService = MockFirebaseService.getInstance();
