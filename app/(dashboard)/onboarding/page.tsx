import * as React from "react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarUploader, BannerUploader } from "@/components/onboarding/steps-client";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireUser } from "@/lib/auth/session";

export const metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const { profile } = await requireUser();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card className="bg-card/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <CardDescription>Choose a preset, add your photo, and drop in a few links.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <OnboardingForm />
          <MediaStep />
        </CardContent>
      </Card>
    </div>
  );
}


function MediaStep() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">2. Add your avatar and banner</h2>
        <p className="text-sm text-muted-foreground">Images help your page feel personal. Optional — you can skip for now.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AvatarUploader />
        <BannerUploader />
      </div>
    </section>
  );
}


// Client sub-steps moved to components/onboarding/steps-client.tsx
