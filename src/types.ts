export interface LabelRule {
	label: string;
	color: string;
	sender?: string;
	email?: string;
	subject?: string;
	content?: string;
}

export interface Email {
	element: HTMLElement;
	sender: string | null;
	email: string | null;
	subject: string | null;
	snippet: string | null;
}

export interface StorageData {
	labelRules: LabelRule[];
}
