/**
 * Skill Mode Configuration for ApexTwin
 * Controls which fields are visible based on rider experience level
 */

export const EXPERIENCE_LEVELS = {
  novice: {
    label: 'Novice',
    description: 'Simple logging: pressures, lap times, confidence.',
    icon: '○',
    showFields: [
      'tyrePressures',
      'lapTimes',
      'confidence',
      'notes',
    ],
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Add tyres, gearing, basic suspension.',
    icon: '◐',
    showFields: [
      'tyrePressures',
      'tyreCompounds',
      'tyreSizes',
      'gearing',
      'suspensionBasic',
      'lapTimes',
      'confidence',
      'notes',
      'weatherManual',
    ],
  },
  pro: {
    label: 'Pro',
    description: 'Full setup: suspension, electronics, tyres, gearing.',
    icon: '●',
    showFields: [
      'tyrePressures',
      'tyreCompounds',
      'tyreSizes',
      'tyreTemps',
      'suspensionBasic',
      'suspensionAdvanced',
      'electronics',
      'gearing',
      'chainLength',
      'lapTimes',
      'confidence',
      'notes',
      'advancedNotes',
      'weatherManual',
    ],
  },
};

/**
 * Field definitions with labels and groupings
 */
export const FIELD_DEFINITIONS = {
  tyrePressures: {
    label: 'Tyre Pressures',
    group: 'tyres',
    fields: ['tirePressureFrontColdPsi', 'tirePressureRearColdPsi', 'tirePressureFrontHotPsi', 'tirePressureRearHotPsi'],
  },
  tyreCompounds: {
    label: 'Tyre Compounds',
    group: 'tyres',
    fields: ['tyreBrandFront', 'tyreCompoundFront', 'tyreBrandRear', 'tyreCompoundRear'],
  },
  tyreSizes: {
    label: 'Tyre Sizes',
    group: 'tyres',
    fields: ['tireSizeFront', 'tireSizeRear'],
  },
  tyreTemps: {
    label: 'Tyre Temperatures',
    group: 'tyres',
    fields: ['tyresTempFront', 'tyresTempRear'],
  },
  suspensionBasic: {
    label: 'Basic Suspension',
    group: 'suspension',
    fields: ['suspensionFrontRebound', 'suspensionRearRebound'],
  },
  suspensionAdvanced: {
    label: 'Advanced Suspension',
    group: 'suspension',
    fields: ['suspensionFrontCompression', 'suspensionRearCompression', 'suspensionFrontPreload', 'suspensionRearPreload'],
  },
  electronics: {
    label: 'Electronics',
    group: 'electronics',
    fields: ['tractionControl', 'engineMap', 'absLevel', 'wheelieControl'],
  },
  gearing: {
    label: 'Gearing',
    group: 'drivetrain',
    fields: ['frontSprocket', 'rearSprocket'],
  },
  chainLength: {
    label: 'Chain Length',
    group: 'drivetrain',
    fields: ['chainLength'],
  },
  lapTimes: {
    label: 'Lap Times',
    group: 'performance',
    fields: ['fastestLap', 'lapsCompleted'],
  },
  confidence: {
    label: 'Confidence',
    group: 'feel',
    fields: ['confidence'],
  },
  notes: {
    label: 'Session Notes',
    group: 'notes',
    fields: ['notes'],
  },
  advancedNotes: {
    label: 'Technical Notes',
    group: 'notes',
    fields: ['technicalNotes', 'setupChanges'],
  },
  weatherManual: {
    label: 'Weather Override',
    group: 'conditions',
    fields: ['weather', 'trackTemp', 'airTemp'],
  },
};

/**
 * Helper to check if a field group is visible for a given experience level
 */
export function isFieldVisible(experienceLevel, fieldId) {
  const level = EXPERIENCE_LEVELS[experienceLevel] || EXPERIENCE_LEVELS.novice;
  return level.showFields.includes(fieldId);
}

/**
 * Get all visible field IDs for an experience level
 */
export function getVisibleFields(experienceLevel) {
  const level = EXPERIENCE_LEVELS[experienceLevel] || EXPERIENCE_LEVELS.novice;
  return level.showFields;
}

/**
 * Get hidden fields when switching from one level to another
 */
export function getHiddenFields(fromLevel, toLevel) {
  const fromFields = getVisibleFields(fromLevel);
  const toFields = getVisibleFields(toLevel);
  return fromFields.filter(f => !toFields.includes(f));
}
