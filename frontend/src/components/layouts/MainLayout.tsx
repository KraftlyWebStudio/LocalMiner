"use client";

import { ReactNode } from "react";

type MainLayoutProps = {
  left: ReactNode;
  right: ReactNode;
};

export default function MainLayout({ left, right }: MainLayoutProps) {
  return (
    <main className="flex h-screen w-screen flex-col bg-zinc-100 md:flex-row">
      <section className="h-1/2 border-b border-zinc-300 bg-zinc-50 md:h-full md:w-[38%] md:border-b-0 md:border-r">
        {left}
      </section>
      <section className="h-1/2 bg-white md:h-full md:w-[62%]">{right}</section>
    </main>
  );
}
