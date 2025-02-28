// src/components/dashboard/ProfilePrompt.jsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfilePrompt() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Please complete your profile to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">We need some additional information before you can use the platform.</p>
        <Button asChild>
          <Link href="/profile">Set Up Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}