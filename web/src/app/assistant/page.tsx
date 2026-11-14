import AssistantChat from "@/components/AssistantChat";

export default function Assistant() {
  return (
    <div className="screen">
      <header className="flex shrink-0 flex-col gap-1 border-b border-line-soft px-5 pt-14 pb-3">
        <h1 className="font-display text-2xl font-bold tracking-[-0.4px]">Assistant cultures</h1>
        <span className="text-[13px] text-muted">Répond à partir de NASA POWER et FAO ECOCROP</span>
      </header>
      <AssistantChat />
    </div>
  );
}
