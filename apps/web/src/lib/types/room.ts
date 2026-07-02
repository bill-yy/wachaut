/**
 * Shared room types for host & viewer.
 */

export interface Viewer {
	viewerId: string;
	name?: string;
}

export interface FloatingReaction {
	id: number;
	emoji: string;
	x: number;
	bottom: number;
	fontSize: number;
	xOffset: string;
	rotation: string;
	delay: number;
	duration: number;
	createdAt: number;
}

export interface ConfettiParticle {
	id: number;
	x: number;
	delay: number;
	duration: number;
	rotation: number;
	size: number;
	color: string;
	type: 'rect' | 'emoji';
	emoji: string;
	borderRadius: string;
}
