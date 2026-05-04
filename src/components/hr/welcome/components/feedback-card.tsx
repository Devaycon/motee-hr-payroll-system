"use client";

import Link from "next/link";
import { MessageSquare, HelpCircle, Bug, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

export function FeedbackCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">
          Feedback & Support
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Have a question or issue with the Motee platform? Send a message
          directly to the Motee team.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-start gap-2"
          >
            <Link href="#">
              <HelpCircle className="w-3.5 h-3.5" />
              Contact Motee Support
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-start gap-2"
          >
            <Link href="#">
              <Bug className="w-3.5 h-3.5" />
              Report a Platform Issue
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-start gap-2"
          >
            <Link href="#">
              <Star className="w-3.5 h-3.5" />
              Suggest a Feature to Motee
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
