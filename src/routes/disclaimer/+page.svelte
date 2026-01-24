<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';
	import SEO from 'sk-seo';
</script>

<SEO
	title="Disclaimer | Peptide Database"
	description="Important disclaimer regarding the information provided on Peptide Database."
	siteName="Peptide Database"
	canonical="https://peptide-db.com/disclaimer"
	twitter={true}
	openGraph={true}
/>

<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8 flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15 text-warning">
			<AlertTriangle class="h-6 w-6" />
		</div>
		<h1 class="text-3xl font-bold md:text-4xl">Disclaimer</h1>
	</div>

	<!-- Content -->
	<div class="prose prose-lg dark:prose-invert max-w-none">
		<div class="status-warning mb-8 rounded-2xl border p-6">
			<p class="status-warning-text mb-0 text-lg font-semibold">
				This website is for educational and informational purposes only.
			</p>
		</div>

		<h2>Medical Disclaimer</h2>
		<p>
			The information provided on Peptide Database is intended for general informational and
			educational purposes only. It is not intended as, and should not be understood or construed
			as, medical advice, treatment, or diagnosis.
		</p>
		<p>
			<strong>Always consult with a qualified healthcare professional</strong> before starting any peptide
			therapy, supplement regimen, or making any health-related decisions. Never disregard professional
			medical advice or delay seeking it because of something you have read on this website.
		</p>

		<h2>No Doctor-Patient Relationship</h2>
		<p>
			Use of this website does not create a doctor-patient relationship. The content on Peptide
			Database is not a substitute for professional medical advice, diagnosis, or treatment.
		</p>

		<h2>Research Peptides</h2>
		<p>
			Many peptides discussed on this website are research chemicals that are not approved by the
			FDA for human use. Information about dosing, effects, and protocols is derived from published
			research studies, clinical trials, and user reports. This information is provided for
			educational purposes only.
		</p>

		<h2>No Endorsement</h2>
		<p>
			Peptide Database does not endorse, recommend, or advocate for the use of any particular
			peptide or protocol. We do not sell peptides or any related products.
		</p>

		<h2>Accuracy of Information</h2>
		<p>
			While we strive to provide accurate and up-to-date information, we make no warranties or
			representations as to the accuracy, completeness, or reliability of any information on this
			website. Research in this field is constantly evolving, and information may become outdated.
		</p>

		<h2>Assumption of Risk</h2>
		<p>
			Any use of peptides based on information found on this website is done at your own risk. You
			assume full responsibility for any consequences that may arise from using this information.
		</p>

		<h2>Legal Compliance</h2>
		<p>
			It is your responsibility to comply with all applicable laws and regulations in your
			jurisdiction regarding the purchase, possession, and use of peptides and related substances.
		</p>

		<h2>Contact</h2>
		<p>
			If you have questions about this disclaimer or the information provided on this website,
			please contact us.
		</p>
	</div>
</div>
