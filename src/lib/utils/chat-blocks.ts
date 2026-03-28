/**
 * Chat Rich Blocks — parse special :::block markers from AI output
 * into structured HTML that the chat UI renders with custom styling.
 *
 * 12 block types: stack, comparison, warning, callout, timeline, dosing,
 * calculator, chart, poll, bloodwork, cost, quiz
 */

export function parseRichBlocks(text: string): string {
	return text.replace(
		/:::(\w+)(?:\s+([^\n]*))?\n([\s\S]*?):::/g,
		(_match, type: string, meta: string, body: string) => {
			const b = body.trim();
			const m = meta?.trim();
			switch (type) {
				case 'stack':
					return renderStack(b);
				case 'comparison':
					return renderComparison(b);
				case 'warning':
					return renderWarning(b);
				case 'callout':
					return renderCallout(b, m);
				case 'timeline':
					return renderTimeline(b);
				case 'dosing':
					return renderDosing(b, m);
				case 'calculator':
					return renderCalculator(b, m);
				case 'chart':
					return renderChart(b, m);
				case 'poll':
					return renderPoll(b, m);
				case 'bloodwork':
					return renderBloodwork(b, m);
				case 'cost':
					return renderCost(b, m);
				case 'quiz':
					return renderQuiz(b, m);
				default:
					return renderCallout(b, type);
			}
		}
	);
}

// ── Helpers ──

function parsePipeLines(body: string): string[][] {
	return body
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.map((line) => line.split('|').map((p) => p.trim()));
}

function extractIds(items: { url?: string }[]): string[] {
	return items
		.map((i) => {
			const match = i.url?.match(/\/(peptides|compounds)\/([^/]+)/);
			return match ? match[2] : '';
		})
		.filter(Boolean);
}

// ── Stack ──

function renderStack(body: string): string {
	const lines = parsePipeLines(body);
	const items = lines.map(([name, dose, url]) => ({ name: name || '', dose: dose || '', url: url || '' }));

	const itemsHtml = items
		.map((item) => {
			const nameHtml = item.url
				? `<a href="${item.url}" class="cb-stack-name">${item.name}</a>`
				: `<span class="cb-stack-name">${item.name}</span>`;
			return `<div class="cb-stack-item"><div class="cb-stack-dot"></div>${nameHtml}${item.dose ? `<span class="cb-stack-dose">${item.dose}</span>` : ''}</div>`;
		})
		.join('');

	const ids = extractIds(items);
	// Only show tool links if we have real compound IDs (not empty/generic)
	const validIds = ids.filter((id) => id.length > 1 && !id.includes(' '));
	const interactionUrl = validIds.length >= 2 ? `/tools/interactions?peptides=${validIds.join(',')}` : '';
	const costUrl = validIds[0] ? `/tools/cost?peptide=${validIds[0]}` : '';

	const toolsHtml =
		interactionUrl || costUrl
			? `<div class="cb-stack-tools">${interactionUrl ? `<a href="${interactionUrl}" class="cb-stack-tool">Check Interactions</a>` : ''}${costUrl ? `<a href="${costUrl}" class="cb-stack-tool">Cost Calculator</a>` : ''}</div>`
			: '';

	return `<div class="cb-stack"><div class="cb-stack-header">Stack</div><div class="cb-stack-items">${itemsHtml}</div>${toolsHtml}</div>`;
}

// ── Comparison ──

function renderComparison(body: string): string {
	const lines = parsePipeLines(body);
	if (lines.length < 2) return `<p>${body}</p>`;

	const headerHtml = lines[0].map((h) => `<th class="cb-cmp-th">${h}</th>`).join('');
	const bodyHtml = lines
		.slice(1)
		.map(
			(row) =>
				`<tr>${row.map((cell, i) => (i === 0 ? `<td class="cb-cmp-label">${cell}</td>` : `<td class="cb-cmp-td">${cell}</td>`)).join('')}</tr>`
		)
		.join('');

	return `<div class="cb-comparison"><table class="cb-cmp-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

// ── Warning ──

function renderWarning(body: string): string {
	return `<div class="cb-warning"><div class="cb-warning-icon">!</div><div class="cb-warning-text">${body}</div></div>`;
}

// ── Callout ──

function renderCallout(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || '';
	return `<div class="cb-callout">${title ? `<div class="cb-callout-title">${title}</div>` : ''}<div class="cb-callout-body">${body}</div></div>`;
}

// ── Timeline ──

function renderTimeline(body: string): string {
	const lines = parsePipeLines(body);
	const html = lines
		.map(([period, ...rest]) => `<div class="cb-tl-entry"><div class="cb-tl-period">${period}</div><div class="cb-tl-text">${rest.join(' ')}</div></div>`)
		.join('');
	return `<div class="cb-timeline">${html}</div>`;
}

// ── Dosing ──

function renderDosing(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || 'Protocol';
	const lines = parsePipeLines(body);
	const html = lines
		.map(
			([label, value, note]) =>
				`<div class="cb-dose-row"><span class="cb-dose-label">${label || ''}</span><span class="cb-dose-value">${value || ''}</span>${note ? `<span class="cb-dose-note">${note}</span>` : ''}</div>`
		)
		.join('');
	return `<div class="cb-dosing"><div class="cb-dosing-title">${title}</div>${html}</div>`;
}

// ── Calculator (inline link to pre-filled calculator) ──
// :::calculator
// peptide | bpc-157
// dose | 250
// unit | mcg
// volume | 2
// :::

function renderCalculator(body: string, meta?: string): string {
	const lines = parsePipeLines(body);
	const params: Record<string, string> = {};
	for (const [key, val] of lines) {
		if (key && val) params[key.toLowerCase()] = val;
	}

	const peptideId = params.peptide || params.compound || '';
	const dose = params.dose || '';
	const unit = params.unit || 'mcg';
	const volume = params.volume || '';

	let url = '/calculator';
	const qp: string[] = [];
	if (peptideId) qp.push(`peptide=${peptideId}`);
	if (dose) qp.push(`dose=${dose}`);
	if (unit) qp.push(`unit=${unit}`);
	if (volume) qp.push(`volume=${volume}`);
	if (qp.length) url += '?' + qp.join('&');

	const title = meta?.replace(/^title="?|"$/g, '') || 'Reconstitution Calculator';

	return `<div class="cb-calculator">
		<div class="cb-calc-header">${title}</div>
		<div class="cb-calc-params">
			${peptideId ? `<div class="cb-calc-param"><span class="cb-calc-key">Compound</span><span class="cb-calc-val">${peptideId}</span></div>` : ''}
			${dose ? `<div class="cb-calc-param"><span class="cb-calc-key">Dose</span><span class="cb-calc-val">${dose} ${unit}</span></div>` : ''}
			${volume ? `<div class="cb-calc-param"><span class="cb-calc-key">BAC Water</span><span class="cb-calc-val">${volume} mL</span></div>` : ''}
		</div>
		<a href="${url}" class="cb-calc-link">Open Calculator</a>
	</div>`;
}

// ── Chart (CSS bar chart) ──
// :::chart title="Testosterone Levels Over 12 Weeks"
// Week 2 | 800 | ng/dL
// Week 4 | 1200 | ng/dL
// Week 8 | 1500 | ng/dL
// Week 12 | 1400 | ng/dL
// :::

function renderChart(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || '';
	const lines = parsePipeLines(body);

	const data = lines.map(([label, value, unit]) => ({
		label: label || '',
		value: parseFloat(value) || 0,
		unit: unit || ''
	}));

	const maxVal = Math.max(...data.map((d) => d.value), 1);

	const barsHtml = data
		.map((d) => {
			const pct = Math.round((d.value / maxVal) * 100);
			return `<div class="cb-chart-row">
				<span class="cb-chart-label">${d.label}</span>
				<div class="cb-chart-bar-wrap">
					<div class="cb-chart-bar" style="width: ${pct}%"></div>
				</div>
				<span class="cb-chart-val">${d.value}${d.unit ? ' ' + d.unit : ''}</span>
			</div>`;
		})
		.join('');

	return `<div class="cb-chart">${title ? `<div class="cb-chart-title">${title}</div>` : ''}${barsHtml}</div>`;
}

// ── Poll (clickable decision helper) ──
// :::poll title="What's your primary goal?"
// Lean bulk | I want to gain muscle with minimal fat
// Cut | I want to lose fat and preserve muscle
// Recomp | I want to do both simultaneously
// TRT optimization | I'm on TRT and want to optimize
// :::

function renderPoll(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || 'Choose one:';
	const lines = parsePipeLines(body);

	const optionsHtml = lines
		.map(
			([option, desc]) =>
				`<button class="cb-poll-option" data-cb-action="poll" data-cb-value="${(option || '').replace(/"/g, '&quot;')}"">
					<span class="cb-poll-option-text">${option || ''}</span>
					${desc ? `<span class="cb-poll-option-desc">${desc}</span>` : ''}
				</button>`
		)
		.join('');

	return `<div class="cb-poll"><div class="cb-poll-title">${title}</div><div class="cb-poll-options">${optionsHtml}</div></div>`;
}

// ── Bloodwork (color-coded panel) ──
// :::bloodwork title="On-Cycle Bloodwork"
// Total Testosterone | 4326 ng/dL | 300-1000 | high
// Free Testosterone | 1592 pg/mL | 50-210 | high
// Estradiol | 71 pg/mL | 20-60 | high
// IGF-1 | 551 ng/mL | 100-300 | high
// Hematocrit | 48% | 38-52 | normal
// PSA | 0.8 ng/mL | 0-4 | normal
// :::

function renderBloodwork(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || 'Bloodwork Panel';
	const lines = parsePipeLines(body);

	const rowsHtml = lines
		.map(([marker, value, range, status]) => {
			const s = (status || 'normal').toLowerCase().trim();
			const statusClass =
				s === 'high' ? 'cb-bw-high' : s === 'low' ? 'cb-bw-low' : s === 'critical' ? 'cb-bw-crit' : 'cb-bw-ok';
			return `<div class="cb-bw-row ${statusClass}">
				<span class="cb-bw-marker">${marker || ''}</span>
				<span class="cb-bw-value">${value || ''}</span>
				<span class="cb-bw-range">${range || ''}</span>
				<span class="cb-bw-status">${s}</span>
			</div>`;
		})
		.join('');

	return `<div class="cb-bloodwork"><div class="cb-bw-header">${title}</div>${rowsHtml}</div>`;
}

// ── Cost breakdown ──
// :::cost title="12-Week Cycle Cost Estimate"
// Testosterone Cypionate | $40 | 2 vials
// HGH (generic) | $200 | 1 kit (100IU)
// HCG | $60 | 1 vial
// Anastrozole | $15 | 30 tabs
// Tadalafil | $20 | 90 tabs
// :::

function renderCost(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || 'Cost Estimate';
	const lines = parsePipeLines(body);

	let total = 0;
	const rowsHtml = lines
		.map(([item, price, note]) => {
			const numMatch = (price || '').match(/[\d.]+/);
			if (numMatch) total += parseFloat(numMatch[0]);
			return `<div class="cb-cost-row">
				<span class="cb-cost-item">${item || ''}</span>
				<span class="cb-cost-price">${price || ''}</span>
				${note ? `<span class="cb-cost-note">${note}</span>` : ''}
			</div>`;
		})
		.join('');

	const totalHtml = total > 0 ? `<div class="cb-cost-total"><span>Total</span><span>$${total.toFixed(0)}</span></div>` : '';

	return `<div class="cb-cost"><div class="cb-cost-header">${title}</div>${rowsHtml}${totalHtml}</div>`;
}

// ── Quiz ──
// :::quiz title="Quick Check"
// What should every cycle include as a base?
// A) HGH | wrong | HGH is great but optional
// B) Testosterone | correct | Every cycle needs a test base
// C) Anastrozole | wrong | AI is reactive, not a base
// D) BPC-157 | wrong | BPC is for healing, not a cycle base
// :::

function renderQuiz(body: string, meta?: string): string {
	const title = meta?.replace(/^title="?|"$/g, '') || 'Knowledge Check';
	const lines = body
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);

	if (lines.length < 2) return renderCallout(body, title);

	const question = lines[0];
	const options = lines.slice(1).map((line) => {
		const parts = line.split('|').map((p) => p.trim());
		return {
			text: parts[0] || '',
			status: (parts[1] || 'wrong').toLowerCase().trim(),
			explanation: parts[2] || ''
		};
	});

	const optionsHtml = options
		.map(
			(o) =>
				`<button class="cb-quiz-option" data-cb-action="quiz" data-cb-correct="${o.status === 'correct'}" data-cb-explain="${(o.explanation || '').replace(/"/g, '&quot;')}">
					<span class="cb-quiz-option-text">${o.text}</span>
				</button>`
		)
		.join('');

	return `<div class="cb-quiz"><div class="cb-quiz-title">${title}</div><div class="cb-quiz-question">${question}</div><div class="cb-quiz-options">${optionsHtml}</div></div>`;
}
