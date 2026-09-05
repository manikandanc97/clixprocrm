import React from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { Button, ButtonProps } from '@/shared/ui/button';
import { Loader2, type LucideIcon } from 'lucide-react';
import { AppIcon } from '@/shared/components/icons/icon-registry';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface FormSubmitButtonProps extends ButtonProps {
  isDirty: boolean;
  isPending?: boolean;
  loadingText?: string;
  iconName?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
  hideIcon?: boolean;
}

function resolveSubmitIcon(iconName?: string, children?: React.ReactNode): string {
  if (iconName) return iconName;
  if (typeof children === 'string') {
    const text = children.toLowerCase();
    if (text.includes("create") || text.includes("add") || text.includes("new") || text.includes("onboard")) return "plus";
    if (text.includes("update") || text.includes("save") || text.includes("done") || text.includes("confirm") || text.includes("submit") || text.includes("apply")) return "check";
    if (text.includes("delete") || text.includes("remove") || text.includes("destroy")) return "trash";
  }
  return "check";
}

export const FormSubmitButton = React.forwardRef<HTMLButtonElement, FormSubmitButtonProps>(
  ({ isDirty, isPending, loadingText = "Saving...", iconName, icon, hideIcon = false, children, className, ...props }, ref) => {
    const context = useFormContext();
    const resolvedIcon = resolveSubmitIcon(iconName, children);
    
    // Subscribe to form validity if context exists
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const formState = context ? useFormState({ control: context.control }) : null;
    const isValid = formState ? formState.isValid : true;

    const disabled = isPending || !isDirty || (context ? !isValid : false);

    return (
      <Button
        ref={ref}
        type="submit"
        disabled={disabled}
        className={cn(
          "min-w-32 relative overflow-hidden transition-all duration-150", 
          disabled ? "opacity-50 cursor-not-allowed" : "",
          className
        )}
        {...props}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isPending ? (
            <motion.span
              key="pending"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center justify-center gap-1.5"
            >
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>{loadingText}</span>
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center justify-center gap-1.5"
            >
              {!hideIcon && (
                <AppIcon
                  name={resolvedIcon}
                  icon={icon}
                  size={16}
                  disableHover={true}
                  className="mr-0.5"
                />
              )}
              <span>{children}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    );
  }
);

FormSubmitButton.displayName = "FormSubmitButton";
