import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DataCard() {
  return (
    <Card className="min-h-96 lg:col-span-2">
      <CardHeader>
        <CardTitle>Data</CardTitle>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
