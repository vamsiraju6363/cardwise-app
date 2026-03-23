-- DropForeignKey
ALTER TABLE "UserCard" DROP CONSTRAINT "UserCard_cardId_fkey";

-- AlterTable
ALTER TABLE "UserCard" ADD COLUMN     "customBaseRewardPct" DECIMAL(5,4),
ADD COLUMN     "customCardName" VARCHAR(100),
ADD COLUMN     "customIssuer" VARCHAR(100),
ADD COLUMN     "customNetwork" "CardNetwork",
ADD COLUMN     "customRewardType" "RewardType",
ALTER COLUMN "cardId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
