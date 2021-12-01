import prisma from "../utils/primsa";

const dups = [
  [24461, "The Light-Emitting Diamond Cutter Scriptures"],
  [24460, "The Clearing"],
  [24459, "At My Piano"],
  [24458, "I Thought of You"],
  [24457, "DJ-Kicks"],
  [24456, "Buds"],
  [24455, "Body/Dilloway/Head"],
  [24454, "Voyage to Mars"],
  [24453, "Diana"],
  [24452, "The Power of the Dog (Music From the Netflix Film)"],
  [24451, "Henki"],
] as const;

prisma.review
  .deleteMany({
    where: {
      id: { in: dups.map((d) => d[0]) },
    },
  })
  .then(console.log)
  .catch(console.log);
