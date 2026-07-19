CREATE TABLE `pre_order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pre_order_id` integer NOT NULL,
	`product_id` integer,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`pre_order_id`) REFERENCES `pre_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `pre_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`customer_contact` text DEFAULT '',
	`pickup_date` integer NOT NULL,
	`dp_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'menunggu' NOT NULL,
	`notes` text DEFAULT '',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`description` text DEFAULT '',
	`deducts_vinegar` integer DEFAULT false NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transaction_id` integer NOT NULL,
	`product_id` integer,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`payment_method` text DEFAULT 'tunai' NOT NULL,
	`note` text DEFAULT '',
	`status` text DEFAULT 'selesai' NOT NULL,
	`created_at` integer
);
