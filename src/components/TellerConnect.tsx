"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TellerEnrollment, TellerConnectInstance } from "@/types/teller";

const TELLER_CONNECT_SCRIPT_URL = "https://cdn.teller.io/connect/connect.js";

interface TellerConnectProps {
  /** Custom button text */
  buttonText?: string;
  /** Custom class name for the button */
  className?: string;
  /** Callback when bank is successfully connected */
  onSuccess?: (enrollment: TellerEnrollment) => void;
  /** Callback when user exits without connecting */
  onExit?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

export default function TellerConnect({
  buttonText,
  className,
  onSuccess,
  onExit,
  onError,
}: TellerConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{
    applicationId: string;
    environment: "sandbox" | "development" | "production";
    userId: string;
  } | null>(null);
  
  const tellerInstanceRef = useRef<TellerConnectInstance | null>(null);

  // Load Teller Connect script
  useEffect(() => {
    // Check if script is already loaded
    if (window.TellerConnect) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      `script[src="${TELLER_CONNECT_SCRIPT_URL}"]`
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsScriptLoaded(true));
      return;
    }

    // Create and load script
    const script = document.createElement("script");
    script.src = TELLER_CONNECT_SCRIPT_URL;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      setError("Failed to load Teller Connect. Please try again.");
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: destroy Teller instance if it exists
      if (tellerInstanceRef.current) {
        tellerInstanceRef.current.destroy();
        tellerInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch Teller configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/teller/create-enrollment", {
          method: "POST",
        });

        if (!response.ok) {
          if (response.status === 503) {
            // Teller not configured - don't show error, just disable
            return;
          }
          const data = await response.json();
          throw new Error(data.error || "Failed to get Teller configuration");
        }

        const data = await response.json();
        setConfig({
          applicationId: data.applicationId,
          environment: data.environment || "sandbox",
          userId: data.userId,
        });
      } catch (err) {
        console.error("Error fetching Teller config:", err);
        // Don't set error here - we'll handle it when user clicks
      }
    };

    fetchConfig();
  }, []);

  // Handle successful enrollment - save to backend
  const handleEnrollmentSuccess = useCallback(
    async (enrollment: TellerEnrollment) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/teller/exchange-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: enrollment.accessToken,
            enrollmentId: enrollment.enrollmentId || enrollment.user?.id,
            institution: enrollment.institution,
            accounts: enrollment.accounts,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save bank connection");
        }

        // Trigger initial sync
        await fetch("/api/teller/sync", { method: "POST" });

        // Call success callback
        onSuccess?.(enrollment);

        // Refresh page to show new accounts
        window.location.reload();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to connect bank";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError]
  );

  // Open Teller Connect
  const handleConnect = useCallback(async () => {
    setError(null);

    // If config not loaded, try to fetch it
    if (!config) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/teller/create-enrollment", {
          method: "POST",
        });

        if (!response.ok) {
          if (response.status === 503) {
            setError(
              "Banking integration is not configured yet. Please contact support."
            );
            setIsLoading(false);
            return;
          }
          const data = await response.json();
          throw new Error(data.error || "Failed to get Teller configuration");
        }

        const data = await response.json();
        setConfig({
          applicationId: data.applicationId,
          environment: data.environment || "sandbox",
          userId: data.userId,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize";
        setError(errorMessage);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    // Wait for script to load
    if (!isScriptLoaded || !window.TellerConnect) {
      setError("Teller Connect is still loading. Please try again.");
      return;
    }

    // Use the config we just fetched or the one from state
    const currentConfig = config || (await (async () => {
      const response = await fetch("/api/teller/create-enrollment", {
        method: "POST",
      });
      const data = await response.json();
      return {
        applicationId: data.applicationId,
        environment: data.environment || "sandbox",
        userId: data.userId,
      };
    })());

    if (!currentConfig?.applicationId) {
      setError("Banking service is not properly configured.");
      return;
    }

    try {
      // Create Teller Connect instance
      const tellerConnect = window.TellerConnect.setup({
        applicationId: currentConfig.applicationId,
        environment: currentConfig.environment,
        selectAccount: "multiple",
        products: ["balance", "transactions"],
        onSuccess: (enrollment: TellerEnrollment) => {
          handleEnrollmentSuccess(enrollment);
        },
        onExit: () => {
          onExit?.();
        },
        onFailure: (failure) => {
          console.error("Teller Connect failure:", failure);
          setError(failure.message || "Bank connection failed. Please try again.");
          onError?.(failure.message);
        },
      });

      tellerInstanceRef.current = tellerConnect;

      // Open the Teller Connect modal
      tellerConnect.open();
    } catch (err) {
      console.error("Error opening Teller Connect:", err);
      setError("Failed to open bank connection. Please try again.");
    }
  }, [config, isScriptLoaded, handleEnrollmentSuccess, onExit, onError]);

  const isDisabled = isLoading || (!isScriptLoaded && !error);
  const displayButtonText =
    buttonText ||
    (isLoading
      ? "Connecting..."
      : !isScriptLoaded
      ? "Loading..."
      : "Connect Bank Account");

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={handleConnect}
        disabled={isDisabled}
        className={
          className ||
          "px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {displayButtonText}
      </button>
      {error && <p className="text-sm text-red-600 mt-2 max-w-xs">{error}</p>}
    </div>
  );
}
