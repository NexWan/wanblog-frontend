export default function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2 text-xs font-label">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-surface-container-highest px-3 py-1 uppercase tracking-widest text-on-surface-variant border border-outline-variant/10 shadow-sm"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
