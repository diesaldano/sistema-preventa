-- Add customerIP column to orders table
ALTER TABLE "orders" ADD COLUMN "customerIP" TEXT NOT NULL DEFAULT 'unknown';

-- Add index for customerIP
CREATE INDEX "orders_customerIP_idx" ON "orders"("customerIP");
