import { BadRequestException } from '@nestjs/common';
import { SubscriptionQuote } from './subscription-entitlement.interface';
import { PlanDefinition } from './plan-definitions.constant';

/**
 * Computes the authoritative subscription price quote.
 * Pure math calculation — accepts resolved plan objects, returns a SubscriptionQuote.
 *
 * @param tenantCurrency - Tenant currency code (e.g. 'INR', 'USD')
 * @param tenantPlan - Current tenant plan string
 * @param currentPlanDef - Resolved current plan definition
 * @param targetPlanDef - Resolved target plan definition
 * @param seats - Number of seats to quote
 * @param billingCycle - 'monthly' or 'annual'
 * @param isPlatformTenant - Whether the tenant is a platform-internal tenant
 */
export function computeSubscriptionQuote(
  tenantCurrency: string,
  currentPlanDef: PlanDefinition,
  targetPlanDef: PlanDefinition,
  seats: number,
  billingCycle: 'monthly' | 'annual',
  isPlatformTenant: boolean,
): SubscriptionQuote {
  // Validate seat cap
  if (
    targetPlanDef.limits.maxUsers !== -1 &&
    seats > targetPlanDef.limits.maxUsers
  ) {
    throw new BadRequestException(
      `The ${targetPlanDef.name} plan supports a maximum of ${targetPlanDef.limits.maxUsers} seats. For larger teams, please choose Business.`,
    );
  }

  // Platform tenants, custom plans, and free tier always zero-amount
  if (
    isPlatformTenant ||
    targetPlanDef.pricingMode === 'CUSTOM' ||
    targetPlanDef.id === 'free'
  ) {
    return {
      planId: targetPlanDef.id,
      planName: targetPlanDef.name,
      seats,
      billingCycle,
      currency: tenantCurrency || 'INR',
      unitPricePerMonth: 0,
      subtotal: 0,
      annualDiscountPercentage: 0,
      annualDiscountAmount: 0,
      taxRatePercentage: 0,
      taxAmount: 0,
      totalAmount: 0,
      totalAmountInMinorUnits: 0,
      recurringAmount: 0,
      intervalDescription:
        targetPlanDef.id === 'free' ? 'free tier' : 'internal platform plan',
      isUpgrade: true,
      isDowngrade: false,
      effectiveImmediately: true,
    };
  }

  const unitPriceMonthly = targetPlanDef.priceNum;
  let subtotal = 0;
  let annualDiscountAmount = 0;
  const annualDiscountPercentage = billingCycle === 'annual' ? 17 : 0;

  if (billingCycle === 'annual') {
    const baseYearly =
      targetPlanDef.annualPriceNum > 0
        ? targetPlanDef.annualPriceNum
        : unitPriceMonthly * 10;
    subtotal = baseYearly * seats;
    const fullMonthlyYearly = unitPriceMonthly * 12 * seats;
    annualDiscountAmount = Math.max(0, fullMonthlyYearly - subtotal);
  } else {
    subtotal = unitPriceMonthly * seats;
  }

  const taxRatePercentage = tenantCurrency === 'INR' ? 18 : 0;
  const taxAmount = Math.round((subtotal * taxRatePercentage) / 100);
  const totalAmount = subtotal + taxAmount;
  // e.g. ₹499 → 49900 paise
  const totalAmountInMinorUnits = Math.round(totalAmount * 100);
  const recurringAmount = billingCycle === 'annual' ? totalAmount : subtotal;

  const isUpgrade = targetPlanDef.displayOrder > currentPlanDef.displayOrder;
  const isDowngrade = targetPlanDef.displayOrder < currentPlanDef.displayOrder;

  return {
    planId: targetPlanDef.id,
    planName: targetPlanDef.name,
    seats,
    billingCycle,
    currency: tenantCurrency || 'INR',
    unitPricePerMonth: unitPriceMonthly,
    subtotal,
    annualDiscountPercentage,
    annualDiscountAmount,
    taxRatePercentage,
    taxAmount,
    totalAmount,
    totalAmountInMinorUnits,
    recurringAmount,
    intervalDescription:
      billingCycle === 'annual' ? 'billed annually' : 'billed monthly',
    isUpgrade,
    isDowngrade,
    effectiveImmediately: true,
  };
}
