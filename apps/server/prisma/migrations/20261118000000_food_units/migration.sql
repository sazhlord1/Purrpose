-- Pantry units become smaller so smaller packs can be sold and staked:
--   dry food: 1 kilogram → 20 units of 50 g;  vet care: 1 visit → 4 care shares.
-- Runs once (a marker table remembers it), so running this file again changes nothing.
DO $$
BEGIN
  IF to_regclass('public."_FoodUnitsV2"') IS NULL THEN
    UPDATE "CreditBalance"     SET "amount" = "amount" * 20 WHERE "creditType" = 'DRY_FOOD';
    UPDATE "CreditBalance"     SET "amount" = "amount" * 4  WHERE "creditType" = 'VET_CARE';
    UPDATE "CreditTransaction" SET "amount" = "amount" * 20 WHERE "creditType" = 'DRY_FOOD';
    UPDATE "CreditTransaction" SET "amount" = "amount" * 4  WHERE "creditType" = 'VET_CARE';
    UPDATE "Commitment" SET "consequenceAmount" = "consequenceAmount" * 20 WHERE "consequenceType" = 'DRY_FOOD';
    UPDATE "Commitment" SET "consequenceAmount" = "consequenceAmount" * 4  WHERE "consequenceType" = 'VET_CARE';
    UPDATE "Habit" SET "stakeAmount" = "stakeAmount" * 20, "lostAmount" = "lostAmount" * 20 WHERE "consequenceType" = 'DRY_FOOD';
    UPDATE "Habit" SET "stakeAmount" = "stakeAmount" * 4,  "lostAmount" = "lostAmount" * 4  WHERE "consequenceType" = 'VET_CARE';
    UPDATE "Payment" SET "quantity" = "quantity" * 20 WHERE "kind" = 'food' AND "item" = 'DRY_FOOD';
    UPDATE "Payment" SET "quantity" = "quantity" * 4  WHERE "kind" = 'food' AND "item" = 'VET_CARE';
    CREATE TABLE "_FoodUnitsV2" ("doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO "_FoodUnitsV2" DEFAULT VALUES;
  END IF;
END $$;
