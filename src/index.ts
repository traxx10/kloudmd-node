import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { db } from '../db/db';
import { schedules } from '../db/schema';
import {
  and,
  between,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { cors } from 'hono/cors';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

app.get('/', async (c) => {
  const { startDate, endDate, projectId } = c.req.query();

  const data = await db
    .select({
      staff_id: schedules.staff_id,
      project_id: schedules.project_id,
      id: schedules.id,
      available: schedules.available,
      clock_in: schedules.clock_in,
      clock_out: schedules.clock_out,
      day: schedules.day,
      recurrence: schedules.recurrence,
      recurrence_end: schedules.recurrence_end,
      recurrence_interval: schedules.recurrence_interval,
      recurrence_start: schedules.recurrence_start,
      resource_id: schedules.resource_id,
      unavailable_reason: schedules.unavailable_reason,
      debug_julian_end: sql`julianday(${endDate})`.as('debug_julian_end'),
      debug_julian_start: sql`julianday(${schedules.recurrence_start})`.as(
        'debug_julian_start'
      ),
      debug_julian_diff:
        sql`julianday(${endDate}) - julianday(${schedules.recurrence_start})`.as(
          'debug_julian_diff'
        ),
      debug_julian_weeks:
        sql`(julianday(${endDate}) - julianday(${schedules.recurrence_start})) / 7`.as(
          'debug_julian_weeks'
        ),
      debug_julian_mod: sql`CASE
        WHEN ${schedules.recurrence_interval} IS NOT NULL THEN
          (julianday(${endDate}) - julianday(${schedules.recurrence_start})) / 7 % 
          CASE 
            WHEN ${schedules.recurrence_interval} IS NULL THEN 1
            ELSE ${schedules.recurrence_interval}
          END
        ELSE NULL
      END`.as('debug_julian_mod'),
    })
    .from(schedules)
    .where(
      or(
        // For recurring events
        and(
          eq(schedules.project_id, Number(projectId)),
          isNull(schedules.recurrence_end),
          eq(schedules.available, true),
          isNotNull(schedules.recurrence_interval),
          lte(schedules.recurrence_start, endDate),

          or(
            eq(schedules.recurrence_interval, 1),
            sql`(julianday(${endDate}) - julianday(${schedules.recurrence_start})) / 7 % 
              CASE 
                WHEN ${schedules.recurrence_interval} IS NULL THEN 1
                ELSE ${schedules.recurrence_interval}
              END = 0`
          )
        ),
        // For non-recurring events
        and(
          eq(schedules.project_id, Number(projectId)),
          eq(schedules.available, true),
          // isNull(schedules.recurrence_interval),
          between(schedules.clock_in, startDate, endDate)
        )
      )
    );

  return c.json({
    results: data.length,
    data: data.map((item) => ({
      formattedDate: dayjs(item.clock_in).format('dddd'),
      ...item,
    })),
  });
});

app.post('/', async (c) => {
  const body = (await c.req.json()) as {
    staff_id: number;
    project_id: number;
    available: boolean;
    clock_in: string;
    clock_out: string;
    day: number;
    recurrence: string;
    recurrence_end: string;
    recurrence_interval: number;
    recurrence_start: string;
    unavailable_reason: string;
  };

  // Check if there's a schedule on the recurrence_start and the same day
  const existingSchedule = await db
    .select()
    .from(schedules)
    .where(
      and(
        eq(schedules.staff_id, body.staff_id),
        eq(schedules.project_id, body.project_id),
        eq(schedules.recurrence_start, body.recurrence_start),
        eq(schedules.day, body.day)
      )
    )
    .limit(1);

  // If a schedule exists, delete it
  if (existingSchedule.length > 0) {
    await db
      .delete(schedules)
      .where(
        and(
          eq(schedules.staff_id, body.staff_id),
          eq(schedules.project_id, body.project_id),
          eq(schedules.recurrence_start, body.recurrence_start),
          eq(schedules.day, body.day)
        )
      );
  }

  // Insert the new schedule
  await db.insert(schedules).values(body);

  return c.json(body);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json()) as {
    staff_id?: number;
    project_id?: number;
    available?: boolean;
    clock_in?: string;
    clock_out?: string;
    day?: number;
    recurrence?: string;
    recurrence_end?: string;
    recurrence_interval?: number;
    recurrence_start?: string;
    unavailable_reason?: string;
  };

  // Update the schedule with the given id
  await db
    .update(schedules)
    .set(body)
    .where(eq(schedules.id, Number(id)));

  return c.json({ message: 'Schedule updated successfully' });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  // Delete the schedule with the given id
  await db.delete(schedules).where(eq(schedules.id, Number(id)));

  return c.json({ message: 'Schedule deleted successfully' });
});

const port = 3001;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
