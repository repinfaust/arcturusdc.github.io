import { TestSuiteConfig } from './utils/TestOrchestrator';

export const COMPREHENSIVE_TEST_CONFIG: TestSuiteConfig = {
  unitTests: [
    // Component Tests (20 tests)
    {
      name: 'EventCommentsSection Component Tests',
      category: 'components',
      files: ['src/components/EventCommentsSection.tsx'],
      coverage: true,
    },
    {
      name: 'GiftFormScreen Component Tests',
      category: 'components',
      files: ['src/screens/GiftFormScreen.tsx'],
      coverage: true,
    },
    {
      name: 'NotificationPreferencesScreen Component Tests',
      category: 'components',
      files: ['src/screens/NotificationPreferencesScreen.tsx'],
      coverage: true,
    },
    {
      name: 'InventoryScreen Component Tests',
      category: 'components',
      files: ['src/screens/InventoryScreen.tsx'],
      coverage: true,
    },
    {
      name: 'EventFormScreen Component Tests',
      category: 'components',
      files: ['src/screens/events/EventFormScreen.tsx'],
      coverage: true,
    },

    // Service Tests (15 tests)
    {
      name: 'Enhanced Notifications Service Tests',
      category: 'services',
      files: ['src/services/notifications.ts'],
      coverage: true,
    },
    {
      name: 'Firebase Service Tests',
      category: 'services',
      files: ['src/services/firebase.ts', 'src/services/firebase-native.ts'],
      coverage: true,
    },
    {
      name: 'Households Service Tests',
      category: 'services',
      files: ['src/services/households.ts'],
      coverage: true,
    },
    {
      name: 'Calendar Service Tests',
      category: 'services',
      files: ['src/services/calendar.ts'],
      coverage: true,
    },

    // Hook Tests (10 tests)
    {
      name: 'useReviewerAccess Hook Tests',
      category: 'hooks',
      files: ['src/hooks/useReviewerAccess.ts'],
      coverage: true,
    },
    {
      name: 'useNotifications Hook Tests',
      category: 'hooks',
      files: ['src/hooks/useNotifications.ts'],
      coverage: true,
    },
    {
      name: 'useHouseholds Hook Tests',
      category: 'hooks',
      files: ['src/hooks/useHouseholds.ts'],
      coverage: true,
    },
    {
      name: 'useEvents Hook Tests',
      category: 'hooks',
      files: ['src/hooks/useEvents.ts'],
      coverage: true,
    },

    // Utility Tests (5 tests)
    {
      name: 'File Validation Utilities Tests',
      category: 'utilities',
      files: ['src/utils/fileValidation.ts'],
      coverage: true,
    },
    {
      name: 'Calendar Utilities Tests',
      category: 'utilities',
      files: ['src/utils/calendar.ts'],
      coverage: true,
    },
  ],

  integrationTests: [
    // Feature Integration Tests (10 tests)
    {
      name: 'Event Creation to Comments Flow',
      category: 'feature_integration',
      scenario: 'event_to_comments_workflow',
      timeout: 30000,
    },
    {
      name: 'Handover to Inventory Update Flow',
      category: 'feature_integration',
      scenario: 'handover_inventory_workflow',
      timeout: 30000,
    },
    {
      name: 'Gift Reservation Workflow',
      category: 'feature_integration',
      scenario: 'gift_reservation_workflow',
      timeout: 25000,
    },

    // Data Flow Tests (8 tests)
    {
      name: 'Firebase Real-time Synchronization',
      category: 'data_flow',
      scenario: 'firebase_realtime_sync',
      timeout: 20000,
    },
    {
      name: 'React Query Cache Management',
      category: 'data_flow',
      scenario: 'react_query_cache',
      timeout: 15000,
    },
    {
      name: 'Offline Data Queue Processing',
      category: 'data_flow',
      scenario: 'offline_queue_processing',
      timeout: 25000,
    },

    // Real-time Sync Tests (4 tests)
    {
      name: 'Concurrent Comment Addition',
      category: 'realtime_sync',
      scenario: 'concurrent_comments',
      timeout: 20000,
    },
    {
      name: 'Gift Reservation Conflict',
      category: 'realtime_sync',
      scenario: 'gift_reservation_conflict',
      timeout: 15000,
    },

    // Navigation Flow Tests (3 tests)
    {
      name: 'Deep Link Navigation',
      category: 'navigation_flow',
      scenario: 'deep_link_navigation',
      timeout: 10000,
    },
  ],

  e2eTests: [
    // Existing 20 Maestro tests + 10 new tests
    {
      name: 'TC-021 Complete Document Vault Workflow',
      testFile: 'toume-test-pack/maestro/TC-021_Complete_Document_Vault_Workflow.yaml',
      tags: ['critical', 'documents'],
      timeout: 60000, // Reduced from 3 minutes to 1 minute
    },
    {
      name: 'TC-022 Enhanced Notification Preferences',
      testFile: 'toume-test-pack/maestro/TC-022_Enhanced_Notification_Preferences.yaml',
      tags: ['high', 'notifications'],
      timeout: 45000, // Reduced from 2 minutes to 45 seconds
    },
    {
      name: 'TC-023 Multi-Device Synchronization',
      testFile: 'toume-test-pack/maestro/TC-023_Multi_Device_Synchronization.yaml',
      tags: ['critical', 'sync'],
      devices: ['iPhone-14', 'iPhone-SE'],
      timeout: 90000, // Reduced from 4 minutes to 1.5 minutes
    },
    {
      name: 'TC-024 Offline Mode Functionality',
      testFile: 'toume-test-pack/maestro/TC-024_Offline_Mode_Functionality.yaml',
      tags: ['high', 'offline'],
      timeout: 60000, // Reduced from 3 minutes to 1 minute
    },
    {
      name: 'TC-025 Advanced Search and Filtering',
      testFile: 'toume-test-pack/maestro/TC-025_Advanced_Search_Filtering.yaml',
      tags: ['medium', 'search'],
      timeout: 45000, // Reduced from 2.5 minutes to 45 seconds
    },
  ],

  performanceTests: [
    // Startup Performance Tests (2 tests)
    {
      name: 'Cold App Startup Time',
      type: 'startup',
      baseline: true,
      thresholds: {
        startupTime: 3000, // 3 seconds
      },
    },
    {
      name: 'Warm App Resume Time',
      type: 'startup',
      thresholds: {
        startupTime: 1000, // 1 second
      },
    },

    // Memory Usage Tests (2 tests)
    {
      name: 'Large Circle Memory Usage',
      type: 'memory',
      thresholds: {
        memoryUsage: 150, // 150MB
      },
    },
    {
      name: 'Extended Usage Memory Stability',
      type: 'memory',
      thresholds: {
        memoryUsage: 200, // 200MB max during extended use
      },
    },

    // Battery Usage Tests (2 tests)
    {
      name: 'Battery Usage During Active Use',
      type: 'battery',
      thresholds: {
        batteryUsage: 5, // 5% per hour
      },
    },
    {
      name: 'Background Battery Usage',
      type: 'battery',
      thresholds: {
        batteryUsage: 1, // 1% per hour in background
      },
    },

    // Network Performance Tests (2 tests)
    {
      name: 'Network Efficiency Test',
      type: 'network',
      thresholds: {
        dataUsage: 10, // 10MB per session
      },
    },
    {
      name: 'Network Condition Adaptation',
      type: 'network',
      thresholds: {
        errorRate: 5, // 5% error rate max
      },
    },

    // Scalability Tests (2 tests)
    {
      name: 'Large Data Set Performance',
      type: 'scalability',
      thresholds: {
        renderTime: 500, // 500ms max render time
      },
    },
    {
      name: 'Concurrent User Load Test',
      type: 'scalability',
      thresholds: {
        responseTime: 2000, // 2 second max response time
      },
    },
  ],

  accessibilityTests: [
    // Screen Reader Tests (3 tests)
    {
      name: 'Complete App Navigation with Screen Reader',
      components: ['HomeScreen', 'EventFormScreen', 'GiftFormScreen', 'InventoryScreen'],
      wcagLevel: 'AA',
    },
    {
      name: 'Form Completion with Screen Reader',
      components: ['EventFormScreen', 'GiftFormScreen', 'WellbeingLogFormScreen'],
      wcagLevel: 'AA',
    },
    {
      name: 'Real-time Updates with Screen Reader',
      components: ['EventCommentsSection', 'NotificationCenter'],
      wcagLevel: 'AA',
    },

    // Keyboard Navigation Tests (2 tests)
    {
      name: 'Complete App Navigation with Keyboard Only',
      components: ['HomeScreen', 'InventoryScreen', 'GiftPlannerScreen'],
      wcagLevel: 'AA',
    },
    {
      name: 'Modal and Overlay Keyboard Handling',
      components: ['ConsentModal', 'EventDetailModal', 'GiftDetailModal'],
      wcagLevel: 'AA',
    },

    // Color Contrast and Touch Target Tests (3 tests)
    {
      name: 'Color Contrast Validation',
      components: ['All theme combinations'],
      wcagLevel: 'AA',
    },
    {
      name: 'Touch Target Size Validation',
      components: ['All interactive elements'],
      wcagLevel: 'AA',
    },
    {
      name: 'High Contrast Mode Compatibility',
      components: ['HomeScreen', 'EventFormScreen', 'InventoryScreen'],
      wcagLevel: 'AA',
    },
  ],

  securityTests: [
    // Authentication Tests (3 tests)
    {
      name: 'JWT Token Security',
      category: 'authentication',
      endpoints: ['/auth/login', '/auth/refresh', '/auth/logout'],
    },
    {
      name: 'Google OAuth Security',
      category: 'authentication',
      endpoints: ['/auth/google', '/auth/google/callback'],
    },
    {
      name: 'Session Management Security',
      category: 'authentication',
    },

    // Authorization Tests (3 tests)
    {
      name: 'Role-Based Access Control',
      category: 'authorization',
      endpoints: ['/api/circles', '/api/events', '/api/gifts'],
    },
    {
      name: 'Data Access Control',
      category: 'authorization',
    },
    {
      name: 'API Endpoint Security',
      category: 'authorization',
      endpoints: ['/api/*'],
    },

    // Data Protection Tests (3 tests)
    {
      name: 'Data Encryption Validation',
      category: 'data_protection',
    },
    {
      name: 'Privacy Control Enforcement',
      category: 'data_protection',
    },
    {
      name: 'Data Deletion Compliance',
      category: 'data_protection',
    },

    // File Upload Tests (3 tests)
    {
      name: 'File Type Validation',
      category: 'file_upload',
      endpoints: ['/api/upload'],
    },
    {
      name: 'Virus Scanning Integration',
      category: 'file_upload',
    },
    {
      name: 'File Access Security',
      category: 'file_upload',
    },
  ],

  failFast: false, // Continue running tests even if some fail
  parallel: true,  // Run tests in parallel where possible
  timeout: 120000, // 2 minute overall timeout (reduced from 5 minutes)
};

// Quick test configurations for different scenarios
export const QUICK_TEST_CONFIG: Partial<TestSuiteConfig> = {
  unitTests: COMPREHENSIVE_TEST_CONFIG.unitTests.slice(0, 5), // First 5 unit tests
  integrationTests: COMPREHENSIVE_TEST_CONFIG.integrationTests.slice(0, 3), // First 3 integration tests
  failFast: true,
  parallel: true,
  timeout: 60000, // 1 minute timeout
};

export const CRITICAL_TEST_CONFIG: Partial<TestSuiteConfig> = {
  e2eTests: COMPREHENSIVE_TEST_CONFIG.e2eTests.filter(test => 
    test.tags.includes('critical')
  ),
  performanceTests: COMPREHENSIVE_TEST_CONFIG.performanceTests.filter(test =>
    test.type === 'startup' || test.type === 'memory'
  ),
  securityTests: COMPREHENSIVE_TEST_CONFIG.securityTests.filter(test =>
    test.category === 'authentication' || test.category === 'authorization'
  ),
  failFast: true,
  parallel: false, // Run critical tests sequentially for reliability
  timeout: 180000, // 3 minute timeout (reduced from 10 minutes)
};
