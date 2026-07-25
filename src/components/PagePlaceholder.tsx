interface PagePlaceholderProps {
  name: string;
}

export default function PagePlaceholder({ name }: PagePlaceholderProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
        {name}
      </h1>
    </div>
  );
}
