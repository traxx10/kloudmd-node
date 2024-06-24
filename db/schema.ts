import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

// available: false;
// booking_interval: null;
// clock_in: '2024-06-25T00:00:00';
// clock_out: '2024-06-25T23:59:00';
// day: 2;
// location_id: '2c276836-ac62-4d41-b6cd-d641b22bf399';
// recurrence: null;
// recurrence_end: '2024-06-26';
// recurrence_interval: null;
// recurrence_start: '2024-06-25';
// resource_id: null;
// rule_id: null;
// staff_id: '00d7cb98-ba63-43e7-a908-6c5679e514af';
// unavailable_reason: 'test';

export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey(),
  available: integer('available', { mode: 'boolean' }).default(true),
  clock_in: text('timestamp'),
  clock_out: text('timestamp'),
  day: integer('day').notNull(),
  location_id: text('location_id'),
  recurrence: text('recurrence'),
  recurrence_end: text('recurrence_end'),
  recurrence_interval: integer('recurrence_interval'),
  recurrence_start: text('recurrence_start'),
  resource_id: text('resource_id'),
  staff_id: text('staff_id'),
  unavailable_reason: text('unavailable_reason'),
});
