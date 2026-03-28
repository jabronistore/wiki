<script lang="ts">
	interface Question {
		text: string;
		detail?: string;
	}

	interface Props {
		title: string;
		questions: Question[];
		passThreshold?: number;
		passMessage?: string;
		failMessage?: string;
	}

	let {
		title,
		questions,
		passThreshold,
		passMessage = 'You meet the criteria. You are ready to proceed.',
		failMessage = 'There are areas that need attention before you proceed.'
	}: Props = $props();

	const threshold = $derived(passThreshold ?? questions.length);

	// Track answers: undefined = unanswered, true = yes, false = no
	let answers: (boolean | undefined)[] = $state(questions.map(() => undefined));

	const answeredCount = $derived(answers.filter((a) => a !== undefined).length);
	const allAnswered = $derived(answeredCount === questions.length);
	const yesCount = $derived(answers.filter((a) => a === true).length);
	const passed = $derived(yesCount >= threshold);
	const progressPercent = $derived(
		questions.length > 0 ? (answeredCount / questions.length) * 100 : 0
	);

	const failedQuestions = $derived(
		questions
			.map((q, i) => ({ question: q, index: i }))
			.filter(({ index }) => answers[index] === false)
	);

	function setAnswer(index: number, value: boolean) {
		answers[index] = value;
	}

	function reset() {
		answers = questions.map(() => undefined);
	}
</script>

<div class="quiz">
	<div class="quiz-header">
		<h3 class="quiz-title">{title}</h3>
		<div class="quiz-progress-row">
			<span class="quiz-progress-label">{answeredCount} of {questions.length} answered</span>
			<div class="quiz-progress-bar">
				<div class="quiz-progress-fill" style="width: {progressPercent}%"></div>
			</div>
		</div>
	</div>

	<div class="quiz-questions">
		{#each questions as question, i}
			<div class="quiz-card" class:answered={answers[i] !== undefined}>
				<div class="quiz-card-content">
					<div class="quiz-card-text">
						<span class="quiz-card-number">{i + 1}.</span>
						<div>
							<p class="quiz-card-question">{question.text}</p>
							{#if question.detail}
								<p class="quiz-card-detail">{question.detail}</p>
							{/if}
						</div>
					</div>
					<div class="quiz-card-actions">
						<button
							type="button"
							class="quiz-toggle"
							class:active-yes={answers[i] === true}
							onclick={() => setAnswer(i, true)}
						>
							Yes
						</button>
						<button
							type="button"
							class="quiz-toggle"
							class:active-no={answers[i] === false}
							onclick={() => setAnswer(i, false)}
						>
							No
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if allAnswered}
		<div class="quiz-result" class:quiz-result-pass={passed} class:quiz-result-fail={!passed}>
			<div class="quiz-result-header">
				<span class="quiz-result-score">{yesCount} / {questions.length}</span>
				<span class="quiz-result-verdict">{passed ? 'Ready' : 'Not yet'}</span>
			</div>
			<p class="quiz-result-message">{passed ? passMessage : failMessage}</p>

			{#if !passed && failedQuestions.length > 0}
				<div class="quiz-areas">
					<p class="quiz-areas-label">Areas to address:</p>
					<ul class="quiz-areas-list">
						{#each failedQuestions as { question }}
							<li>{question.text}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<button type="button" class="quiz-reset" onclick={reset}>
				Start over
			</button>
		</div>
	{/if}
</div>

<style>
	.quiz {
		border: 1px solid hsl(var(--border));
		background: hsl(var(--card));
		padding: 1.5rem;
		margin: 2rem 0;
	}

	.quiz-header {
		margin-bottom: 1.5rem;
	}

	.quiz-title {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 1rem;
	}

	.quiz-progress-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.quiz-progress-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	.quiz-progress-bar {
		flex: 1;
		height: 4px;
		background: hsl(var(--muted));
		overflow: hidden;
	}

	.quiz-progress-fill {
		height: 100%;
		background: hsl(var(--accent));
		transition: width 0.3s ease;
	}

	.quiz-questions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.quiz-card {
		border: 1px solid hsl(var(--border));
		background: hsl(var(--background));
		padding: 1rem 1.25rem;
		transition: border-color 0.15s ease;
	}

	.quiz-card.answered {
		border-color: hsl(var(--accent) / 0.3);
	}

	.quiz-card-content {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.quiz-card-text {
		display: flex;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.quiz-card-number {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		flex-shrink: 0;
		line-height: 1.5;
	}

	.quiz-card-question {
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		line-height: 1.5;
		margin: 0;
	}

	.quiz-card-detail {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
		margin: 0.25rem 0 0;
	}

	.quiz-card-actions {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.quiz-toggle {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
		line-height: 1.5;
	}

	.quiz-toggle:hover {
		border-color: hsl(var(--foreground) / 0.3);
		color: hsl(var(--foreground));
	}

	.quiz-toggle.active-yes {
		background: hsl(var(--success) / 0.12);
		border-color: hsl(var(--success) / 0.4);
		color: hsl(var(--success));
	}

	.quiz-toggle.active-no {
		background: hsl(var(--destructive) / 0.1);
		border-color: hsl(var(--destructive) / 0.4);
		color: hsl(var(--destructive));
	}

	.quiz-result {
		margin-top: 1.5rem;
		padding: 1.25rem;
		border: 1px solid;
	}

	.quiz-result-pass {
		border-color: hsl(var(--success) / 0.4);
		background: hsl(var(--success) / 0.06);
	}

	.quiz-result-fail {
		border-color: hsl(var(--destructive) / 0.4);
		background: hsl(var(--destructive) / 0.06);
	}

	.quiz-result-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.quiz-result-score {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.quiz-result-pass .quiz-result-score {
		color: hsl(var(--success));
	}

	.quiz-result-fail .quiz-result-score {
		color: hsl(var(--destructive));
	}

	.quiz-result-verdict {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.quiz-result-pass .quiz-result-verdict {
		color: hsl(var(--success));
	}

	.quiz-result-fail .quiz-result-verdict {
		color: hsl(var(--destructive));
	}

	.quiz-result-message {
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		line-height: 1.6;
		margin: 0;
	}

	.quiz-areas {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--destructive) / 0.2);
	}

	.quiz-areas-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--muted-foreground));
		margin: 0 0 0.5rem;
	}

	.quiz-areas-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.quiz-areas-list li {
		font-size: 0.8125rem;
		color: hsl(var(--foreground));
		padding-left: 1rem;
		position: relative;
		line-height: 1.5;
	}

	.quiz-areas-list li::before {
		content: '--';
		position: absolute;
		left: 0;
		color: hsl(var(--destructive));
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}

	.quiz-reset {
		margin-top: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.375rem 1rem;
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.quiz-reset:hover {
		border-color: hsl(var(--foreground) / 0.3);
		color: hsl(var(--foreground));
	}

	@media (max-width: 640px) {
		.quiz {
			padding: 1rem;
		}

		.quiz-card-content {
			flex-direction: column;
			gap: 0.75rem;
		}

		.quiz-card-actions {
			align-self: flex-end;
		}
	}
</style>
