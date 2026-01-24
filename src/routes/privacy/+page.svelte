<script lang="ts">
	import { Shield } from 'lucide-svelte';
	import SEO from 'sk-seo';
</script>

<SEO
	title="Privacy Policy | Peptide Database"
	description="Privacy policy for Peptide Database - how we handle your data."
	siteName="Peptide Database"
	canonical="https://peptide-db.com/privacy"
	twitter={true}
	openGraph={true}
/>

<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
			<Shield class="h-6 w-6" />
		</div>
		<h1 class="text-3xl font-bold md:text-4xl">Privacy Policy</h1>
	</div>

	<!-- Content -->
	<div class="prose prose-lg dark:prose-invert max-w-none">
		<p class="text-muted-foreground">
			Last updated: {new Date().toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			})}
		</p>

		<h2>Introduction</h2>
		<p>
			Peptide Database ("we", "our", or "us") is committed to protecting your privacy. This Privacy
			Policy explains how we collect, use, and safeguard information when you visit our website.
		</p>

		<h2>Information We Collect</h2>
		<h3>Automatically Collected Information</h3>
		<p>When you visit our website, we may automatically collect certain information, including:</p>
		<ul>
			<li>Browser type and version</li>
			<li>Operating system</li>
			<li>Pages visited and time spent on pages</li>
			<li>Referring website</li>
			<li>Date and time of your visit</li>
		</ul>

		<h3>Local Storage</h3>
		<p>We use browser local storage to save your preferences, such as:</p>
		<ul>
			<li>Theme preference (light/dark mode)</li>
		</ul>
		<p>This information is stored locally on your device and is not transmitted to our servers.</p>

		<h2>How We Use Information</h2>
		<p>We use collected information to:</p>
		<ul>
			<li>Improve our website and content</li>
			<li>Understand how visitors use our website</li>
			<li>Remember your preferences</li>
		</ul>

		<h2>Cookies and Tracking</h2>
		<p>
			We may use cookies and similar tracking technologies to track activity on our website. You can
			instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
		</p>

		<h2>Third-Party Services</h2>
		<p>
			We may use third-party services that collect, monitor, and analyze information to improve our
			website. These third parties have their own privacy policies addressing how they use such
			information.
		</p>

		<h2>Data Security</h2>
		<p>
			We implement reasonable security measures to protect your information. However, no method of
			transmission over the Internet or electronic storage is 100% secure.
		</p>

		<h2>Children's Privacy</h2>
		<p>
			Our website is not intended for children under 18 years of age. We do not knowingly collect
			personal information from children under 18.
		</p>

		<h2>Changes to This Policy</h2>
		<p>
			We may update our Privacy Policy from time to time. We will notify you of any changes by
			posting the new Privacy Policy on this page and updating the "Last updated" date.
		</p>

		<h2>Contact Us</h2>
		<p>If you have any questions about this Privacy Policy, please contact us.</p>
	</div>
</div>
