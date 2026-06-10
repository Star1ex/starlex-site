export function hashWorkspaceColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  const palette = ['#e6455a', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#14b8a6'];
  return palette[Math.abs(h) % palette.length];
}

export function workspaceInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function getWorkspaceColor(name: string): string {
  return hashWorkspaceColor(name);
}
