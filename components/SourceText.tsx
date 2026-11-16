import { Num } from "@/components/ui";

/** Keep quoted JSON copy intact while giving its numerals the shared face. */
export function SourceText({ text }: { text: string }) {
  return text.split(/(\d[\d.,–−-]*)/g).map((part, i) =>
    /\d/.test(part) ? <Num key={i}>{part}</Num> : part,
  );
}
