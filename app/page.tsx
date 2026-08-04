import { TeamsTable } from "@/components/TeamsTable";
import { deepBenchData } from "@/lib/data";

export default function Home() {
  const { teams, meta } = deepBenchData;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-lg font-semibold sm:text-xl">{meta.title}</h1>
        <p className="mt-1 text-xs text-neutral-600 sm:text-sm dark:text-neutral-400">
          Swapping benches between NBA rosters to measure depth&apos;s impact on
          wins.
        </p>
      </header>

      <TeamsTable teams={teams} />

      <section className="mt-10 border-t border-neutral-300 pt-6 dark:border-neutral-700">
        <h2 className="text-sm font-semibold sm:text-base">
          Methodology &amp; limitations
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-neutral-700 sm:text-sm dark:text-neutral-300">
          {meta.disclosures.map((disclosure, i) => (
            <li key={i}>{disclosure}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
