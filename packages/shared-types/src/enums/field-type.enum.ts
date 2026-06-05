/** Physical surface/type of a mini soccer field. */
export const FieldType = {
  INDOOR: 'INDOOR',
  OUTDOOR: 'OUTDOOR',
  SYNTHETIC: 'SYNTHETIC',
} as const;

export type FieldType = (typeof FieldType)[keyof typeof FieldType];

/** Operational availability of a field. */
export const FieldStatus = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
} as const;

export type FieldStatus = (typeof FieldStatus)[keyof typeof FieldStatus];
