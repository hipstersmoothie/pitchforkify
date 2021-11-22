import prisma from "../utils/primsa";

prisma.review
  .findFirst({
    where: {
      albumTitle: "Afterparty Babies"
    },
    select: {
      albumTitle: true,
      artists: true,
    },
  })
  .then(console.log)
  .catch(console.log);
