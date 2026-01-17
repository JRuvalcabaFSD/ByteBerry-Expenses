-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create.at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_expenses_user_id" ON "expenses"("user_id");

-- CreateIndex
CREATE INDEX "idx_expenses_expense_date" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "idx_expenses_user_date" ON "expenses"("user_id", "expense_date");
