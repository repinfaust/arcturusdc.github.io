import { Timestamp } from 'firebase/firestore';
import {
  Household,
  ChildProfile,
  HouseholdEvent,
  HouseholdMember,
  Gift,
  InventoryItem,
  WellbeingLog,
  UserProfile,
  UserRole,
  EventPrivacy,
  EventResponsibility,
  GiftStatus,
  WellbeingMood,
  WellbeingTopic,
  WellbeingVisibility,
  InventoryLocation,
  InventoryMobility,
} from '../../src/types/firestore';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  users: UserProfile[];
  circles: Household[];
  events: HouseholdEvent[];
  gifts: Gift[];
  inventory: InventoryItem[];
  wellbeingLogs: WellbeingLog[];
}

export interface MultiUserScenario {
  userCount: number;
  operations: Array<{
    user: number;
    action: string;
    data: any;
    delay?: number;
  }>;
  expectedOutcome: string;
}

export class TestDataFactory {
  private static instance: TestDataFactory;
  private idCounter = 1;

  static getInstance(): TestDataFactory {
    if (!TestDataFactory.instance) {
      TestDataFactory.instance = new TestDataFactory();
    }
    return TestDataFactory.instance;
  }

  private generateId(prefix: string = 'test'): string {
    return `${prefix}-${this.idCounter++}-${Date.now()}`;
  }

  private createTimestamp(offsetDays: number = 0): Timestamp {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return Timestamp.fromDate(date);
  }

  // User Profile Generation
  createTestUser(role: UserRole, options?: Partial<UserProfile>): UserProfile {
    const id = this.generateId('user');
    const baseEmail = `test.${role}+${Date.now()}@tou.me`;
    
    return {
      id,
      email: baseEmail,
      displayName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      createdAt: this.createTimestamp(-30),
      updatedAt: this.createTimestamp(),
      ...options,
    };
  }

  createTestUsers(count: number, role: UserRole = 'parent'): UserProfile[] {
    return Array.from({ length: count }, (_, i) => 
      this.createTestUser(role, { 
        displayName: `Test ${role} ${i + 1}`,
        email: `test.${role}${i + 1}+${Date.now()}@tou.me`
      })
    );
  }

  // Household Generation
  createTestCircle(options?: Partial<Household>): Household {
    const id = this.generateId('circle');
    
    return {
      id,
      name: 'Test Family Circle',

      createdBy: this.generateId('user'),
      createdAt: this.createTimestamp(-7),
      updatedAt: this.createTimestamp(),
      memberIds: [],
      ...options,
    };
  }

  // Child Profile Generation
  createTestChild(circleId: string, options?: Partial<ChildProfile>): ChildProfile {
    const id = this.generateId('child');
    const names = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Avery'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    return {
      id,
      circleId,
      name: randomName,
      birthdate: '2015-06-15', // 8 years old
      createdAt: this.createTimestamp(-7),
      updatedAt: this.createTimestamp(),
      ...options,
    };
  }

  createTestChildren(circleId: string, count: number): ChildProfile[] {
    return Array.from({ length: count }, (_, i) => 
      this.createTestChild(circleId, { 
        name: `Test Child ${i + 1}`,
        birthdate: `201${5 + i}-0${(i % 12) + 1}-15`
      })
    );
  }

  // Household Member Generation
  createTestMember(circleId: string, userId: string, role: UserRole = 'parent'): HouseholdMember {
    return {
      id: this.generateId('member'),
      circleId,
      userId,
      role,
      status: 'active',
      createdAt: this.createTimestamp(-7),
      updatedAt: this.createTimestamp(),
    };
  }

  // Event Generation
  createTestEvent(circleId: string, options?: Partial<HouseholdEvent>): HouseholdEvent {
    const id = this.generateId('event');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(14, 0, 0, 0); // 2 PM tomorrow
    
    const endDate = new Date(startDate);
    endDate.setHours(16, 0, 0, 0); // 4 PM tomorrow
    
    return {
      id,
      circleId,
      title: 'Test Event',
      description: 'Automated test event for comprehensive testing',
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      allDay: false,
      type: 'standard',
      privacy: 'all_adults',
      responsibility: 'all_adults',
      recurrence: 'none',
      source: 'local',
      createdBy: this.generateId('user'),
      createdAt: this.createTimestamp(),
      updatedAt: this.createTimestamp(),
      ...options,
    };
  }

  createTestEvents(circleId: string, count: number): HouseholdEvent[] {
    return Array.from({ length: count }, (_, i) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + i + 1);
      startDate.setHours(14 + (i % 8), 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 2);
      
      return this.createTestEvent(circleId, {
        title: `Test Event ${i + 1}`,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      });
    });
  }

  // Gift Generation
  createTestGift(circleId: string, childId: string, options?: Partial<Gift>): Gift {
    const id = this.generateId('gift');
    const giftNames = [
      'LEGO Architecture Set',
      'Art Supplies Kit',
      'Science Experiment Kit',
      'Board Game Collection',
      'Sports Equipment',
      'Musical Instrument',
    ];
    const randomGift = giftNames[Math.floor(Math.random() * giftNames.length)];
    
    return {
      id,
      circleId,
      childId,
      wishlistId: `${circleId}_${childId}`,
      title: randomGift,
      description: `Test gift for comprehensive testing: ${randomGift}`,
      priority: 'medium',
      status: 'open' as GiftStatus,
      visibility: 'child_visible',
      estimatedPrice: Math.floor(Math.random() * 100) + 20,
      addedBy: this.generateId('user'),
      addedAt: this.createTimestamp(-3),
      updatedAt: this.createTimestamp(),
      ...options,
    };
  }

  createTestGifts(circleId: string, childId: string, count: number): Gift[] {
    return Array.from({ length: count }, (_, i) => 
      this.createTestGift(circleId, childId, {
        title: `Test Gift ${i + 1}`,
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
      })
    );
  }

  // Inventory Generation
  createTestInventoryItem(circleId: string, options?: Partial<InventoryItem>): InventoryItem {
    const id = this.generateId('inventory');
    const itemNames = [
      'School Backpack',
      'Soccer Cleats',
      'Winter Coat',
      'Lunch Box',
      'Tablet',
      'Stuffed Animal',
      'Homework Folder',
    ];
    const randomItem = itemNames[Math.floor(Math.random() * itemNames.length)];
    
    return {
      id,
      circleId,
      name: randomItem,
      currentLocation: 'home_a' as InventoryLocation,
      quantity: 1,
      mobility: 'mobile' as InventoryMobility,
      needed: false,
      createdAt: this.createTimestamp(-14),
      updatedAt: this.createTimestamp(),
      ...options,
    };
  }

  createTestInventory(circleId: string, count: number): InventoryItem[] {
    const locations: InventoryLocation[] = ['home_a', 'home_b', 'with_child', 'both', 'other'];
    
    return Array.from({ length: count }, (_, i) => 
      this.createTestInventoryItem(circleId, {
        name: `Test Item ${i + 1}`,
        currentLocation: locations[i % locations.length],
        mobility: i % 3 === 0 ? 'sticky' : 'mobile',
      })
    );
  }

  // Wellbeing Log Generation
  createTestWellbeingLog(circleId: string, childId: string, options?: Partial<WellbeingLog>): WellbeingLog {
    const id = this.generateId('wellbeing');
    const moods: WellbeingMood[] = ['great', 'good', 'ok', 'difficult', 'very_difficult'];
    const topics: WellbeingTopic[] = ['school', 'home_life', 'friends', 'mood', 'other'];
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    
    return {
      id,
      circleId,
      childId,
      date: date.toISOString().split('T')[0],
      topic: topics[Math.floor(Math.random() * topics.length)],
      mood: moods[Math.floor(Math.random() * moods.length)],
      visibility: 'all_adults' as WellbeingVisibility,
      createdBy: this.generateId('user'),
      createdAt: this.createTimestamp(-1),
      updatedAt: this.createTimestamp(),
      ...options,
    };
  }

  createTestWellbeingLogs(circleId: string, childId: string, count: number): WellbeingLog[] {
    return Array.from({ length: count }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      return this.createTestWellbeingLog(circleId, childId, {
        date: date.toISOString().split('T')[0],
        note: `Test wellbeing log entry ${i + 1}`,
      });
    });
  }

  // Complex Scenario Generation
  createMultiUserScenario(scenarioType: 'concurrent_editing' | 'permission_testing' | 'real_time_sync'): TestScenario {
    const circleId = this.generateId('circle');
    const users = this.createTestUsers(3, 'parent');
    const children = this.createTestChildren(circleId, 2);
    
    const baseScenario = {
      id: this.generateId('scenario'),
      name: `Multi-User ${scenarioType.replace('_', ' ')} Test`,
      description: `Comprehensive test scenario for ${scenarioType}`,
      users,
      circles: [this.createTestCircle({ id: circleId })],
      events: this.createTestEvents(circleId, 5),
      gifts: children.flatMap(child => this.createTestGifts(circleId, child.id, 3)),
      inventory: this.createTestInventory(circleId, 10),
      wellbeingLogs: children.flatMap(child => this.createTestWellbeingLogs(circleId, child.id, 5)),
    };

    return baseScenario;
  }

  createConcurrentEditingScenario(): MultiUserScenario {
    return {
      userCount: 3,
      operations: [
        { user: 0, action: 'addComment', data: { text: 'First comment from user 1' } },
        { user: 1, action: 'addComment', data: { text: 'Second comment from user 2' }, delay: 100 },
        { user: 2, action: 'addComment', data: { text: 'Third comment from user 3' }, delay: 200 },
        { user: 0, action: 'editEvent', data: { title: 'Updated by user 1' }, delay: 300 },
        { user: 1, action: 'editEvent', data: { description: 'Updated by user 2' }, delay: 350 },
      ],
      expectedOutcome: 'All comments appear in correct order and event updates are merged correctly',
    };
  }

  createPermissionTestingScenario(): MultiUserScenario {
    return {
      userCount: 3,
      operations: [
        { user: 0, action: 'createPrivateEvent', data: { privacy: 'private' } }, // Parent
        { user: 1, action: 'attemptViewPrivateEvent', data: {} }, // Trusted Adult - should fail
        { user: 2, action: 'attemptDeleteCircle', data: {} }, // Child - should fail
        { user: 0, action: 'changeUserRole', data: { userId: 1, role: 'parent' } },
        { user: 1, action: 'attemptViewPrivateEvent', data: {} }, // Now should succeed
      ],
      expectedOutcome: 'Permission controls work correctly based on user roles',
    };
  }

  createRealTimeSyncScenario(): MultiUserScenario {
    return {
      userCount: 2,
      operations: [
        { user: 0, action: 'reserveGift', data: { giftId: 'gift-1' } },
        { user: 1, action: 'reserveGift', data: { giftId: 'gift-1' }, delay: 50 },
        { user: 0, action: 'createEvent', data: { title: 'New Event' } },
        { user: 1, action: 'viewEvents', data: {}, delay: 100 },
      ],
      expectedOutcome: 'Only first user can reserve gift, second user sees real-time event update',
    };
  }

  // Performance Test Data
  createLargeDataSet(circleId: string): {
    members: HouseholdMember[];
    events: HouseholdEvent[];
    comments: any[];
    attachments: any[];
  } {
    const members = Array.from({ length: 20 }, (_, i) => 
      this.createTestMember(circleId, this.generateId('user'), i < 10 ? 'parent' : 'trusted_adult')
    );

    const events = Array.from({ length: 500 }, (_, i) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (i % 365) - 180); // Spread over a year
      startDate.setHours(9 + (i % 12), 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1 + (i % 3));
      
      return this.createTestEvent(circleId, {
        title: `Performance Test Event ${i + 1}`,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      });
    });

    const comments = Array.from({ length: 1000 }, (_, i) => ({
      id: this.generateId('comment'),
      eventId: events[i % events.length].id,
      authorId: members[i % members.length].userId,
      text: `Performance test comment ${i + 1}`,
      createdAt: this.createTimestamp(-Math.floor(i / 10)),
    }));

    const attachments = Array.from({ length: 100 }, (_, i) => ({
      id: this.generateId('attachment'),
      commentId: comments[i * 10].id,
      filename: `test-file-${i + 1}.pdf`,
      size: Math.floor(Math.random() * 5000000) + 100000, // 100KB to 5MB
      mimeType: 'application/pdf',
    }));

    return { members, events, comments, attachments };
  }

  // Cleanup utilities
  reset(): void {
    this.idCounter = 1;
  }

  // Realistic demo data for reviewer access
  createReviewerDemoData(): TestScenario {
    const circleId = 'demo-circle-reviewer';
    const users = [
      this.createTestUser('parent', { 
        id: 'demo-parent-1',
        displayName: 'Sarah Johnson',
        email: 'sarah.demo@tou.me'
      }),
      this.createTestUser('parent', { 
        id: 'demo-parent-2',
        displayName: 'Mike Chen',
        email: 'mike.demo@tou.me'
      }),
      this.createTestUser('trusted_adult', { 
        id: 'demo-grandparent',
        displayName: 'Grandma Rose',
        email: 'rose.demo@tou.me'
      }),
    ];

    const children = [
      this.createTestChild(circleId, {
        id: 'demo-child-1',
        name: 'Emma',
        birthdate: '2015-03-15',
      }),
      this.createTestChild(circleId, {
        id: 'demo-child-2',
        name: 'Lucas',
        birthdate: '2017-08-22',
      }),
    ];

    const circle = this.createTestCircle({
      id: circleId,
      name: 'Demo Family',

      memberIds: users.map(u => u.id),
    });

    // Create realistic events
    const events = [
      this.createTestEvent(circleId, {
        title: 'School Pickup',
        type: 'handover',
        handoverKind: 'pickup',
        handoverChildIds: [children[0].id],
      }),
      this.createTestEvent(circleId, {
        title: 'Soccer Practice',
        description: 'Weekly soccer practice at the community center',
        type: 'standard',
      }),
      this.createTestEvent(circleId, {
        title: 'Parent-Teacher Conference',
        privacy: 'selected_adults',
        visibleMemberIds: [users[0].id, users[1].id],
      }),
    ];

    // Create realistic gifts
    const gifts = [
      this.createTestGift(circleId, children[0].id, {
        title: 'Art Supplies Set',
        priority: 'high',
        estimatedPrice: 45,
      }),
      this.createTestGift(circleId, children[1].id, {
        title: 'LEGO Creator Set',
        priority: 'medium',
        estimatedPrice: 89,
        status: 'reserved',
        reservedBy: users[1].id,
      }),
    ];

    // Create realistic inventory
    const inventory = [
      this.createTestInventoryItem(circleId, {
        name: 'School Backpack',
        currentLocation: 'home_a',
        childIds: [children[0].id],
      }),
      this.createTestInventoryItem(circleId, {
        name: 'Soccer Cleats',
        currentLocation: 'with_child',
        childIds: [children[1].id],
        needed: true,
      }),
    ];

    return {
      id: 'reviewer-demo',
      name: 'App Store Reviewer Demo',
      description: 'Realistic demo data for app store reviewers',
      users,
      circles: [circle],
      events,
      gifts,
      inventory,
      wellbeingLogs: [],
    };
  }
}

// Export singleton instance
export const testDataFactory = TestDataFactory.getInstance();
