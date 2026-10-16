import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SearchCard() {
  return (
    <Card className="min-h-96 lg:col-span-1">
      <CardHeader>
        <CardTitle>Search</CardTitle>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
