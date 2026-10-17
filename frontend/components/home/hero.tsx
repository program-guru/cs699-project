"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

const universities = [
  {
    name: "IIT Bombay",
    location: "Mumbai, India",
    description: "A leading institute for engineering, science, and innovation.",
    image: "/images/IIT Bombay Logo.png",
  },
  {
    name: "IIT Delhi",
    location: "New Delhi, India",
    description: "Where ambitious ideas become meaningful impact.",
    image: "/images/IIT Delhi Logo.png",
  },
  {
    name: "IIT Madras",
    location: "Chennai, India",
    description: "Discover a campus built for curiosity and discovery.",
    image: "/images/IIT Madras Logo.png",
  },
];

export function Hero() {
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();

  React.useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const interval = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [carouselApi]);

  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-12 sm:gap-16 sm:px-6 sm:py-16 lg:grid-cols-[1.5fr_1fr] lg:gap-8 lg:px-8 lg:py-24">
      
      {/* Left Column: Text Content */}
      <div className="flex flex-col items-start gap-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <BookOpen aria-hidden="true" className="size-4" />
          <span>Find your next chapter</span>
        </div>

        <blockquote className="max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          “The future belongs to those who prepare for it today.”
        </blockquote>

        <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-8">
          Explore universities, compare opportunities, and make a confident
          decision about where your ambition can take you.
        </p>

        <Button
          nativeButton={false}
          render={<Link href="/colleges" />}
          className="mt-2"
        >
          Explore universities
        </Button>
      </div>

      {/* Right Column: Carousel */}
      <div className="relative min-w-0 w-full">
        <Carousel
          aria-label="Featured universities"
          className="mx-auto h-96 w-full max-w-md sm:h-112 sm:max-w-lg lg:h-128 lg:max-w-2xl"
          opts={{ align: "start", loop: true }}
          orientation="vertical"
          setApi={setCarouselApi}
        >
          <CarouselContent className="h-full">
            {universities.map((university) => (
              <CarouselItem key={university.name} className="h-full">
                <article className="flex h-full flex-col gap-6 rounded-3xl border bg-card p-6 shadow-sm sm:gap-8 sm:p-8">
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="mx-auto flex aspect-square w-full max-w-48 items-center justify-center rounded-2xl bg-muted p-4 sm:max-w-64 sm:p-6">
                      <Image
                        src={university.image}
                        alt={`${university.name} logo`}
                        width={256}
                        height={256}
                        className="size-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {university.location}
                    </p>
                    <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                      {university.name}
                    </h2>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none sm:leading-6">
                      {university.description}
                    </p>
                  </div>
                  
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      
    </section>
  );
}