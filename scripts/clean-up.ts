import prisma from "../utils/primsa";

[24450, 24449, 24448, 24447, 24446, 24445, 24444, 24443, 24442]

prisma.review
  .findMany({
    where: {
      id: '24450'
    },
  })
  .then(console.log)
  .catch(console.log);
