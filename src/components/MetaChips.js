export default function MetaChips({ items, align = "left", size = "md" }) {
  const sizeCls = size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5";

  return (
    <ul
      aria-label="context"
      className={[
        "flex flex-wrap gap-2",
        align === "center" ? "justify-center" : "",
      ].join(" ")}
      role="list"
    >
      {items.map((t) => (
        <li
          key={t}
          role="listitem"
          className={[
            "rounded-full",
            "border border-neutral-200/60 bg-neutral-100",
            "text-neutral-600",
            "select-none cursor-default", // 👈 very obviously not a button
            sizeCls,
          ].join(" ")}
        >
          {t}
        </li>
      ))}
    </ul>
  );
}
