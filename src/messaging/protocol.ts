import { z } from 'zod';
import type { RestoreRequest, StowScope } from '../core/domain/types';
import { focusOrCreate } from '../platform/windows';
import { type RestoreResult, restore } from '../services/restore';
import { eligibleCount, type StowResult, stow } from '../services/stow';

export const stowScopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('window'), windowId: z.number().optional() }),
  z.object({ kind: z.literal('all-windows') }),
  z.object({ kind: z.literal('tab'), tabId: z.number() }),
  z.object({ kind: z.literal('others'), tabId: z.number() }),
  z.object({ kind: z.literal('left'), tabId: z.number() }),
  z.object({ kind: z.literal('right'), tabId: z.number() }),
  z.object({ kind: z.literal('highlighted'), windowId: z.number().optional() }),
]);

export const restoreRequestSchema = z.object({
  by: z.enum(['tab', 'stack', 'selection']),
  ids: z.array(z.string().min(1)).max(200_000),
  window: z.enum(['current', 'new']).optional(),
  background: z.boolean().optional(),
  invertRemove: z.boolean().optional(),
});

export const protocolSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('stow'), payload: z.object({ scope: stowScopeSchema }) }),
  z.object({ type: z.literal('restore'), payload: restoreRequestSchema }),
  z.object({ type: z.literal('openLibrary'), payload: z.object({ hash: z.string().optional() }) }),
  z.object({ type: z.literal('getEligibleCount'), payload: z.object({ scope: stowScopeSchema }) }),
  z.object({ type: z.literal('requestBackupPermission'), payload: z.object({}).optional() }),
]);

export type ProtocolMessage = z.infer<typeof protocolSchema>;

export interface Responses {
  stow: StowResult;
  restore: RestoreResult;
  openLibrary: { ok: true };
  getEligibleCount: { count: number };
  requestBackupPermission: { granted: boolean };
}

export async function handleMessage(
  raw: unknown,
  sender: chrome.runtime.MessageSender,
): Promise<Responses[keyof Responses] | { ok: false; error: { code: string; message: string } }> {
  if (sender.id !== chrome.runtime.id) {
    return { ok: false, error: { code: 'forbidden', message: 'Unknown sender' } };
  }
  const parsed = protocolSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'bad-request', message: 'Unknown command' } };
  }
  const message = parsed.data;
  switch (message.type) {
    case 'stow':
      return stow(message.payload.scope as StowScope);
    case 'restore':
      return restore(message.payload as RestoreRequest);
    case 'openLibrary':
      await focusOrCreate({ hash: message.payload.hash });
      return { ok: true };
    case 'getEligibleCount':
      return { count: await eligibleCount(message.payload.scope as StowScope) };
    case 'requestBackupPermission': {
      const granted = await chrome.permissions.request({ permissions: ['downloads'] });
      return { granted };
    }
    default:
      return { ok: false, error: { code: 'bad-request', message: 'Unknown command' } };
  }
}

export async function send<K extends keyof Responses>(
  type: K,
  payload: unknown,
): Promise<Responses[K]> {
  const message = { type, payload };
  const response = await chrome.runtime.sendMessage(message);
  return response as Responses[K];
}
