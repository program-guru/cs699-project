import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

const colleges = [
  "Arizona State University",
  "Boston University",
  "Columbia University",
  "Duke University",
  "Georgia Institute of Technology",
  "Massachusetts Institute of Technology",
  "Northwestern University",
  "Stanford University",
  "University of Michigan",
  "University of Texas at Austin",
  "Arizona State University",
  "Boston University",
  "Columbia University",
  "Duke University",
  "Georgia Institute of Technology",
  "Massachusetts Institute of Technology",
  "Northwestern University",
  "Stanford University",
  "University of Michigan",
  "University of Texas at Austin",
];

export function SearchCard() {
  return (
    <Card className="min-h-96 lg:col-span-1">
      <CardHeader>
        <CardTitle>Search</CardTitle>
        <CardDescription>Find your colleges here</CardDescription>
      </CardHeader>
      <CardContent>
        <Command className="rounded-none border">
          <CommandInput placeholder="Type to search..." />
          <ScrollArea className="max-h-96">
            <CommandList className="max-h-none overflow-visible">
              <CommandEmpty>No colleges found.</CommandEmpty>
              <CommandGroup>
                {colleges.map((college, index) => (
                  <CommandItem key={`${college}-${index}`} value={college}>
                    {college}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </CardContent>
    </Card>
  );
}
