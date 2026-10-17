import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

type DataCardProps = {
  number: number | string;
  description: string;
};

export function DataCard({ number, description }: DataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-4xl tracking-tight">{number}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
