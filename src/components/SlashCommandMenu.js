'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const SLASH_COMMANDS = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a bullet list',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Task List',
    description: 'Create a task list with checkboxes',
    icon: '☑',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Code block with syntax highlighting',
    icon: '</>',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
  },
  {
    title: 'Quote',
    description: 'Insert a blockquote',
    icon: '"',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: '⊞',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: 'Info Callout',
    description: 'Information callout block',
    icon: 'ℹ️',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ type: 'info' }).run();
    },
  },
  {
    title: 'Warning Callout',
    description: 'Warning callout block',
    icon: '⚠️',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ type: 'warning' }).run();
    },
  },
  {
    title: 'Success Callout',
    description: 'Success callout block',
    icon: '✅',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ type: 'success' }).run();
    },
  },
  {
    title: 'Error Callout',
    description: 'Error callout block',
    icon: '❌',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ type: 'error' }).run();
    },
  },
  {
    title: 'Tip Callout',
    description: 'Tip callout block',
    icon: '💡',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ type: 'tip' }).run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal rule',
    icon: '—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

const SlashCommandMenu = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);

  useEffect(() => {
    const query = props.query?.toLowerCase() || '';
    const filtered = SLASH_COMMANDS.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [props.query]);

  const selectItem = (index) => {
    const item = filteredCommands[index];
    if (item) {
      item.command(props);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + filteredCommands.length - 1) % filteredCommands.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % filteredCommands.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (filteredCommands.length === 0) {
    return (
      <div className="slash-command-menu">
        <div className="slash-command-empty">No results</div>
      </div>
    );
  }

  return (
    <div className="slash-command-menu">
      {filteredCommands.map((item, index) => (
        <button
          key={index}
          type="button"
          className={`slash-command-item ${index === selectedIndex ? 'is-selected' : ''}`}
          onClick={() => selectItem(index)}
        >
          <div className="slash-command-icon">{item.icon}</div>
          <div className="slash-command-content">
            <div className="slash-command-title">{item.title}</div>
            <div className="slash-command-description">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';

export default SlashCommandMenu;
