import PromptForm from "@/components/PromptForm/PromptForm";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <main className="py-8 px-4">
      {/* Header with theme toggle */}
      <div className="max-w-2xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Prompt Generator</h1>
        <ThemeToggle />
      </div>

      <PromptForm />
    </main>
  );
}
