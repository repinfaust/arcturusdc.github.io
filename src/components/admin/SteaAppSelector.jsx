'use client';

import { STEA_APP_CATALOG } from '@/lib/steaAppCatalog';

const GROUPS = [...new Set(STEA_APP_CATALOG.map((app) => app.group))];

export default function SteaAppSelector({ selectedKeys, onChange, disabled = false, compact = false }) {
  const selected = new Set(selectedKeys);

  const toggle = (key) => {
    if (disabled) return;
    onChange(selected.has(key) ? selectedKeys.filter((item) => item !== key) : [...selectedKeys, key]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-800">Workspace app shelf</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Members see and can open only the selected apps.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-pink-200 bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
            {selectedKeys.length} selected
          </span>
          <button
            type="button"
            onClick={() => onChange(STEA_APP_CATALOG.map((app) => app.key))}
            disabled={disabled}
            className="text-xs font-medium text-pink-600 hover:text-pink-700 hover:underline disabled:opacity-50"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:underline disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {GROUPS.map((group) => (
        <fieldset key={group} disabled={disabled}>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{group}</legend>
          <div className={`grid gap-2 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {STEA_APP_CATALOG.filter((app) => app.group === group).map((app) => {
              const checked = selected.has(app.key);
              return (
                <label
                  key={app.key}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition focus-within:ring-2 focus-within:ring-pink-500/20 ${
                    checked
                      ? 'border-pink-300 bg-pink-50/70'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(app.key)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-neutral-900">{app.name}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-neutral-500">{app.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
        Repinfaust is owner-only and cannot be assigned to a workspace. Admin settings and sign-in remain available independently.
      </div>
    </div>
  );
}
