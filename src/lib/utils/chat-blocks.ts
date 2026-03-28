/**
 * Chat Rich Blocks — parse special :::block markers from AI output
 * into structured HTML that the chat UI renders with custom styling.
 *
 * The AI can output these blocks anywhere in its response:
 *
 *   :::stack
 *   Testosterone | 500mg/wk | /compounds/testosterone
 *   HGH | 3-5IU daily | /peptides/hgh
 *   HCG | 500IU 2-3x/wk | /peptides/hcg
 *   :::
 *
 *   :::comparison
 *   | | Enclomiphene | Tamoxifen |
 *   | Mechanism | SERM (trans-isomer) | SERM (mixed) |
 *   | Half-life | ~10 hours | ~5-7 days |
 *   :::
 *
 *   :::warning
 *   Do not combine nitrates with PDE5 inhibitors — risk of severe hypotension.
 *   :::
 *
 *   :::callout title="Pro Tip"
 *   Daily pins give more stable blood levels than weekly.
 *   :::
 *
 *   :::timeline
 *   Week 1-2 | Initial changes, mood improvement
 *   Week 3-4 | Strength gains, libido increase
 *   Week 6-8 | Visible body composition changes
 *   :::
 */

export function parseRichBlocks(text: string): string {
	// Process :::block ... ::: patterns
	return text.replace(
		/:::(\w+)(?:\s+([^\n]*))?\n([\s\S]*?):::/g,
		(_match, type: string, meta: string, body: string) => {
			switch (type) {
				case 'stack':
					return renderStack(body.trim());
				case 'comparison':
					return renderComparison(body.trim());
				case 'warning':
					return renderWarning(body.trim());
				case 'callout':
					return renderCallout(body.trim(), meta?.trim());
				case 'timeline':
					return renderTimeline(body.trim());
				case 'dosing':
					return renderDosing(body.trim(), meta?.trim());
				default:
					// Unknown block type — render as a styled box
					return renderCallout(body.trim(), type);
			}
		}
	);
}

function renderStack(body: string): string {
	const lines = body
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	const items = lines.map((line) => {
		const parts = line.split('|').map((p) => p.trim());
		const name = parts[0] || '';
		const dose = parts[1] || '';
		const url = parts[2] || '';
		return { name, dose, url };
	});

	const itemsHtml = items
		.map((item) => {
			const nameHtml = item.url
				? `<a href="${item.url}" class="cb-stack-name">${item.name}</a>`
				: `<span class="cb-stack-name">${item.name}</span>`;
			return `<div class="cb-stack-item">
				<div class="cb-stack-dot"></div>
				${nameHtml}
				${item.dose ? `<span class="cb-stack-dose">${item.dose}</span>` : ''}
			</div>`;
		})
		.join('');

	// Build query params for tools
	const ids = items
		.map((i) => {
			const match = i.url?.match(/\/(peptides|compounds)\/([^/]+)/);
			return match ? match[2] : '';
		})
		.filter(Boolean);
	const interactionUrl = ids.length >= 2 ? `/tools/interactions?peptides=${ids.join(',')}` : '';
	const costUrl = ids[0] ? `/tools/cost?peptide=${ids[0]}` : '';

	const toolsHtml =
		interactionUrl || costUrl
			? `<div class="cb-stack-tools">
				${interactionUrl ? `<a href="${interactionUrl}" class="cb-stack-tool">Check Interactions</a>` : ''}
				${costUrl ? `<a href="${costUrl}" class="cb-stack-tool">Cost Calculator</a>` : ''}
			</div>`
			: '';

	return `<div class="cb-stack">
		<div class="cb-stack-header">Stack</div>
		<div class="cb-stack-items">${itemsHtml}</div>
		${toolsHtml}
	</div>`;
}

function renderComparison(body: string): string {
	const lines = body
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	if (lines.length < 2) return `<p>${body}</p>`;

	const rows = lines.map((line) =>
		line
			.split('|')
			.map((c) => c.trim())
			.filter((c) => c !== '')
	);

	const headerRow = rows[0];
	const dataRows = rows.slice(1);

	const headerHtml = headerRow.map((h) => `<th class="cb-cmp-th">${h}</th>`).join('');
	const bodyHtml = dataRows
		.map(
			(row) =>
				`<tr>${row.map((cell, i) => (i === 0 ? `<td class="cb-cmp-label">${cell}</td>` : `<td class="cb-cmp-td">${cell}</td>`)).join('')}</tr>`
		)
		.join('');

	return `<div class="cb-comparison">
		<table class="cb-cmp-table">
			<thead><tr>${headerHtml}</tr></thead>
			<tbody>${bodyHtml}</tbody>
		</table>
	</div>`;
}

function renderWarning(body: string): string {
	return `<div class="cb-warning">
		<div class="cb-warning-icon">!</div>
		<div class="cb-warning-text">${body}</div>
	</div>`;
}

function renderCallout(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || '';
	return `<div class="cb-callout">
		${title ? `<div class="cb-callout-title">${title}</div>` : ''}
		<div class="cb-callout-body">${body}</div>
	</div>`;
}

function renderTimeline(body: string): string {
	const lines = body
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	const entries = lines.map((line) => {
		const [period, ...rest] = line.split('|').map((p) => p.trim());
		return { period, text: rest.join(' | ') };
	});

	const html = entries
		.map(
			(e) => `<div class="cb-tl-entry">
				<div class="cb-tl-period">${e.period}</div>
				<div class="cb-tl-text">${e.text}</div>
			</div>`
		)
		.join('');

	return `<div class="cb-timeline">${html}</div>`;
}

function renderDosing(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || 'Protocol';
	const lines = body
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	const items = lines.map((line) => {
		const parts = line.split('|').map((p) => p.trim());
		return { label: parts[0] || '', value: parts[1] || '', note: parts[2] || '' };
	});

	const html = items
		.map(
			(i) => `<div class="cb-dose-row">
				<span class="cb-dose-label">${i.label}</span>
				<span class="cb-dose-value">${i.value}</span>
				${i.note ? `<span class="cb-dose-note">${i.note}</span>` : ''}
			</div>`
		)
		.join('');

	return `<div class="cb-dosing">
		<div class="cb-dosing-title">${title}</div>
		${html}
	</div>`;
}
