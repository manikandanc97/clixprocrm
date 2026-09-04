"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { FormInput, FormSelect, FormDatePicker } from "@/shared/components/form-fields";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { useDirtyForm } from "@/shared/hooks/use-dirty-form";
import { useCreateQuotation, useUpdateQuotation, useLeads } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { LeadType } from "@/shared/types/lead";
import { QuotationType } from "@/shared/types/quotation";

// Using a local schema tailored for this multi-step form, and parsing the backend schema when submitting
const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Qty > 0"),
  price: z.coerce.number().min(0, "Price >= 0"),
  discount: z.coerce.number().min(0).default(0),
});

const quoteFormSchema = z.object({
  leadId: z.string().min(1, "Please select a Deal"),
  client: z.string().min(1, "Client name is required"),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  validTill: z.date(),
  notes: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  initialData?: QuotationType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const QuoteForm = ({ initialData, onSuccess, onCancel }: QuoteFormProps) => {
  const [step, setStep] = useState(1);
  const createQuote = useCreateQuotation();
  const updateQuote = useUpdateQuotation();
  const { currencySymbol, formatCurrency } = useCurrency();
  const { data: leadsData } = useLeads();
  const leads = useMemo(() => Array.isArray(leadsData?.leads) ? leadsData.leads : [], [leadsData]);

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 15);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema) as ReturnType<typeof JSON.parse>,
    defaultValues: initialData ? {
      leadId: initialData.leadId || "",
      client: initialData.client || "",
      items: (initialData.items || []).map((item: ReturnType<typeof JSON.parse>) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0
      })),
      validTill: initialData.validTillValue ? new Date(initialData.validTillValue) : defaultDate,
      notes: initialData.notes || "",
    } : {
      leadId: "",
      client: "",
      items: [{ name: "", quantity: 1, price: 0, discount: 0 }],
      validTill: defaultDate,
      notes: "",
    },
  });

  const { isDirty, resetDirty } = useDirtyForm(form, form.formState.defaultValues as QuoteFormValues);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch for deal selection to auto-fill client
  const selectedLeadId = useWatch({ control: form.control, name: "leadId" });
  useEffect(() => {
    if (selectedLeadId && leads.length > 0) {
      const lead = leads.find((l: LeadType) => l.id === selectedLeadId);
      if (lead) {
        form.setValue("client", lead.company || lead.name, { shouldValidate: true });
      }
    }
  }, [selectedLeadId, leads, form]);

  // Watch items to calculate totals
  const items = useWatch({ control: form.control, name: "items" });
  const subtotal = items?.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0) || 0;
  const totalDiscount = items?.reduce((sum, item) => sum + Number(item.discount), 0) || 0;
  const grandTotal = subtotal - totalDiscount;

  const onSubmit = async (data: QuoteFormValues) => {
    try {
      const payload = {
        leadId: data.leadId,
        client: data.client,
        amount: String(grandTotal),
        discount: totalDiscount,
        items: data.items.map(item => ({ ...item, total: item.quantity * item.price })),
        validTill: data.validTill ? data.validTill.toISOString() : undefined,
        notes: data.notes,
      };

      if (initialData) {
        await updateQuote.mutateAsync({
          id: initialData.id,
          data: payload,
        });
      } else {
        await createQuote.mutateAsync({
          ...payload,
          status: "DRAFT",
        });
      }
      
      resetDirty(form.getValues());
      onSuccess?.();
    } catch {
      // Error handled by hook

    }
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["leadId", "client"]);
    } else if (step === 2) {
      isValid = await form.trigger(["items"]);
    }
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
          {[1, 2, 3].map((num) => (
            <div 
              key={num} 
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors border-2
                ${step >= num ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-muted'}
              `}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Step 1: Select Deal */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold">Select Deal</h3>
              <p className="text-sm text-muted-foreground mb-4">Choose a pipeline deal to create this quotation for.</p>
            </div>
            <FormSelect 
              name="leadId" 
              label="Related Deal *" 
              options={leads.map((l: LeadType) => ({
                label: `${l.company || l.name} (${formatCurrency(l.valueAmount || Number(String(l.value).replace(/[^0-9.-]+/g,"")))})`,
                value: l.id
              }))} 
              placeholder="Select related deal"
            />
            <FormInput name="client" label="Customer / Company Name *" placeholder="Enter customer or company name" />
          </div>
        )}

        {/* Step 2: Line Items */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold">Quotation Items</h3>
              <p className="text-sm text-muted-foreground mb-4">Add products or services.</p>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-3 bg-muted/30 rounded-xl border border-border">
                  <div className="flex-1 space-y-3">
                    <FormField
                      control={form.control as ReturnType<typeof JSON.parse>}
                      name={`items.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="Enter product or service description" {...field} className="h-9" aria-label={`Item name, row ${index + 1}`} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control as ReturnType<typeof JSON.parse>}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px]">Quantity</FormLabel>
                            <FormControl><Input type="number" min="1" {...field} className="h-9" aria-label={`Quantity, row ${index + 1}`} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as ReturnType<typeof JSON.parse>}
                        name={`items.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px]">Unit Price</FormLabel>
                            <FormControl><Input type="number" min="0" step="0.01" {...field} className="h-9" aria-label={`Unit price, row ${index + 1}`} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as ReturnType<typeof JSON.parse>}
                        name={`items.${index}.discount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px]">Discount</FormLabel>
                            <FormControl><Input type="number" min="0" step="0.01" {...field} className="h-9" aria-label={`Discount, row ${index + 1}`} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Delete line item"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <AppIcon name="trash" size={16} />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="w-full h-9 border-dashed mt-2"
              onClick={() => append({ name: "", quantity: 1, price: 0, discount: 0 })}
            >
              <AppIcon name="plus" size={16} className="mr-2" /> Add Item
            </Button>

            <div className="p-4 bg-muted/40 rounded-xl mt-4 border border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Total Discount</span>
                <span className="font-semibold text-rose-500">-{currencySymbol}{totalDiscount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border w-full mb-3" />
              <div className="flex justify-between items-center">
                <span className="font-bold">Grand Total</span>
                <span className="text-xl font-black text-primary">{currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Final Details */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold">Final Details</h3>
              <p className="text-sm text-muted-foreground mb-4">Set validity and add optional notes.</p>
            </div>
            <FormDatePicker 
              name="validTill" 
              label="Valid Until *" 
              placeholder="Select validity date"
              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} 
            />
            <FormField
              control={form.control as ReturnType<typeof JSON.parse>}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions / Notes</FormLabel>
                  <FormControl>
                    <textarea 
                      className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter specific terms for this quotation..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-border">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep} className="h-10">
              <AppIcon name="arrowLeft" size={16} className="mr-2" /> Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={onCancel} className="h-10 text-muted-foreground">
              <AppIcon name="close" size={15} className="mr-1.5" />
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button type="button" onClick={nextStep} className="h-10 px-8">
              Continue <AppIcon name="arrowRight" size={16} className="ml-2" />
            </Button>
          ) : (
            <FormSubmitButton
              isDirty={isDirty}
              isPending={createQuote.isPending || updateQuote.isPending}
              loadingText={initialData ? "Updating..." : "Generating..."}
              className="h-10 px-8"
            >
              {initialData ? "Update Quotation" : "Generate Quote"}
            </FormSubmitButton>
          )}
        </div>
      </form>
    </Form>
  );
};

export default QuoteForm;
