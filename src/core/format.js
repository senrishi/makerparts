export const money = (value, currency) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    value,
  );
