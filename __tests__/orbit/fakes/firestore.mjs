export const Timestamp = { fromDate: (d) => ({ _ts: d.toISOString() }) };
export const FieldValue = { serverTimestamp: () => 'ts', delete: () => 'del' };
