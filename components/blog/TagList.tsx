type TagListProps = {
  tags: string[];
};

export default function TagList({ tags }: TagListProps) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No tags yet. Keep this component and map blog tags here later.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
