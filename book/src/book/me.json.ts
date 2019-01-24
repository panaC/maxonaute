export const ME = {
  mainJourney: {
    origin: {
      code: "$CODE",
    },
    destination: {
      code: "$CODE",
    },
  },
  directTravel: false,
  schedule: {
    outward: "$DATE",
    outwardType: "DEPARTURE_FROM",
  },
  travelClass: "SECOND",
  passengers: [
    {
      typology: "YOUNG",
      discountCard: {
        code: "HAPPY_CARD",
        number: "$HCCODE",
        dateOfBirth: "$DOB",
      },
    },
  ],
  checkBestPrices: false,
  salesMarket: "fr-FR",
  codeFce: null,
};
