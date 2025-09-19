export default function MetaChips({ items, align = "left", size = "md" }) {
  const sizeCls =
    size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5";

  return (
    <ul
      aria-label="context"
      className={[
        "flex flex-wrap gap-2",
        align === "center" ? "justify-center" : "",
      ].join(" ")}
    >
      {items.map((t) => (
        <li
          key={t}
          className={[
            "rounded-full border border-neutral-200/60 bg-neutral-100",
            "text-neutral-600 select-none cursor-default",
            sizeCls,
          ].join(" ")}
          role="text" // reinforce it's not interactive
        >
          {t}
        </li>
      ))}
    </ul>
  );
}
