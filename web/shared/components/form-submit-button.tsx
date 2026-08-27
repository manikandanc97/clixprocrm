import React from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { Button, ButtonProps } from '@/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { AppIcon } from '@/shared/components/icons/icon-registry';
import { cn } from '@/shared/lib/utils';

export interface FormSubmitButtonProps extends ButtonProps {
  isDirty: boolean;
  isPending?: boolean;
  loadingText?: string;
  iconName?: string;
  icon?: any;
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
    
    // Fallback if not used within a FormProvider (though it usually should be)
    if (!context) {
      const disabled = isPending || !isDirty;
      return (
        <Button
          ref={ref}
          type="submit"
          disabled={disabled}
          className={cn(
            "min-w-32 transition-all", 
            disabled ? "opacity-50 cursor-not-allowed" : "",
            className
          )}
          {...props}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingText}
            </>
          ) : (
            <>
              {!hideIcon && (
                <AppIcon
                  name={resolvedIcon}
                  icon={icon}
                  size={16}
                  disableHover={true}
                  className="mr-1.5"
                />
              )}
              {children}
            </>
          )}
        </Button>
      );
    }

    // Subscribe to form validity
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isValid } = useFormState({ control: context.control });

    const disabled = isPending || !isDirty || !isValid;

    return (
      <Button
        ref={ref}
        type="submit"
        disabled={disabled}
        className={cn(
          "min-w-32 transition-all", 
          disabled ? "opacity-50 cursor-not-allowed" : "",
          className
        )}
        {...props}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {!hideIcon && (
              <AppIcon
                name={resolvedIcon}
                icon={icon}
                size={16}
                disableHover={true}
                className="mr-1.5"
              />
            )}
            {children}
          </>
        )}
      </Button>
    );
  }
);

FormSubmitButton.displayName = "FormSubmitButton";
