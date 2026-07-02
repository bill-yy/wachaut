/**
 * Shared chat types for host & viewer.
 */

export interface ChatMessage {
	id?: string;
	sender: string;
	text: string;
	timestamp: Date;
}

/** Sender display names with special roles. */
export const SENDER_HOST = 'Anfitrión';
export const SENDER_SYSTEM = 'Sistema';

/** Build a system message with a unique id and current timestamp. */
export function systemMessage(text: string): ChatMessage {
	return {
		id: `system-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		sender: SENDER_SYSTEM,
		text,
		timestamp: new Date(),
	};
}

/** Format a chat timestamp as HH:MM (es-ES). */
export function formatChatTime(ts: Date): string {
	if (!(ts instanceof Date)) return '';
	return ts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
