-- CreateTable
CREATE TABLE "post_imagens" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,

    CONSTRAINT "post_imagens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "post_imagens" ADD CONSTRAINT "post_imagens_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
