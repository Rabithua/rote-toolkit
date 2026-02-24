import type { RoteNote } from './types.js';

export function printNotes(notes: RoteNote[]): void {
  if (!Array.isArray(notes) || notes.length === 0) {
    console.log('No notes found.');
    return;
  }

  notes.forEach((note, idx) => {
    const tags = note.tags?.length ? ` [${note.tags.join(', ')}]` : '';
    const title = note.title ? `${note.title} - ` : '';
    const content = truncateSingleLine(note.content || '', 120);
    console.log(`${idx + 1}. ${title}${content}${tags}`);
  });
}

export function truncateSingleLine(text: string, max = 120): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) {
    return compact;
  }
  return `${compact.slice(0, Math.max(0, max - 3))}...`;
}
