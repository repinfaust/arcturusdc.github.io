/**
 * Ruby Document Templates
 *
 * Templates for standardized documentation across STEa
 */

export const DOCUMENT_TEMPLATES = {
  blank: {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with an empty document',
    emoji: '📄',
    docType: 'documentation',
    sections: [],
  },

  prs: {
    id: 'prs',
    name: 'Product Requirement Spec',
    description: 'Product requirements and specifications',
    emoji: '📋',
    docType: 'documentation',
    sections: [
      {
        title: 'Executive Summary',
        placeholder: 'Brief overview of the product or feature (2-3 sentences)',
      },
      {
        title: 'Goals & Non-Goals',
        placeholder: 'What this will achieve and what is explicitly out of scope',
        subsections: [
          { title: 'Goals', placeholder: 'List the key objectives' },
          { title: 'Non-Goals', placeholder: 'List what is out of scope' },
        ],
      },
      {
        title: 'Requirements',
        placeholder: 'Detailed functional and non-functional requirements',
        subsections: [
          { title: 'Functional Requirements', placeholder: 'What the system must do' },
          { title: 'Non-Functional Requirements', placeholder: 'Performance, security, scalability constraints' },
        ],
      },
      {
        title: 'User Flows & Use Cases',
        placeholder: 'Describe how users will interact with this feature',
      },
      {
        title: 'Architecture & Data Model',
        placeholder: 'High-level technical approach and data structures',
      },
      {
        title: 'Risks & Mitigations',
        placeholder: 'Potential issues and how to address them',
      },
      {
        title: 'Test Strategy & Acceptance Criteria',
        placeholder: 'How we will validate this works correctly',
      },
      {
        title: 'Rollout & Communications',
        placeholder: 'Launch plan, stakeholder comms, training needs',
      },
      {
        title: 'Appendix',
        placeholder: 'Glossary, references, additional context',
      },
    ],
  },

  buildSpec: {
    id: 'buildSpec',
    name: 'Build Spec',
    description: 'Technical design and implementation plan',
    emoji: '🏗️',
    docType: 'architecture',
    sections: [
      {
        title: 'Overview',
        placeholder: 'Brief summary of what is being built and why',
      },
      {
        title: 'Definitions & Abbreviations',
        placeholder: 'Key terms and acronyms used in this document',
      },
      {
        title: 'Outcomes & Non-Goals',
        placeholder: 'What success looks like and what is out of scope',
      },
      {
        title: 'Prioritised Improvements',
        placeholder: 'Features/improvements ranked by value and effort',
      },
      {
        title: 'Functional Requirements',
        placeholder: 'Detailed feature specifications with DoD (Definition of Done)',
      },
      {
        title: 'Data Model',
        placeholder: 'Collections, schemas, indexes, relationships',
      },
      {
        title: 'Integrations',
        placeholder: 'External systems, APIs, webhooks, dependencies',
      },
      {
        title: 'Technical Design',
        placeholder: 'Architecture, tech stack, security, performance considerations',
      },
      {
        title: 'UX Notes',
        placeholder: 'User interface patterns, flows, design considerations',
      },
      {
        title: 'Delivery Plan',
        placeholder: 'Phases, sprints, milestones, gating criteria',
      },
      {
        title: 'Risks & Mitigations',
        placeholder: 'Technical risks and how to address them',
      },
      {
        title: 'Open Questions',
        placeholder: 'Unresolved decisions and discussion points',
      },
    ],
  },

  adr: {
    id: 'adr',
    name: 'Architecture Decision Record',
    description: 'Document an important architectural decision',
    emoji: '🎯',
    docType: 'architecture',
    sections: [
      {
        title: 'Status',
        placeholder: 'Proposed / Accepted / Superseded / Deprecated',
      },
      {
        title: 'Context',
        placeholder: 'What is the issue we are trying to solve? What forces are at play?',
      },
      {
        title: 'Decision',
        placeholder: 'What is the change that we are proposing/doing?',
      },
      {
        title: 'Consequences',
        placeholder: 'What becomes easier or more difficult as a result of this decision?',
        subsections: [
          { title: 'Positive', placeholder: 'Benefits and improvements' },
          { title: 'Negative', placeholder: 'Trade-offs and limitations' },
          { title: 'Neutral', placeholder: 'Other changes with no clear value judgment' },
        ],
      },
      {
        title: 'Alternatives Considered',
        placeholder: 'What other options did we evaluate and why were they not chosen?',
      },
      {
        title: 'References',
        placeholder: 'Links to related discussions, docs, or resources',
      },
    ],
  },

  testPlan: {
    id: 'testPlan',
    name: 'Test Plan',
    description: 'Comprehensive testing strategy and test cases',
    emoji: '🧪',
    docType: 'documentation',
    sections: [
      {
        title: 'Scope',
        placeholder: 'What features/components are being tested?',
      },
      {
        title: 'Test Objectives',
        placeholder: 'What are we trying to validate or discover?',
      },
      {
        title: 'Test Strategy',
        placeholder: 'Approach: unit, integration, e2e, manual, automated',
        subsections: [
          { title: 'Unit Tests', placeholder: 'Component-level testing approach' },
          { title: 'Integration Tests', placeholder: 'System integration testing' },
          { title: 'End-to-End Tests', placeholder: 'Full user flow testing' },
          { title: 'Manual Testing', placeholder: 'Exploratory and edge case testing' },
        ],
      },
      {
        title: 'Test Cases',
        placeholder: 'Detailed test scenarios with steps and expected results',
      },
      {
        title: 'Test Environment',
        placeholder: 'Configuration, data setup, dependencies',
      },
      {
        title: 'Acceptance Criteria',
        placeholder: 'What must pass for the feature to be considered done?',
      },
      {
        title: 'Risks & Mitigation',
        placeholder: 'Potential testing challenges and how to address them',
      },
      {
        title: 'Schedule',
        placeholder: 'Testing timeline and milestones',
      },
    ],
  },

  launchPlan: {
    id: 'launchPlan',
    name: 'Launch Plan',
    description: 'Go-to-market and rollout strategy',
    emoji: '🚀',
    docType: 'documentation',
    sections: [
      {
        title: 'Launch Summary',
        placeholder: 'What are we launching and when?',
      },
      {
        title: 'Goals & Success Metrics',
        placeholder: 'What does success look like? How will we measure it?',
      },
      {
        title: 'Target Audience',
        placeholder: 'Who is this for? User segments and personas',
      },
      {
        title: 'Rollout Strategy',
        placeholder: 'Phased approach, feature flags, gradual rollout plan',
      },
      {
        title: 'Communications Plan',
        placeholder: 'Announcements, documentation, training, support',
        subsections: [
          { title: 'Internal Comms', placeholder: 'Team and stakeholder updates' },
          { title: 'External Comms', placeholder: 'User-facing announcements' },
          { title: 'Documentation', placeholder: 'Help docs, guides, videos' },
          { title: 'Training', placeholder: 'Onboarding and education materials' },
        ],
      },
      {
        title: 'Support & Monitoring',
        placeholder: 'How will we handle issues and track adoption?',
      },
      {
        title: 'Risks & Contingency',
        placeholder: 'What could go wrong and what is our backup plan?',
      },
      {
        title: 'Timeline & Checklist',
        placeholder: 'Pre-launch, launch day, and post-launch tasks',
      },
    ],
  },

  releaseNotes: {
    id: 'releaseNotes',
    name: 'Release Notes',
    description: 'Document changes in a release',
    emoji: '📦',
    docType: 'documentation',
    sections: [
      {
        title: 'Release Summary',
        placeholder: 'Version number, date, and high-level overview',
      },
      {
        title: 'New Features',
        placeholder: 'Major new functionality added in this release',
      },
      {
        title: 'Improvements',
        placeholder: 'Enhancements to existing features',
      },
      {
        title: 'Bug Fixes',
        placeholder: 'Issues resolved in this release',
      },
      {
        title: 'Known Issues',
        placeholder: 'Outstanding bugs or limitations',
      },
      {
        title: 'Breaking Changes',
        placeholder: 'Changes that may affect existing integrations or workflows',
      },
      {
        title: 'Upgrade Notes',
        placeholder: 'Special instructions for updating to this version',
      },
    ],
  },

  meetingNotes: {
    id: 'meetingNotes',
    name: 'Meeting Notes',
    description: 'Capture discussion, decisions, and action items',
    emoji: '📝',
    docType: 'meeting',
    sections: [
      {
        title: 'Meeting Details',
        placeholder: 'Date, time, attendees, meeting purpose',
      },
      {
        title: 'Agenda',
        placeholder: 'Topics to be discussed',
      },
      {
        title: 'Discussion Notes',
        placeholder: 'Key points, questions, and conversation highlights',
      },
      {
        title: 'Decisions Made',
        placeholder: 'Concrete decisions and their rationale',
      },
      {
        title: 'Action Items',
        placeholder: 'Tasks assigned with owners and due dates',
      },
      {
        title: 'Next Steps',
        placeholder: 'Follow-up actions and next meeting details',
      },
    ],
  },
};

/**
 * Convert a template structure to TipTap JSON format
 */
export function templateToTipTapJSON(template) {
  if (!template.sections || template.sections.length === 0) {
    // Blank template
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  const content = [];

  // Add each section
  template.sections.forEach((section) => {
    // Section heading (H1)
    content.push({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: section.title }],
    });

    // Section placeholder or empty paragraph
    if (section.placeholder) {
      content.push({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'italic' }],
            text: section.placeholder,
          },
        ],
      });
    } else {
      content.push({
        type: 'paragraph',
        content: [],
      });
    }

    // Add subsections if any
    if (section.subsections && section.subsections.length > 0) {
      section.subsections.forEach((subsection) => {
        // Subsection heading (H2)
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: subsection.title }],
        });

        // Subsection placeholder or empty paragraph
        if (subsection.placeholder) {
          content.push({
            type: 'paragraph',
            content: [
              {
                type: 'text',
                marks: [{ type: 'italic' }],
                text: subsection.placeholder,
              },
            ],
          });
        } else {
          content.push({
            type: 'paragraph',
            content: [],
          });
        }
      });
    }

    // Add spacing between sections
    content.push({
      type: 'paragraph',
      content: [],
    });
  });

  return {
    type: 'doc',
    content,
  };
}

/**
 * Get all templates as an array
 */
export function getAllTemplates() {
  return Object.values(DOCUMENT_TEMPLATES);
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId) {
  return DOCUMENT_TEMPLATES[templateId] || DOCUMENT_TEMPLATES.blank;
}
