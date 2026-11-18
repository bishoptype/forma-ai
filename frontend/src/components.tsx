export function Badge({ status }: { status: string }) {
  return (
    <span className={"badge " + status}>
      <span className="status-dot" />
      {(
        {
          resolved: "Решён AI",
          closed: "Решён командой",
          handoff: "Менеджеру",
          open: "Открыт",
          ready: "Готово",
          indexing: "Индексация",
        } as Record<string, string>
      )[status] || status}
    </span>
  );
}
