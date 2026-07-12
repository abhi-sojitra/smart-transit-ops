'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { PLACEHOLDERS } from '@/constants/form';

interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  containerClassName?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  debounceMs?: number;
  shortcutHint?: boolean;
}

export function SearchInput({
  className,
  containerClassName,
  value,
  defaultValue = '',
  onChange,
  debounceMs = 300,
  placeholder = PLACEHOLDERS.search,
  shortcutHint = true,
  ...props
}: SearchInputProps) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const emitChange = (next: string) => {
    if (!isControlled) setInternal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange?.(next), debounceMs);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return (
    <div className={cn('relative', containerClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={props['aria-label'] ?? 'Search'}
        autoComplete="off"
        placeholder={placeholder}
        className={cn('pl-9 pr-16', className)}
        value={current}
        onChange={(e) => emitChange(e.target.value)}
        {...props}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {current ? (
          <button
            type="button"
            aria-label="Clear search"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              if (!isControlled) setInternal('');
              onChange?.('');
              inputRef.current?.focus();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : shortcutHint ? (
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        ) : null}
      </div>
    </div>
  );
}
