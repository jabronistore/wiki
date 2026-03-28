---
title: 'Component Test Guide'
description: 'A comprehensive test page that exercises every interactive component available for guides. Not intended for public consumption.'
date: '2026-03-27'
lastUpdated: '2026-03-27'
author: 'Peptide Database'
authorBio: 'Peptide Database provides research-based information on peptides, dosing protocols, and scientific references for educational purposes.'
authorImage: '/pep-logo.webp'
authorUrl: 'https://peptide-db.com'

category: 'reference'
difficulty: 'beginner'
readingTime: '8 min'

tags:
  - test
  - components
  - interactive

published: true
keywords: 'component test, interactive guide, test page'
canonical: 'https://peptide-db.com/guides/component-test'
showToc: true

relatedPeptides:
  - bpc-157
  - tb-500
  - ghk-cu

relatedGuides:
  - title: 'KLOW Peptide Protocol'
    slug: 'klow-peptide-protocol'
    image: '/guides/klow-peptide-protocol.webp'
    excerpt: 'A four-peptide blend combining GHK-Cu, KPV, BPC-157, and TB-500.'
---

<script>
  import { BarChart, ComparisonScale, SpectrumBar, Callout, MermaidDiagram } from '$lib/components/charts';
  import ReadinessQuiz from '$lib/components/guides/ReadinessQuiz.svelte';
  import DecisionTree from '$lib/components/guides/DecisionTree.svelte';
  import AggressionLadder from '$lib/components/guides/AggressionLadder.svelte';
  import BloodworkPanel from '$lib/components/guides/BloodworkPanel.svelte';
  import SymptomChecker from '$lib/components/guides/SymptomChecker.svelte';
  import HormonePathway from '$lib/components/guides/HormonePathway.svelte';
  import InjectionSiteMap from '$lib/components/guides/InjectionSiteMap.svelte';
  import CycleTimeline from '$lib/components/guides/CycleTimeline.svelte';
  import FamilyTree from '$lib/components/guides/FamilyTree.svelte';
  import PCTBuilder from '$lib/components/guides/PCTBuilder.svelte';
</script>

## Summary

This guide exists solely to test every interactive component available in the guide system. Each section below renders a single component with realistic data drawn from the peptide database. If you are seeing this on a production site, something has gone wrong.

---

## BarChart

Horizontal bar chart comparing the half-lives of common peptides. Data is approximate and sourced from the individual peptide pages.

<BarChart
  title="Peptide Half-Lives (minutes)"
  data={[
    { label: 'BPC-157', value: 240, suffix: ' min' },
    { label: 'TB-500', value: 120, suffix: ' min' },
    { label: 'GHK-Cu', value: 60, suffix: ' min' },
    { label: 'Ipamorelin', value: 120, suffix: ' min' },
    { label: 'CJC-1295 (no DAC)', value: 30, suffix: ' min' },
    { label: 'DSIP', value: 15, suffix: ' min' },
    { label: 'Epitalon', value: 10, suffix: ' min' }
  ]}
/>

---

## ComparisonScale

A 1--10 comparison scale rating research depth for several peptides. Higher numbers mean more published human trial data.

<ComparisonScale
  title="Research Depth by Peptide"
  leftLabel="Minimal"
  rightLabel="Extensive"
  items={[
    { label: 'BPC-157', position: 7, color: '#CC785C' },
    { label: 'TB-500', position: 5, color: '#D4A27F' },
    { label: 'GHK-Cu', position: 6, color: '#61AAF2' },
    { label: 'Epitalon', position: 3, color: '#91918D' },
    { label: 'Dihexa', position: 2, color: '#BF4D43' }
  ]}
/>

---

## SpectrumBar

A segmented spectrum showing where different GH secretagogues fall on the selectivity spectrum, from highly selective to broad-acting.

<SpectrumBar
  title="GH Secretagogue Selectivity Spectrum"
  leftLabel="Selective"
  rightLabel="Broad"
  segments={[
    { label: 'Ipamorelin', sublabel: 'GH only', width: 25, color: '#61AAF2' },
    { label: 'GHRP-2', sublabel: 'GH + mild cortisol', width: 25, color: '#CC785C' },
    { label: 'GHRP-6', sublabel: 'GH + hunger + cortisol', width: 25, color: '#D4A27F' },
    { label: 'MK-677', sublabel: 'GH + IGF-1 + cortisol + prolactin', width: 25, color: '#BF4D43' }
  ]}
  markers={[
    { label: 'Typical choice', position: 15 }
  ]}
/>

---

## Callout (all four types)

Four callout variants demonstrating each available type.

<Callout type="info" title="Information Callout">

BPC-157 is a 15-amino-acid peptide fragment derived from human gastric juice protein. It has been studied extensively in animal models for wound healing, tendon repair, and gastrointestinal protection.

</Callout>

<Callout type="warning" title="Safety Warning">

Never reconstitute lyophilized peptides with anything other than bacteriostatic water. Using saline or sterile water shortens shelf life and may introduce contamination if stored beyond 24 hours.

</Callout>

<Callout type="research" title="Ongoing Research">

A Phase II clinical trial (NCT05765123) is currently investigating the oral stability of BPC-157 for inflammatory bowel conditions. Results are expected in late 2026.

</Callout>

<Callout type="tldr" title="TL;DR">

GHK-Cu is best for skin and hair. BPC-157 is best for soft tissue repair. TB-500 is best for systemic inflammation and flexibility. Together they form the core of most healing stacks.

</Callout>

---

## MermaidDiagram

A flowchart showing a simplified peptide reconstitution decision process.

<MermaidDiagram
  title="Peptide Reconstitution Decision Flow"
  chart={`flowchart TD
    A[Receive lyophilized peptide] --> B{What solvent?}
    B -->|Bacteriostatic Water| C[Draw BAC water into syringe]
    B -->|Sterile Water| D[Use within 24 hours]
    C --> E[Inject slowly against vial wall]
    D --> E
    E --> F[Swirl gently - never shake]
    F --> G[Store at 2-8C]
    G --> H{How long will you store?}
    H -->|Under 30 days| I[Refrigerator is fine]
    H -->|Over 30 days| J[Consider freezing aliquots]`}
/>

---

## ReadinessQuiz

An interactive checklist to determine whether someone has done the prerequisite research before starting a peptide protocol.

<ReadinessQuiz
  title="Peptide Protocol Readiness Check"
  questions={[
    { text: 'I have baseline bloodwork from the last 6 months', detail: 'At minimum: CBC, CMP, lipids, fasting glucose, and hormone panel.' },
    { text: 'I have sourced bacteriostatic water and appropriate syringes', detail: 'Insulin syringes (29-31g) for subcutaneous injection, or larger gauge for intramuscular.' },
    { text: 'I understand the difference between subcutaneous and intramuscular injection', detail: 'SubQ goes into fatty tissue (belly, love handles). IM goes into muscle (delts, glutes, quads).' },
    { text: 'I have a plan for reconstitution and storage', detail: 'Reconstituted peptides must be refrigerated and used within 4-6 weeks typically.' },
    { text: 'I have researched potential side effects for my chosen peptide', detail: 'Every peptide has a different side effect profile. Read the specific peptide page before starting.' },
    { text: 'I am not currently pregnant, breastfeeding, or under 25 years old', detail: 'Peptides affecting growth hormone or systemic repair are contraindicated in these populations.' }
  ]}
  passThreshold={5}
  passMessage="You appear to have done the groundwork. Review your specific peptide page one more time before starting."
  failMessage="There are gaps in your preparation. Address the items above before beginning any protocol."
/>

---

## DecisionTree

An interactive decision tree to help choose between popular healing peptides.

<DecisionTree
  title="Which Healing Peptide Is Right for You?"
  nodes={[
    {
      id: 'start',
      question: 'What is your primary goal?',
      detail: 'Different peptides excel at different types of repair.',
      options: [
        { label: 'Tendon or ligament injury', next: 'tendon' },
        { label: 'Gut healing', next: 'gut' },
        { label: 'General systemic recovery', next: 'systemic' },
        { label: 'Skin and hair', next: 'skin' }
      ]
    },
    {
      id: 'tendon',
      question: 'How severe is the injury?',
      options: [
        { label: 'Mild strain or tendinitis', next: 'result-bpc' },
        { label: 'Partial tear or chronic issue', next: 'result-bpc-tb' },
        { label: 'Post-surgical recovery', next: 'result-stack' }
      ]
    },
    {
      id: 'gut',
      question: 'What type of gut issue?',
      options: [
        { label: 'Leaky gut or IBS symptoms', next: 'result-bpc-oral' },
        { label: 'Gastric ulcer or NSAID damage', next: 'result-bpc' },
        { label: 'Inflammatory bowel disease', next: 'result-bpc-kpv' }
      ]
    },
    {
      id: 'systemic',
      question: 'What kind of systemic recovery?',
      options: [
        { label: 'Post-training inflammation', next: 'result-tb' },
        { label: 'Autoimmune flare management', next: 'result-bpc-kpv' },
        { label: 'Multi-tissue healing stack', next: 'result-stack' }
      ]
    },
    {
      id: 'skin',
      question: 'Primary concern?',
      options: [
        { label: 'Wrinkles and skin elasticity', next: 'result-ghk' },
        { label: 'Hair thinning', next: 'result-ghk' },
        { label: 'Wound healing or scars', next: 'result-ghk-bpc' }
      ]
    }
  ]}
  results={{
    'result-bpc': {
      title: 'BPC-157',
      description: 'BPC-157 is the first-line peptide for localised tissue repair. It promotes angiogenesis, modulates nitric oxide, and accelerates tendon and ligament healing in animal studies.',
      compounds: [
        { name: 'BPC-157', url: '/peptides/bpc-157' }
      ]
    },
    'result-tb': {
      title: 'TB-500',
      description: 'TB-500 (Thymosin Beta-4 fragment) excels at systemic inflammation reduction and promotes cell migration for repair across multiple tissue types.',
      compounds: [
        { name: 'TB-500', url: '/peptides/tb-500' }
      ]
    },
    'result-bpc-tb': {
      title: 'BPC-157 + TB-500 Stack',
      description: 'The classic healing stack. BPC-157 handles localised repair while TB-500 provides systemic anti-inflammatory support. They work through different mechanisms and complement each other well.',
      compounds: [
        { name: 'BPC-157', url: '/peptides/bpc-157' },
        { name: 'TB-500', url: '/peptides/tb-500' }
      ]
    },
    'result-stack': {
      title: 'Full Healing Stack',
      description: 'For serious recovery, a three-peptide approach covers local repair (BPC-157), systemic recovery (TB-500), and tissue remodelling (GHK-Cu).',
      compounds: [
        { name: 'BPC-157', url: '/peptides/bpc-157' },
        { name: 'TB-500', url: '/peptides/tb-500' },
        { name: 'GHK-Cu', url: '/peptides/ghk-cu' }
      ]
    },
    'result-bpc-oral': {
      title: 'BPC-157 (Oral)',
      description: 'BPC-157 shows gastric stability and can be taken orally for gut-specific issues. Oral dosing directly exposes the GI tract to the peptide rather than relying on systemic distribution.',
      compounds: [
        { name: 'BPC-157', url: '/peptides/bpc-157' }
      ]
    },
    'result-bpc-kpv': {
      title: 'BPC-157 + KPV',
      description: 'KPV is a potent anti-inflammatory tripeptide that pairs well with BPC-157 for inflammatory conditions. KPV modulates NF-kB while BPC-157 promotes tissue repair.',
      compounds: [
        { name: 'BPC-157', url: '/peptides/bpc-157' },
        { name: 'KPV', url: '/peptides/kpv' }
      ]
    },
    'result-ghk': {
      title: 'GHK-Cu',
      description: 'GHK-Cu is the go-to peptide for skin rejuvenation and hair health. It stimulates collagen synthesis, activates wound repair genes, and has over 50 years of published research.',
      compounds: [
        { name: 'GHK-Cu', url: '/peptides/ghk-cu' }
      ]
    },
    'result-ghk-bpc': {
      title: 'GHK-Cu + BPC-157',
      description: 'For wound healing and scar reduction, GHK-Cu handles collagen remodelling and gene expression while BPC-157 drives angiogenesis and tissue repair.',
      compounds: [
        { name: 'GHK-Cu', url: '/peptides/ghk-cu' },
        { name: 'BPC-157', url: '/peptides/bpc-157' }
      ]
    }
  }}
/>

---

## AggressionLadder

A tiered escalation ladder for GH secretagogue protocols, from conservative to aggressive.

<AggressionLadder
  title="GH Secretagogue Escalation Tiers"
  tiers={[
    {
      level: 1,
      name: 'Entry Level',
      description: 'Start here. Single peptide, lowest effective dose, 8-12 week run.',
      compounds: [
        { name: 'Ipamorelin', url: '/peptides/ipamorelin', dose: '100-200mcg before bed' },
        { name: 'CJC-1295 (no DAC)', url: '/peptides/cjc-1295', dose: '100mcg before bed' }
      ],
      risk: 'low'
    },
    {
      level: 2,
      name: 'Standard Stack',
      description: 'The classic GHRH + GHRP combination. Two peptides working synergistically for a larger GH pulse.',
      compounds: [
        { name: 'CJC-1295 + Ipamorelin', url: '/peptides/cjc-ipa-protocol', dose: '100mcg each, 2-3x daily' },
        { name: 'Sermorelin', url: '/peptides/sermorelin', dose: '200-300mcg before bed' }
      ],
      risk: 'low'
    },
    {
      level: 3,
      name: 'Aggressive Secretagogue',
      description: 'Higher doses or adding oral MK-677 for continuous GH elevation. Side effects become more likely here.',
      compounds: [
        { name: 'MK-677', url: '/peptides/mk-677', dose: '12.5-25mg oral daily' },
        { name: 'GHRP-2', url: '/peptides/ghrp-2', dose: '100-300mcg 2-3x daily' }
      ],
      risk: 'moderate'
    },
    {
      level: 4,
      name: 'Exogenous GH',
      description: 'Pharmaceutical growth hormone. Bypasses the feedback loop entirely. Requires careful bloodwork monitoring of IGF-1, glucose, and insulin.',
      compounds: [
        { name: 'HGH', dose: '2-4 IU daily' }
      ],
      risk: 'high'
    }
  ]}
/>

---

## BloodworkPanel

Interactive panel builder showing which blood markers to request before starting a peptide protocol versus while running one.

<BloodworkPanel
  title="Bloodwork Panel Builder"
  panels={[
    {
      id: 'baseline',
      name: 'Natural Baseline',
      description: 'Get these markers before starting any peptide or hormone protocol. This is your reference point.',
      markers: [
        { name: 'Total Testosterone', category: 'Hormones', range: '300-1000 ng/dL', why: 'Establishes your natural production level.' },
        { name: 'Free Testosterone', category: 'Hormones', range: '9-30 ng/dL', why: 'The bioavailable fraction that actually acts on tissues.' },
        { name: 'Estradiol (sensitive)', category: 'Hormones', range: '20-35 pg/mL', why: 'Baseline E2 helps you spot aromatisation issues later.' },
        { name: 'IGF-1', category: 'Growth Markers', range: '100-300 ng/mL', why: 'Reflects integrated GH output over weeks. Essential before any GH peptide.' },
        { name: 'Fasting Glucose', category: 'Metabolic', range: '70-100 mg/dL', why: 'GH secretagogues can impair insulin sensitivity.' },
        { name: 'Fasting Insulin', category: 'Metabolic', range: '2-10 uIU/mL', why: 'Together with glucose, reveals insulin resistance.' },
        { name: 'CBC', category: 'General Health', range: 'Lab reference', why: 'Checks for anaemia, infection, or blood cell abnormalities.' },
        { name: 'CMP', category: 'General Health', range: 'Lab reference', why: 'Liver enzymes, kidney function, electrolytes in one panel.' },
        { name: 'Lipid Panel', category: 'Cardiovascular', range: 'Lab reference', why: 'Total cholesterol, LDL, HDL, triglycerides.' },
        { name: 'TSH', category: 'Thyroid', range: '0.5-2.5 mIU/L', why: 'Thyroid dysfunction can mimic low GH symptoms.' }
      ]
    },
    {
      id: 'on-cycle',
      name: 'On-Cycle Monitoring',
      description: 'Run these markers 6-8 weeks into a GH secretagogue protocol to assess response and catch issues early.',
      markers: [
        { name: 'IGF-1', category: 'Growth Markers', range: '150-400 ng/mL', why: 'Should be elevated from baseline. If not, the peptide may not be working.' },
        { name: 'Fasting Glucose', category: 'Metabolic', range: '70-100 mg/dL', why: 'GH raises blood sugar. Watch for creeping values.' },
        { name: 'Fasting Insulin', category: 'Metabolic', range: '2-10 uIU/mL', why: 'Elevated insulin with normal glucose signals developing resistance.' },
        { name: 'HbA1c', category: 'Metabolic', range: 'Under 5.7%', why: 'Three-month average glucose. Catches sustained elevation that fasting glucose misses.' },
        { name: 'Prolactin', category: 'Hormones', range: '2-18 ng/mL', why: 'GHRP-6 and MK-677 can raise prolactin. Monitor if using these.' },
        { name: 'Cortisol (AM)', category: 'Hormones', range: '6-18 mcg/dL', why: 'Some GHRPs raise cortisol. Check if you feel wired or anxious.' },
        { name: 'CMP', category: 'General Health', range: 'Lab reference', why: 'Recheck liver and kidney markers to ensure nothing is being stressed.' }
      ]
    }
  ]}
/>

---

## SymptomChecker

Interactive symptom checker for distinguishing between high estradiol and low estradiol side effects -- a common source of confusion when running aromatising compounds.

<SymptomChecker
  title="High E2 vs Low E2 Symptom Checker"
  categories={[
    {
      id: 'high-e2',
      name: 'High Estradiol',
      symptoms: [
        'Water retention or bloating',
        'Sensitive or puffy nipples',
        'Mood swings or emotional instability',
        'Elevated blood pressure',
        'Decreased libido',
        'Erectile dysfunction',
        'Oily skin or acne flare',
        'Fatigue despite adequate sleep'
      ]
    },
    {
      id: 'low-e2',
      name: 'Low Estradiol',
      symptoms: [
        'Joint pain or cracking joints',
        'Dry skin or dry lips',
        'Decreased libido',
        'Erectile dysfunction',
        'Flat mood or depression',
        'Fatigue despite adequate sleep',
        'Frequent urination',
        'Night sweats or hot flashes'
      ]
    }
  ]}
  recommendations={{
    'high-e2': 'Your symptoms lean toward elevated estradiol. Consider getting a sensitive E2 blood test to confirm before making any changes to an AI protocol.',
    'low-e2': 'Your symptoms lean toward crashed estradiol. If you are using an aromatase inhibitor, consider reducing or dropping it. Get bloodwork to confirm.',
    'both': 'Your symptoms overlap both categories. This is common -- several symptoms (low libido, ED, fatigue) appear in both high and low E2. Bloodwork is the only reliable way to differentiate.',
    'none': 'No symptoms selected. Check any symptoms you are currently experiencing to get a preliminary assessment.'
  }}
/>

---

## HormonePathway

An interactive pathway diagram showing how testosterone is converted to its metabolites and where common interventions act.

<HormonePathway
  title="Testosterone Conversion Pathway"
  nodes={[
    { id: 'cholesterol', label: 'Cholesterol', type: 'hormone', detail: 'The precursor to all steroid hormones.' },
    { id: 'pregnenolone', label: 'Pregnenolone', type: 'hormone', detail: 'The master steroid hormone precursor, converted from cholesterol.' },
    { id: 'dhea', label: 'DHEA', type: 'hormone', detail: 'Dehydroepiandrosterone. An adrenal androgen precursor.' },
    { id: 'androstenedione', label: 'Androstenedione', type: 'hormone', detail: 'A weak androgen and direct precursor to both testosterone and estrone.' },
    { id: 'testosterone', label: 'Testosterone', type: 'hormone', detail: 'The primary male sex hormone. Target range: 300-1000 ng/dL.', url: '/peptides/gonadorelin' },
    { id: 'dht', label: 'DHT', type: 'hormone', detail: 'Dihydrotestosterone. 3-5x more androgenic than testosterone. Responsible for hair loss and prostate growth.' },
    { id: 'estradiol', label: 'Estradiol (E2)', type: 'hormone', detail: 'The most potent estrogen. Essential for bone density, lipids, and brain function even in males.' },
    { id: '5ar', label: '5-alpha Reductase', type: 'enzyme', detail: 'Converts testosterone to DHT. Inhibited by finasteride and dutasteride.' },
    { id: 'aromatase', label: 'Aromatase', type: 'enzyme', detail: 'Converts testosterone to estradiol. Inhibited by anastrozole and letrozole.' },
    { id: 'finasteride', label: 'Finasteride', type: 'blocker', detail: 'Blocks 5-alpha reductase type II, reducing DHT by roughly 70%.' },
    { id: 'anastrozole', label: 'Anastrozole', type: 'blocker', detail: 'Non-steroidal aromatase inhibitor. Reduces estradiol conversion.' }
  ]}
  connections={[
    { from: 'cholesterol', to: 'pregnenolone' },
    { from: 'pregnenolone', to: 'dhea' },
    { from: 'dhea', to: 'androstenedione' },
    { from: 'androstenedione', to: 'testosterone' },
    { from: 'testosterone', to: 'dht', enzyme: '5ar', blocker: 'finasteride' },
    { from: 'testosterone', to: 'estradiol', enzyme: 'aromatase', blocker: 'anastrozole' }
  ]}
/>

---

## InjectionSiteMap

An interactive body map showing common subcutaneous and intramuscular injection sites with technique details.

<InjectionSiteMap
  title="Peptide Injection Site Map"
  sites={[
    {
      id: 'abdomen',
      name: 'Abdomen (SubQ)',
      x: 50,
      y: 45,
      technique: 'Pinch a fold of skin 2 inches from the navel. Insert needle at 45-90 degrees depending on needle length.',
      needle: '29-31g, 0.5 inch insulin syringe',
      maxVolume: '1 mL',
      difficulty: 'easy',
      notes: 'The most common site for peptide injection. Rotate between left and right sides to avoid lipodystrophy.'
    },
    {
      id: 'love-handle',
      name: 'Love Handles (SubQ)',
      x: 75,
      y: 42,
      technique: 'Pinch the fat pad on the side of the abdomen above the hip. Insert at 45 degrees.',
      needle: '29-31g, 0.5 inch insulin syringe',
      maxVolume: '1 mL',
      difficulty: 'easy',
      notes: 'Good alternative when abdominal sites need a break. Slightly more tissue to work with in most people.'
    },
    {
      id: 'thigh',
      name: 'Outer Thigh (SubQ/IM)',
      x: 35,
      y: 70,
      technique: 'For SubQ: pinch outer quad fat and inject at 45 degrees. For IM: inject into the vastus lateralis at 90 degrees.',
      needle: 'SubQ: 29-31g 0.5 inch. IM: 25g 1 inch.',
      maxVolume: 'SubQ: 1 mL. IM: 3 mL.',
      difficulty: 'moderate',
      notes: 'Versatile site that works for both subcutaneous peptides and intramuscular injections.'
    },
    {
      id: 'delt',
      name: 'Deltoid (IM)',
      x: 22,
      y: 22,
      technique: 'Locate the thickest part of the deltoid, roughly 2 finger widths below the acromion. Insert at 90 degrees.',
      needle: '25-27g, 1 inch',
      maxVolume: '2 mL',
      difficulty: 'moderate',
      notes: 'Popular for intramuscular injections of reconstituted peptides requiring IM delivery. Easy to self-inject.'
    },
    {
      id: 'glute',
      name: 'Ventrogluteal (IM)',
      x: 72,
      y: 52,
      technique: 'Place heel of hand on greater trochanter, point index finger to anterior iliac crest. Inject into the triangle formed.',
      needle: '23-25g, 1-1.5 inch',
      maxVolume: '3 mL',
      difficulty: 'advanced',
      notes: 'Safest IM site with no major nerves or blood vessels. Harder to self-inject due to reach.'
    }
  ]}
/>

---

## CycleTimeline

A visual timeline for a 16-week peptide healing protocol combining multiple compounds with staggered start and end dates.

<CycleTimeline
  title="16-Week Healing Protocol Timeline"
  weeks={16}
  compounds={[
    { name: 'BPC-157', url: '/peptides/bpc-157', startWeek: 1, endWeek: 12, dose: '250mcg 2x/day SubQ' },
    { name: 'TB-500', url: '/peptides/tb-500', startWeek: 1, endWeek: 8, dose: '2.5mg 2x/week SubQ' },
    { name: 'GHK-Cu', url: '/peptides/ghk-cu', startWeek: 4, endWeek: 16, dose: '200mcg/day SubQ' },
    { name: 'Ipamorelin', url: '/peptides/ipamorelin', startWeek: 1, endWeek: 16, dose: '200mcg before bed SubQ' },
    { name: 'CJC-1295', url: '/peptides/cjc-1295', startWeek: 1, endWeek: 16, dose: '100mcg before bed SubQ' }
  ]}
/>

---

## FamilyTree

A grouped view of peptide families showing how related compounds are categorised.

<FamilyTree
  title="Peptide Family Classification"
  families={[
    {
      name: 'GH Secretagogues (GHRH)',
      description: 'Growth hormone releasing hormone analogues that stimulate pituitary GH secretion.',
      compounds: [
        { name: 'CJC-1295 (no DAC)', url: '/peptides/cjc-1295', note: 'Modified GRF 1-29. Short half-life.' },
        { name: 'CJC-1295 DAC', url: '/peptides/cjc-1295-dac', note: 'Drug affinity complex extends half-life to days.' },
        { name: 'Sermorelin', url: '/peptides/sermorelin', note: 'First-generation GHRH analogue. FDA-approved history.' }
      ]
    },
    {
      name: 'GH Secretagogues (GHRP)',
      description: 'Growth hormone releasing peptides that act on the ghrelin receptor.',
      compounds: [
        { name: 'Ipamorelin', url: '/peptides/ipamorelin', note: 'Most selective GHRP. Minimal cortisol and prolactin.' },
        { name: 'GHRP-2', url: '/peptides/ghrp-2', note: 'Stronger GH release but raises cortisol and prolactin.' },
        { name: 'GHRP-6', url: '/peptides/ghrp-6', note: 'Potent hunger signal. Significant cortisol increase.' },
        { name: 'MK-677', url: '/peptides/mk-677', note: 'Oral ghrelin mimetic. Not technically a peptide.' }
      ]
    },
    {
      name: 'Healing Peptides',
      description: 'Peptides primarily used for tissue repair, recovery, and inflammation reduction.',
      compounds: [
        { name: 'BPC-157', url: '/peptides/bpc-157', note: 'Body Protection Compound. Gastric juice derived.' },
        { name: 'TB-500', url: '/peptides/tb-500', note: 'Thymosin Beta-4 fragment. Systemic repair.' },
        { name: 'GHK-Cu', url: '/peptides/ghk-cu', note: 'Copper peptide. Collagen synthesis and remodelling.' },
        { name: 'KPV', url: '/peptides/kpv', note: 'Alpha-MSH fragment. Anti-inflammatory tripeptide.' }
      ]
    },
    {
      name: 'Longevity Peptides',
      description: 'Peptides studied for anti-aging, telomere, and mitochondrial function.',
      compounds: [
        { name: 'Epitalon', url: '/peptides/epitalon', note: 'Telomerase activator. Pineal peptide.' },
        { name: 'SS-31', url: '/peptides/ss-31', note: 'Mitochondria-targeted. Phase III trials.' },
        { name: 'MOTS-c', url: '/peptides/mots-c', note: 'Mitochondrial-derived. Exercise mimetic.' },
        { name: 'DSIP', url: '/peptides/dsip', note: 'Delta sleep-inducing peptide. Sleep architecture.' }
      ]
    }
  ]}
/>

---

## PCTBuilder

The PCT Protocol Builder is self-contained and requires no props. It walks users through building a post-cycle therapy plan.

<PCTBuilder title="PCT Protocol Builder" />

---

## Wrap-Up

If all components above render without errors, the guide component system is working correctly. Each component has been tested with realistic data drawn from the peptide database.
