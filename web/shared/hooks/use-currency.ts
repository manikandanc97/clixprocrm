import { IndianRupee } from "lucide-react";

export function useCurrency() {
  const currency = "INR";

  const formatCurrency = (value: number | string | undefined | null, currCode = "INR") => {
    const numValue = Number(value || 0);
    const code = currCode || "INR";

    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numValue);
    } catch {
      return `₹${numValue.toLocaleString("en-IN")}`;
    }
  };

  const CurrencyIcon = IndianRupee;
  const currencySymbol = "₹";
  const currencyCode = "INR";

  return { currency, formatCurrency, currencySymbol, currencyCode, CurrencyIcon };
}
