CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY NOT NULL,
	`available` integer DEFAULT true,
	`timestamp` text,
	`day` integer NOT NULL,
	`location_id` text,
	`recurrence` text,
	`recurrence_end` text,
	`recurrence_interval` integer,
	`recurrence_start` text,
	`resource_id` text,
	`staff_id` text,
	`unavailable_reason` text
);
