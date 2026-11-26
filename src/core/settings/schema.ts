import { z } from 'zod';

export const settingsSchema = z.object({
  toolbarClick: z.enum(['stow-window', 'popup', 'library']).catch('popup'),
  afterStow: z.enum(['show-library', 'stay']).catch('show-library'),
  ignorePinnedTabs: z.boolean().catch(true),
  stowIncognito: z.boolean().catch(false),
  preserveBrowserGroups: z.boolean().catch(true),
  ignoredSites: z.array(z.string()).catch([]),
  dedupe: z.enum(['global', 'off']).catch('global'),
  stripTrackingForDedupe: z.boolean().catch(true),
  restoreTarget: z.enum(['current-window', 'new-window']).catch('current-window'),
  removeOnRestore: z.boolean().catch(true),
  restorePinned: z.boolean().catch(true),
  restoreGroups: z.boolean().catch(true),
  openLibraryOnStartup: z.boolean().catch(false),
  pinLibraryTab: z.boolean().catch(false),
  theme: z.enum(['system', 'light', 'dark']).catch('system'),
  density: z.enum(['comfortable', 'compact']).catch('comfortable'),
  showFavicons: z.boolean().catch(true),
  trashRetentionDays: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(0)]).catch(30),
  autoBackup: z.enum(['off', 'daily', 'weekly']).catch('off'),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = settingsSchema.parse({});

export function parseSettings(input: unknown): Settings {
  const parsed = settingsSchema.safeParse(input ?? {});
  return parsed.success ? parsed.data : { ...DEFAULT_SETTINGS };
}
