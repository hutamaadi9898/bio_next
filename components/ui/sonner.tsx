"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Central toast exporter so components can import from a single place.
 */
export const Toaster = () => <SonnerToaster position="top-right" richColors />;

export { toast };
