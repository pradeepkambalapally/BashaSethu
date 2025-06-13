CREATE TABLE "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"banjara_text" text NOT NULL,
	"telugu_text" text NOT NULL,
	"english_text" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
