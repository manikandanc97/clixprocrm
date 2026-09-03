/**
 * Dynamically and reliably loads the official Razorpay Checkout SDK (checkout.js).
 * Ensures singleton script loading, handles re-entrant calls, and guarantees promise resolution without hanging.
 */
let razorpayLoadPromise: Promise<boolean> | null = null;

export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  // If already available on window
  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayLoadPromise) {
    return razorpayLoadPromise;
  }

  razorpayLoadPromise = new Promise<boolean>((resolve) => {
    // Check if script tag was already injected in DOM
    const existingScript = document.getElementById("razorpay-checkout-script") as HTMLScriptElement | null;
    
    // Safety timeout to prevent any infinite hang
    const timeoutId = setTimeout(() => {
      if ((window as any).Razorpay) {
        resolve(true);
      } else {
        console.warn("[Razorpay Loader] Timed out waiting for Razorpay checkout SDK.");
        resolve(false);
      }
    }, 7000);

    const onScriptLoaded = () => {
      clearTimeout(timeoutId);
      if ((window as any).Razorpay) {
        console.log("[Razorpay Loader] Razorpay Checkout SDK loaded successfully.");
        resolve(true);
      } else {
        console.warn("[Razorpay Loader] Script loaded but window.Razorpay is undefined.");
        resolve(false);
      }
    };

    const onScriptError = (err?: any) => {
      clearTimeout(timeoutId);
      console.error("[Razorpay Loader] Failed to load Razorpay checkout script:", err);
      // Reset so retry is possible
      razorpayLoadPromise = null;
      resolve(false);
    };

    if (existingScript) {
      if ((window as any).Razorpay) {
        clearTimeout(timeoutId);
        resolve(true);
        return;
      }
      existingScript.addEventListener("load", onScriptLoaded);
      existingScript.addEventListener("error", onScriptError);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = onScriptLoaded;
    script.onerror = onScriptError;

    document.body.appendChild(script);
  });

  return razorpayLoadPromise;
}

