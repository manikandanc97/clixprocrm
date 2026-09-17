import { useCallback, useMemo } from "react";
import { IndianRupee } from "lucide-react";
import {
  formatCurrency as canonicalFormatCurrency,
  FormatCurrencyOptions,
} from "@/shared/utils/formatters";

export function useCurrency() {
  const currency = "INR";

  const formatCurrency = useCallback(
    (
      value: number | string | undefined | null,
      optionsOrCode?: FormatCurrencyOptions | string
    ) => {
      return canonicalFormatCurrency(value, optionsOrCode);
    },
    []
  );

  const CurrencyIcon = IndianRupee;
  const currencySymbol = "₹";
  const currencyCode = "INR";

  return useMemo(
    () => ({ currency, formatCurrency, currencySymbol, currencyCode, CurrencyIcon }),
    [formatCurrency]
  );
}

