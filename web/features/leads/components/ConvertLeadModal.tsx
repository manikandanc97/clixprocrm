import { useState, useEffect } from "react";
import { FormModal } from "@/shared/components/crm/FormModal";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import client from "@/shared/lib/api/client";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Checkbox } from "@/shared/ui/checkbox";
import { formatDate } from "@/shared/utils/formatters";

export function ConvertLeadModal({ 
  isOpen, 
  onClose, 
  lead 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lead: any 
}) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    companyName: "",
    createDeal: true,
    dealName: "",
    dealValue: 0,
    probability: 20,
    expectedCloseDate: "",
  });

  // Reset form when lead changes
  useEffect(() => {
    if (lead) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        customerName: lead.name || "",
        customerEmail: lead.email || "",
        companyName: lead.company || "",
        createDeal: true,
        dealName: `${lead.name || "Lead"} - Opportunity`,
        dealValue: lead.valueAmount || (typeof lead.value === 'string' ? Number(lead.value.replace(/[^0-9.-]+/g,"")) : Number(lead.value)) || 0,
        probability: lead.probability || 20,
        expectedCloseDate: lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toISOString().split('T')[0] : "",
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id) return;
    
    setLoading(true);
    try {
      const response = await client.post(`/crm/leads/${lead.id}/convert`, formData);
      if (response.data.success) {
        toast.success("Lead converted to deal successfully.");
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["companies"] });
        queryClient.invalidateQueries({ queryKey: ["deals"] });
        queryClient.invalidateQueries({ queryKey: ["pipeline"] });
        queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
        onClose();
        
        // Optionally navigate if deal is created
        // if (response.data.data?.deal?.id) {
        //   router.push(`/pipeline`);
        // }
      } else {
        toast.error(response.data.message || "Failed to convert lead");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to convert lead");
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  if (lead.isConverted) {
    return (
      <FormModal
        title="Lead Converted"
        description="This lead has already been converted."
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
      >
        <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Lead already converted</h3>
          <p className="text-sm text-muted-foreground">
            {lead.name} was already converted on {formatDate(lead.convertedAt, 'a previous date')}.
          </p>
          <div className="flex gap-3 pt-4 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
            <Button className="flex-1 gap-2" onClick={() => {
              onClose();
              router.push('/pipeline');
            }}>
              View Pipeline <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </FormModal>
    );
  }

  return (
    <FormModal
      title="Convert Lead to Deal"
      description={`Qualify ${lead.name} and convert into a Customer, Company, and Deal.`}
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Customer Name <span className="text-rose-500">*</span></Label>
            <Input 
              required 
              value={formData.customerName} 
              onChange={e => setFormData({ ...formData, customerName: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label>Customer Email</Label>
            <Input 
              type="email"
              value={formData.customerEmail} 
              onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Company Name <span className="text-rose-500">*</span></Label>
          <Input 
            required 
            value={formData.companyName} 
            onChange={e => setFormData({ ...formData, companyName: e.target.value })} 
          />
        </div>

        <div className="flex items-center space-x-2 pt-2 border-t pt-4">
          <Checkbox 
            id="createDeal" 
            checked={formData.createDeal}
            onCheckedChange={(checked) => setFormData({ ...formData, createDeal: checked === true })}
          />
          <Label htmlFor="createDeal" className="font-semibold cursor-pointer text-foreground">
            Create a new Deal for this Customer
          </Label>
        </div>

        {formData.createDeal && (
          <div className="grid grid-cols-2 gap-4 p-5 border rounded-xl bg-muted/20">
            <div className="space-y-2 col-span-2">
              <Label>Deal Name <span className="text-rose-500">*</span></Label>
              <Input 
                required={formData.createDeal} 
                value={formData.dealName} 
                onChange={e => setFormData({ ...formData, dealName: e.target.value })} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Deal Value <span className="text-rose-500">*</span></Label>
              <Input 
                type="number"
                required={formData.createDeal} 
                value={formData.dealValue} 
                onChange={e => setFormData({ ...formData, dealValue: Number(e.target.value) })} 
              />
            </div>

            <div className="space-y-2">
              <Label>Probability (%)</Label>
              <Input 
                type="number"
                min="0"
                max="100"
                value={formData.probability} 
                onChange={e => setFormData({ ...formData, probability: Number(e.target.value) })} 
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Expected Close Date</Label>
              <Input 
                type="date"
                value={formData.expectedCloseDate} 
                onChange={e => setFormData({ ...formData, expectedCloseDate: e.target.value })} 
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="cursor-pointer">
            <AppIcon name="close" size={14} className="mr-1.5" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? "Converting..." : "Convert Lead"}
          </Button>
        </div>
      </form>
    </FormModal>
  );
}
