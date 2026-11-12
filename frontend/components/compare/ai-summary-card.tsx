import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AiSummaryCard() {
  return (
    <Card className="min-w-0" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles aria-hidden="true" />
          AI summary
        </CardTitle>
        <CardDescription>
          An AI-powered comparison will appear here.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-64 flex-1 items-center justify-center text-center text-sm text-muted-foreground">
        AI summary is coming soon.
      </CardContent>
    </Card>
  );
}
