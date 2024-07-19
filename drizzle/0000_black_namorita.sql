CREATE TABLE `schedules` (
	`staff_id` integer,
	`project_id` integer,
	`id` integer PRIMARY KEY NOT NULL,
	`available` integer DEFAULT true,
	`timestamp` text,
	`day` integer NOT NULL,
	`recurrence` text,
	`recurrence_end` text,
	`recurrence_interval` integer,
	`recurrence_start` text,
	`resource_id` text,
	`unavailable_reason` text
);
