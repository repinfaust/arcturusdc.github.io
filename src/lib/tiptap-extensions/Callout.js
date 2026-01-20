import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Callout Extension
 * Creates styled callout blocks for notes, warnings, tips, and errors
 */
export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-type') || 'info',
        renderHTML: (attributes) => {
          return {
            'data-type': attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes['data-type'] || 'info';

    const typeConfig = {
      info: {
        icon: 'ℹ️',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-900',
      },
      warning: {
        icon: '⚠️',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-900',
      },
      success: {
        icon: '✅',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        textColor: 'text-green-900',
      },
      error: {
        icon: '❌',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        textColor: 'text-red-900',
      },
      tip: {
        icon: '💡',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-900',
      },
    };

    const config = typeConfig[type] || typeConfig.info;

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        class: `callout ${config.bgColor} ${config.borderColor} ${config.textColor}`,
      }),
      [
        'div',
        {
          class: 'callout-icon',
          contenteditable: 'false',
        },
        config.icon,
      ],
      [
        'div',
        {
          class: 'callout-content',
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});
