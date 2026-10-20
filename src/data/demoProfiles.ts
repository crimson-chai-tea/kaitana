/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, FileDoc, PortfolioProject, Recommendation, AuditLog, MediaImage, MediaSelection, JournalData } from '../types';

export interface FullProfile {
  user: UserProfile;
  files: FileDoc[];
  projects: PortfolioProject[];
  recommendations: Recommendation[];
  logs: AuditLog[];
  images: MediaImage[];
  selections: MediaSelection[];
  journal?: JournalData;
}

export const demoProfiles: Record<string, FullProfile> = {
  vance: {
    user: {
      id: 'vance',
      name: 'Sarah Vance',
      title: 'Lead Cloud Infrastructure Architect',
      bio: 'Ex-AWS Principal Architect and former Netflix Infrastructure Lead. Specializing in highly resilient, multi-region web architectures, serverless architectures, and Kubernetes orchestration. Grounded, verified, and ready to deploy globally.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
      email: 'sarah.vance@infracore.io',
      location: 'Seattle, WA, USA',
      skills: ['AWS (Pro Certified)', 'Terraform', 'Kubernetes', 'Go', 'gRPC', 'Multi-region Database Replication', 'Chaos Engineering'],
      certifications: ['AWS Certified Solutions Architect - Professional', 'Certified Kubernetes Administrator (CKA)', 'HashiCorp Certified - Terraform Associate'],
      linkedin: 'https://linkedin.com/in/sarah-vance-cloud-architect-demo',
      github: 'https://github.com/sarahvance-demo',
      website: 'https://vance.io'
    },
    files: [
      {
        id: 'sv-1',
        title: 'Sarah_Vance_Resume_2026.pdf',
        category: 'CV',
        type: 'PDF',
        size: '142 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2026-03-12',
        textContent: `SARAH VANCE
Seattle, WA | sarah.vance@infracore.io | vance.io

SUMMARY:
Highly accomplished Solutions Architect with over 11 years of experience designing and managing enterprise cloud infrastructure. Proven expertise in migrating legacy systems to high-availability serverless and Kubernetes deployments. Ex-AWS and Netflix. AWS Solutions Architect Professional.

WORK EXPERIENCE:
1. INFRACORE CONSULTING | Principal Cloud Consultant (Aug 2024 - Present)
- Consulted for 12 Fortune-500 scale startups, automating high-throughput multi-region server configuration using Terraform and Pulumi.
- Redesigned payment service pipeline for global FinTech client, implementing zero-downtime transition to active-active database clusters across 3 AWS regions.

2. NETFLIX | Senior Infrastructure Engineer (Jan 2021 - Jul 2024)
- Co-architected core container routing orchestrations supporting up to 10M concurrent video streams.
- Achieved a 22% reduction in overall data transfer latency by fine-tuning service-mesh ingress topologies and configuring edge gateway caches.
- Implemented monthly "chaos monkeys" failures to stress-test microservice fallbacks under peak simulated regional disruptions.

3. AMAZON WEB SERVICES (AWS) | Senior Solutions Architect (Jun 2017 - Dec 2020)
- Advised global account owners on adopting serverless services (API Gateway, AWS Lambda, DynamoDB).
- Created official reference templates for automated security audits, running on over 100 enterprise accounts.
- Promoted 2 times; awarded "AWS Global Delivery Excellence" in 2019.

EDUCATION:
- M.S. in Computer Science | Stanford University (2015 - 2017)
- B.S. in Software Engineering | University of Washington (2011 - 2015)`
      },
      {
        id: 'sv-2',
        title: 'AWS_Solutions_Architect_Professional_Certificate.pdf',
        category: 'Certification',
        type: 'PDF',
        size: '1.2 MB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2025-11-05',
        textContent: `AMAZON WEB SERVICES — VERIFICATION CREDENTIAL
Credential ID: AWS-994112-COMPLETED
Recipient: Sarah Vance
Certification Program: AWS Certified Solutions Architect - Professional
Issued on: November 5, 2025
Expires on: November 5, 2028
Status: ACTIVE & VERIFIED VIA KAITANA CRYPTO-NOTARY
Authorized Signature: AWS Certification Board Representative. Verified competencies in cloud orchestration, billing optimization, IAM security governance, and multi-region disaster recovery setups.`
      },
      {
        id: 'sv-3',
        title: 'MultiRegion_ActiveActive_Database_Spec.docx',
        category: 'Portfolio',
        type: 'DOCX',
        size: '480 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: false,
        isRecruiterVisible: true,
        uploadDate: '2026-01-20',
        textContent: `TECHNICAL DESIGN DOC: GLOBAL ACTIVE-ACTIVE REPLICATION SPECIFICATION
Author: Sarah Vance, Principal Consultant
Date: January 20, 2026

1. ARCHITECTURAL OBJECTIVE:
Define the database and gateway architecture for high-transaction global retail services, ensuring transactional guarantees (RTO < 5 seconds, RPO = 0) with distributed multi-master topology.

2. COMPONENTS:
- Primary DB clusters: Amazon Aurora Global Database (multi-write clusters configured in us-east-1, eu-west-1, and ap-southeast-1).
- Resolution Gateway: Core routing handled via Route 53 latency-based routing combined with AWS Global Accelerator, reducing local client lookup lag by average 45ms.
- Session Management: Distributed Redis locks cached in regional ElastiCache clusters, utilizing eventual consistency models for non-blocking non-critical metadata.

3. PERFORMANCE STATISTICS:
Under simulated regional knockout of us-east-1 during Peak Sales chaos run:
- Service traffic successfully re-routed to eu-west-1 within 3.2 seconds.
- Transactional reconciliation logs reported zero corrupted carts and perfect ledger synchronization.`
      },
      {
        id: 'sv-4',
        title: 'Scuba_Diving_Leadership_Log.txt',
        category: 'Experience',
        type: 'TXT',
        size: '8 KB',
        url: '#',
        isPublic: false,
        isAIAccessible: true,
        isDownloadable: false,
        isRecruiterVisible: false,
        uploadDate: '2025-08-11',
        textContent: `PERSONAL LOG: SARAH VANCE DIVER & VOLUNTEER
Apart from enterprise software engineering, I am a certified PADI Divemaster with over 350 logged ocean dives. I regularly volunteer for marine cleanups off the coast of Washington state.
In deep waters, navigation and absolute stability are key. This is incredibly similar to managing high-stakes cloud infrastructures:
1. Always maintain backup oxygen and backup systems (Redundancy is life).
2. Remain incredibly calm when emergency sirens flash (Respond with checklists, never instinct).
3. Coordinate team routes carefully to avoid losing sight of the baseline goals.`
      }
    ],
    projects: [
      {
        id: 'svp-1',
        title: 'Global Payments Resiliency Architecture',
        description: 'Led the migrations to multi-region active-active clusters for a Fortune 500 fintech client, ensuring near-instantaneous global failover and zero transaction losses.',
        tags: ['AWS Aurora', 'Route 53', 'FinTech', 'Terraform'],
        verified: true
      },
      {
        id: 'svp-2',
        title: 'Netflix Service-Mesh Optimization',
        description: 'Optimized internal routing of microservices, cutting cluster egress transit bills by 22% and reducing response latencies inside the container gateway.',
        tags: ['Gloo Ingress', 'Envoy', 'Kubernetes'],
        verified: true
      }
    ],
    recommendations: [
      {
        id: 'svr-1',
        title: 'Upload Chaos-Test Scripts',
        description: 'Your CV highlightsChaos Engineering at Netflix but your knowledge database does not contain supporting configuration codes or chaos simulation logs.',
        category: 'Missing Section',
        impact: 'Medium',
        resolved: false
      },
      {
        id: 'svr-2',
        title: 'Add Thumbnail Visuals to Payment Project',
        description: 'Complex architecture projects benefit heavily from structured system diagrams. Recruiters are 3x more likely to engage with visual portfolio elements.',
        category: 'Visuals',
        impact: 'High',
        resolved: false
      }
    ],
    logs: [
      {
        id: 'svl-1',
        action: 'Database Initialization',
        timestamp: '2026-05-21T10:00:00Z',
        details: 'Knowledge container seeded with verified credentials, resume, and experience documents.',
        status: 'success'
      },
      {
        id: 'svl-2',
        action: 'AWS CSA Pro Certification Verified',
        timestamp: '2026-05-21T10:05:00Z',
        details: 'AWS Board digital ledger checked. Active CSA Pro certificate match complete with zero discrepancies.',
        status: 'success'
      }
    ],
    selections: [
      {
        id: 'sel-arch',
        name: 'Cloud Architecture',
        description: 'High availability multi-region infrastructure diagrams and failover topology'
      },
      {
        id: 'sel-chaos',
        name: 'Chaos Engineering',
        description: 'Netflix microservice latency resilience and chaos monkey testing runs'
      }
    ],
    images: [
      {
        id: 'img-vance-1',
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        caption: 'Global Multi-Region Active-Active Cloud Architecture & Aurora Failover Topology',
        created_at: '2026-03-01',
        selectionIds: ['sel-arch'],
        tags: ['aws', 'multi-region', 'architecture', 'database', 'cloud']
      },
      {
        id: 'img-vance-2',
        url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
        caption: 'Kubernetes Ingress Gateway & Gloo Envoy Microservice Traffic Routing',
        created_at: '2026-03-05',
        selectionIds: ['sel-arch', 'sel-chaos'],
        tags: ['kubernetes', 'architecture', 'service-mesh', 'envoy']
      },
      {
        id: 'img-vance-3',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        caption: 'Regional Blackhole Chaos Drill Metrics: 99.999% Service Continuity Maintained',
        created_at: '2026-03-10',
        selectionIds: ['sel-chaos'],
        tags: ['chaos', 'metrics', 'monitoring', 'netflix']
      }
    ],
    journal: {
      profile: {
        firstName: 'Sarah',
        surname: 'Vance',
        age: '33',
        gender: 'Female',
        dateOfBirth: '1993-04-14',
        countryOfResidence: 'United States',
        programmes: [
          {
            id: 'prog-sv-1',
            degree: 'M.S. in Computer Science',
            institution: 'Stanford University',
            startYear: '2015',
            endYear: '2017',
            description: 'Focused on distributed consensus systems, cloud fault-tolerance, and active-active database replication.'
          },
          {
            id: 'prog-sv-2',
            degree: 'B.S. in Software Engineering',
            institution: 'University of Washington',
            startYear: '2011',
            endYear: '2015',
            description: 'Graduated Summa Cum Laude. Capstone on high-throughput TCP/IP packet routing.'
          }
        ],
        courses: [
          {
            id: 'course-sv-1',
            name: 'AWS Certified Solutions Architect - Professional',
            provider: 'Amazon Web Services',
            year: '2025',
            description: 'Enterprise multi-region disaster recovery, billing optimization, and zero-trust IAM governance.'
          },
          {
            id: 'course-sv-2',
            name: 'Certified Kubernetes Administrator (CKA)',
            provider: 'Cloud Native Computing Foundation',
            year: '2024',
            description: 'Production cluster networking, Envoy service-mesh ingress, and automated failover.'
          }
        ],
        myStory: '<p>I grew up in the Pacific Northwest fascinated by systems that never sleep. From diving deep-water reefs in Puget Sound to orchestrating multi-region failover at Netflix and AWS, my philosophy is simple: <strong>calm preparation beats heroic firefighting</strong>.</p>',
        workExperience: [
          {
            id: 'work-sv-1',
            title: 'Principal Cloud Consultant',
            position: 'Lead / Founder',
            company: 'InfraCore Consulting',
            startDate: 'Aug 2024',
            endDate: 'Present',
            description: 'Advising Fortune-500 scale startups on multi-region active-active database topologies with Terraform and AWS Aurora.'
          },
          {
            id: 'work-sv-2',
            title: 'Senior Infrastructure Engineer',
            position: 'Senior Staff',
            company: 'Netflix',
            startDate: 'Jan 2021',
            endDate: 'Jul 2024',
            description: 'Co-architected container routing supporting 10M+ concurrent streams and led monthly Chaos Monkey regional failover drills.'
          }
        ],
        awards: ['AWS Global Delivery Excellence Award (2019)', 'UW Dean\'s Medal in Engineering'],
        sports: ['PADI Divemaster Scuba Diving', 'Open-Water Kayaking'],
        hobbies: ['Marine Reef Conservation', 'Synthesizer Sound Design']
      },
      entries: [
        {
          id: 'journal-sv-1',
          title: 'Why I Treat Cloud Regions Like Deep-Sea Dive Plans',
          contentHtml: '<h1>Redundancy Is Life</h1><p>With over 350 logged ocean dives as a PADI Divemaster, I learned early that equipment fails when you least expect it. When I design multi-region active-active Aurora clusters, I apply the exact same checklist discipline.</p><h2>Key Principles</h2><ul><li>Never rely on a single availability zone or single oxygen regulator.</li><li>Drill failure scenarios monthly so nobody panics when us-east-1 goes dark.</li></ul>',
          includeInAI: true,
          createdAt: '2026-05-01T10:00:00Z',
          updatedAt: '2026-05-01T10:00:00Z'
        }
      ],
      linkedIn: { connected: false }
    }
  },
  chen: {
    user: {
      id: 'chen',
      name: 'Marcus Chen',
      title: 'Senior UX & Product Designer',
      bio: 'Creating simple, cinematic human-computer interfaces. Ex-Stripe Brand Architect and Stripe Billing UX Designer. Passionate about beautiful margins, dark theme layouts, and seamless friction-free customer onboarding.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      email: 'm.chen@designedbymarcus.co',
      location: 'San Francisco, CA, USA',
      skills: ['Framer UI', 'Design Systems', 'Advanced Prototyping', 'User Research', 'Onboarding Funnel Optimization', 'Web3 Interfaces'],
      certifications: ['NN/g UX Master Certification #104928', 'Interaction Design Foundation Specialist'],
      linkedin: 'https://linkedin.com/in/marcus-chen-ux-demo',
      github: 'https://github.com/designedbymarcus-demo',
      website: 'https://designedbymarcus.co'
    },
    files: [
      {
        id: 'mc-1',
        title: 'Marcus_Chen_Resume_2026.pdf',
        category: 'CV',
        type: 'PDF',
        size: '110 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2026-02-18',
        textContent: `MARCUS CHEN
San Francisco, CA | m.chen@designedbymarcus.co | designedbymarcus.co

SUMMARY:
Award-winning Product Designer with 8+ years of scaling digital transaction systems and complex software workflows into accessible, clean, delightful designs. Dedicated advocate of minimal design paradigms, dark aesthetics, and robust design systems.

WORK EXPERIENCE:
1. STRIPE | Senior Interaction Designer (Nov 2022 - Jan 2026)
- Redesigned the core subscriber onboarding flows for the subscription platform, slashing registration churn by 42%.
- Created the "Stripe Bloom" accessibility design standards, deployed across 6 main financial portals and translated to 14 languages.
- Led high-fidelity prototyping teams using Framer and physical hardware modules, earning Stripe's "Design Excellence Key" in 2024.

2. AIRBNB | Product Designer - Core Booking Experience (Oct 2019 - Oct 2022)
- Reconfigured checkout conversion flows on mobile apps, contributing to an estimated $140M increase in transactional volume.
- Managed user studies with 250+ global testers to inform screen-sharing features and accessibility standards.
- Partnered with lead mobile engineers to build buttery-smooth 120Hz micro-animations using React Native.

EDUCATION:
- B.F.A. in Graphic & Interactive Design | Rhode Island School of Design (RISD) (2015 - 2019)`
      },
      {
        id: 'mc-2',
        title: 'NeoBank_Onboarding_UX_Audit.pdf',
        category: 'Portfolio',
        type: 'PDF',
        size: '1.4 MB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2026-03-30',
        textContent: `CASE STUDY: REDESIGNING NEOBANK'S ONBOARDING FLOW
Author: Marcus Chen, UX Lead
A complete teardown and UX reconstruction of the signup and KYC verification steps for NeoBank.

1. THE PROBLEMATIC METRIC:
Approximately 58% of global users dropped off between entering email address and uploading KYC photo verification. Tests showed users felt "surveilled" and overloaded by dry layout forms.

2. EXPERIMENTAL RETROFIT:
- Replaced 5-step scrolling forms with 3 singular interactive display modules.
- Added warm, humanizing micro-animations that congratulate users at each successfully verified step.
- Implemented real-time form field validations with playful, encouraging tooltips.

3. SUCCESS NUMBERS:
- The updated flow raised onboarding conversions from 42% to 79%.
- The average completion speed dropped from 4 minutes and 12 seconds down to 1 minute and 48 seconds.`
      },
      {
        id: 'mc-3',
        title: 'Design_System_Token_Spec_V2.json',
        category: 'Portfolio',
        type: 'ZIP',
        size: '95 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: false,
        isRecruiterVisible: true,
        uploadDate: '2026-04-12',
        textContent: `DESIGN SYSTEM CONFIGURATION DATA
Token standards used in Marcus's dark mode projects.
Standard color palette:
- Background: Obsidian Deep (Hsl 220, 20%, 3%)
- Panels: Slate Glassmorphic (Hsl 220, 10%, 10%, 0.4 opacity)
- Glow borders: Emerald Matrix (Hsl 154, 75%, 52%)
- Typography: Inter Display paired with JetBrains Mono for metadata.
Grid layout: Fluid 12 Columns with variable 24px and 16px row padding based on viewport resize, avoiding fixed innerWidth multipliers.`
      }
    ],
    projects: [
      {
        id: 'mcp-1',
        title: 'NeoBank KYC Conversions UX Redesign',
        description: 'Overhauled the digital signup funnels for a next-gen digital bank, lifting successful accounts creation and KYC checks from 42% to 79% using structured flow cards.',
        tags: ['KYC Optimization', 'Interaction Design', 'Conversion Funnels'],
        verified: true
      },
      {
        id: 'mcp-2',
        title: 'Stripe Bloom Design System',
        description: 'Engineered a highly modular, light/dark responsive design tokens and component kit utilized by global teams to implement accessibility features.',
        tags: ['Design Systems', 'Framer', 'Accessibility'],
        verified: true
      }
    ],
    recommendations: [
      {
        id: 'mcr-1',
        title: 'Add Certifications Thumbnail',
        description: 'You mention NN/g UX Master Certification but havent uploaded the physical certificate file for digital notarization.',
        category: 'Structure',
        impact: 'High',
        resolved: false
      },
      {
        id: 'mcr-2',
        title: 'Add Video Demonstration Walkthrough',
        description: 'Modern product designers frequently provide a 60-second video demo of mobile interactions to help recruiters quickly scan product feels.',
        category: 'Engagement',
        impact: 'Medium',
        resolved: false
      }
    ],
    logs: [
      {
        id: 'mcl-1',
        action: 'Design System Tokens Loaded',
        timestamp: '2026-05-20T14:20:00Z',
        details: 'Standard brand colors and tokens extracted from Token Spec json.',
        status: 'success'
      },
      {
        id: 'mcl-2',
        action: 'NN/g Verification Audit Request',
        timestamp: '2026-05-20T14:32:00Z',
        details: 'Self-reported NN/g UX certification ID queued for automated validation.',
        status: 'info'
      }
    ],
    selections: [
      {
        id: 'sel-neobank',
        name: 'NeoBank Experience',
        description: 'Mobile FinTech onboarding workflows and KYC conversion interfaces'
      },
      {
        id: 'sel-designsys',
        name: 'Design System',
        description: 'Cross-platform design token kits, dark mode ergonomics, and micro-interactions'
      }
    ],
    images: [
      {
        id: 'img-chen-1',
        url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
        caption: 'NeoBank Friction-Free 3-Step KYC Identity Verification Flow',
        created_at: '2026-02-20',
        selectionIds: ['sel-neobank'],
        tags: ['fintech', 'mobile', 'onboarding', 'ui']
      },
      {
        id: 'img-chen-2',
        url: 'https://images.unsplash.com/photo-1581291518655-9523c932deda?auto=format&fit=crop&w=800&q=80',
        caption: 'Stripe-Inspired Design Tokens, Dark Mode Palettes & Typography Kit',
        created_at: '2026-02-24',
        selectionIds: ['sel-designsys'],
        tags: ['design-system', 'tokens', 'dark-mode', 'typography']
      },
      {
        id: 'img-chen-3',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        caption: 'FinTech Portfolio Dashboard & Fluid Haptic Interaction Prototypes',
        created_at: '2026-03-02',
        selectionIds: ['sel-neobank', 'sel-designsys'],
        tags: ['fintech', 'prototyping', 'dashboard', 'ui']
      }
    ],
    journal: {
      profile: {
        firstName: 'Marcus',
        surname: 'Chen',
        age: '29',
        gender: 'Male',
        dateOfBirth: '1997-08-22',
        countryOfResidence: 'United States',
        programmes: [
          {
            id: 'prog-mc-1',
            degree: 'B.F.A. in Graphic & Interactive Design',
            institution: 'Rhode Island School of Design (RISD)',
            startYear: '2015',
            endYear: '2019',
            description: 'Focused on human-computer interaction, kinetic typography, and accessible digital product systems.'
          }
        ],
        courses: [
          {
            id: 'course-mc-1',
            name: 'NN/g UX Master Certification #104928',
            provider: 'Nielsen Norman Group',
            year: '2024',
            description: 'Empirical usability testing, quantitative conversion research, and cognitive load reduction.'
          },
          {
            id: 'course-mc-2',
            name: 'Interaction Design Specialist',
            provider: 'Interaction Design Foundation',
            year: '2023',
            description: 'Design token architecture and micro-interaction choreography.'
          }
        ],
        myStory: '<p>I believe financial and enterprise software should feel calm, honest, and tactile. Whether designing billing flows at Stripe or reimagining mobile booking at Airbnb, my craft centers on removing friction so people feel respected by the tools they use.</p>',
        workExperience: [
          {
            id: 'work-mc-1',
            title: 'Senior Interaction Designer',
            position: 'Design Lead',
            company: 'Stripe',
            startDate: 'Nov 2022',
            endDate: 'Jan 2026',
            description: 'Created the Stripe Bloom accessibility design system and redesigned subscriber onboarding, cutting churn by 42%.'
          },
          {
            id: 'work-mc-2',
            title: 'Product Designer',
            position: 'Core Booking Experience',
            company: 'Airbnb',
            startDate: 'Oct 2019',
            endDate: 'Oct 2022',
            description: 'Rebuilt mobile checkout conversion flows and led user studies across 250+ global participants.'
          }
        ],
        awards: ['Stripe Design Excellence Key (2024)', 'RISD Senior Thesis Honors'],
        sports: ['Bouldering & Indoor Climbing', 'Road Cycling'],
        hobbies: ['35mm Film Photography', 'Mechanical Keyboards', 'Japanese Woodworking']
      },
      entries: [
        {
          id: 'journal-mc-1',
          title: 'Designing Calm Interfaces for High-Stakes Money Flows',
          contentHtml: '<h1>Why FinTech Forms Feel Stressful</h1><p>When we audited NeoBank\'s KYC flow, 58% of applicants dropped off because the UI felt like an interrogation. Replacing five dense form pages with three conversational cards lifted completion from 42% to 79%.</p>',
          includeInAI: true,
          createdAt: '2026-04-20T14:00:00Z',
          updatedAt: '2026-04-20T14:00:00Z'
        }
      ],
      linkedIn: { connected: false }
    }
  },
  tendai: {
    user: {
      id: 'tendai',
      name: 'Tendai Moyo',
      title: 'Agricultural Economist & Agri-Supply Chain Lead',
      bio: 'BSc Agricultural Economics graduate from the University of Zimbabwe. Specializing in commercial blueberry & export horticulture value chains, smallholder outgrower scheme aggregation, cold-chain distribution logistics, and precision agribusiness telemetry across Southern Africa.',
      avatarUrl: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?q=80&w=300&auto=format&fit=crop',
      email: 'tendai.moyo@zim-agri.co.zw',
      location: 'Harare & Marondera, Zimbabwe',
      skills: [
        'Agricultural Economics',
        'Cold Chain Logistics',
        'Crop Yield Forecasting',
        'Horticultural Export (GlobalG.A.P.)',
        'Outgrower Scheme Aggregation',
        'Agribusiness Trade Finance',
        'Precision Farm Telemetry & Sensors'
      ],
      certifications: [
        'GlobalG.A.P. Certified Farm Assessor (IFA v6)',
        'Cold Chain Post-Harvest Management (WFLO / SSA)',
        'Agribusiness Value Chain Analyst (AFDB)'
      ],
      linkedin: 'https://linkedin.com/in/tendai-moyo-agriecon',
      github: 'https://github.com/tendaimoyo-agritech',
      website: 'https://tendaimoyo.co.zw'
    },
    files: [
      {
        id: 'tendai-resume',
        title: 'Tendai_Moyo_Agricultural_Economics_CV.pdf',
        category: 'CV',
        type: 'PDF',
        size: '62 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2026-04-10',
        textContent: `CURRICULUM VITAE - TENDAI MOYO
Location: Harare / Marondera, Zimbabwe | tendai.moyo@zim-agri.co.zw

PROFESSIONAL SUMMARY:
Results-driven Agricultural Economist and Cold Chain Logistics Specialist with extensive experience in commercial berry production, outgrower aggregation, and post-harvest distribution across Mashonaland East and the Zambezi Basin. Proven track record connecting over 420 smallholder farmers to high-value export corridors to Europe and the Middle East.

EDUCATION:
- BSc (Hons) Agricultural Economics & Agribusiness Management — University of Zimbabwe (UZ), Graduated First Class.
- Thesis: Econometric Modeling of Smallholder Outgrower Incomes Under Temperature-Controlled Cold-Chain Hubs.

CORE COMPETENCIES:
- Agricultural Value Chains, Horticultural Export Compliance (GlobalG.A.P., BRCGS), Cold Chain Integrity, Route Optimization, Precision Soil Moisture Telemetry, Agribusiness Financial Modeling.`
      },
      {
        id: 'tendai-study',
        title: 'Marondera_Horticulture_Cold_Chain_Feasibility_2025.pdf',
        category: 'Portfolio',
        type: 'PDF',
        size: '118 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2026-04-12',
        textContent: `FEASIBILITY STUDY: HIGHBUSH BLUEBERRY EXPORT VALUE CHAIN
Author: Tendai Moyo, Lead Agricultural Economist

KEY FINDINGS:
1. Cold Chain Preservation: Implementing refrigerated pre-cooling within 90 minutes of picking extended shelf life by 9 days and reduced spoilage by 28%.
2. Airport Transit Matrix: Dedicated refrigerated reefers operating night runs from Marondera packhouses to Robert Gabriel Mugabe International Airport achieved 99.4% cargo on-time delivery for London Heathrow and Frankfurt freight flights.`
      }
    ],
    projects: [
      {
        id: 'proj-tendai-1',
        title: 'Highbush Blueberry Export & Cold Chain Hub',
        description: 'Engineered a centralized packing and refrigerated cold-chain distribution matrix in Marondera, moving over 180 tonnes of export-grade blueberries to international markets with under 1.2% transit spoilage.',
        tags: ['Agri Economics', 'Cold Chain', 'Logistics', 'GlobalG.A.P.'],
        verified: true,
        link: 'https://tendaimoyo.co.zw/projects/blueberry-cold-chain'
      },
      {
        id: 'proj-tendai-2',
        title: 'Smallholder Outgrower Telemetry & Aggregation Scheme',
        description: 'Aggregated 420+ smallholder horticultural farmers into unified commercial export clusters, deploying IoT soil moisture sensors and weather telemetry that lifted average yield realizations by 34%.',
        tags: ['Outgrower Scheme', 'IoT Sensors', 'Telemetry', 'Yield Modeling'],
        verified: true
      },
      {
        id: 'proj-tendai-3',
        title: 'Zambezi Basin Perishables Logistics Network',
        description: 'Formulated multimodal refrigerated transport routes connecting peri-urban farm clusters across Zimbabwe and Mozambique corridors, reducing transit friction by 40%.',
        tags: ['Logistics', 'Route Optimization', 'Supply Chain', 'Cross-Border'],
        verified: true
      }
    ],
    recommendations: [
      {
        id: 'rec-tendai-1',
        title: 'Link GlobalG.A.P. Compliance Audit Certificates',
        description: 'Upload packhouse audit reports to further elevate verification scores for international agricultural buyers.',
        category: 'Structure',
        impact: 'High',
        resolved: false
      }
    ],
    logs: [
      {
        id: 'log-tendai-1',
        action: 'Agri-Economics Persona Calibrated',
        timestamp: '2026-04-10T09:00:00Z',
        details: 'Grounded representation loaded with Zimbabwean commercial agriculture and cold chain logistics evidence.',
        status: 'info'
      }
    ],
    selections: [
      {
        id: 'sel-tendai-farming',
        name: 'Export Farming & Orchards',
        description: 'Commercial blueberry cultivation, precision irrigation, and orchard management in Zimbabwe'
      },
      {
        id: 'sel-tendai-logistics',
        name: 'Cold Chain & Logistics',
        description: 'Refrigerated packhouses, quality grading, and airport transit corridors'
      }
    ],
    images: [
      {
        id: 'img-tendai-1',
        url: 'https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?auto=format&fit=crop&w=800&q=80',
        caption: 'Highbush Blueberry Cultivars Ripening Under Netting in Marondera Orchard',
        created_at: '2026-04-05',
        selectionIds: ['sel-tendai-farming'],
        tags: ['blueberry', 'harvest', 'orchard', 'agriculture']
      },
      {
        id: 'img-tendai-2',
        url: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=800&q=80',
        caption: 'Graded Premium Blueberries in Cold-Storage Awaiting Airport Reefer Transfer',
        created_at: '2026-04-08',
        selectionIds: ['sel-tendai-logistics', 'sel-tendai-farming'],
        tags: ['blueberry', 'cold-chain', 'logistics', 'export']
      },
      {
        id: 'img-tendai-3',
        url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
        caption: 'Automated Drip Irrigation & Soil Sensor Array Across Commercial Acreage',
        created_at: '2026-04-12',
        selectionIds: ['sel-tendai-farming'],
        tags: ['sensors', 'irrigation', 'telemetry', 'fieldwork']
      }
    ],
    journal: {
      profile: {
        firstName: 'Tendai',
        surname: 'Moyo',
        age: '26',
        gender: 'Male',
        dateOfBirth: '2000-08-14',
        countryOfResidence: 'Zimbabwe',
        programmes: [
          {
            id: 'prog-tendai-1',
            degree: 'BSc (Hons) Agricultural Economics & Agribusiness',
            institution: 'University of Zimbabwe',
            startYear: '2019',
            endYear: '2023',
            description: 'Focused on microeconomic price theory, agricultural trade policy, econometric modeling, and post-harvest horticultural logistics.'
          }
        ],
        courses: [
          {
            id: 'course-tendai-1',
            name: 'Advanced Cold Chain & Post-Harvest Horticulture',
            provider: 'World Food Logistics Organization (WFLO)',
            year: '2024',
            description: 'Temperature integrity, modified atmosphere packaging, and perishable air cargo protocol.'
          }
        ],
        myStory: '<p>Growing up surrounded by the rich soils of Mashonaland East, I realized early on that Africa\'s agricultural future is not just about growing crops—it is about the logistics, economics, and cold chain pipelines that get perishable harvests onto world markets at peak freshness. Graduating in Agricultural Economics from the University of Zimbabwe, I dedicated my career to closing the divide between field agronomy and international commercial supply chains.</p>',
        workExperience: [
          {
            id: 'work-tendai-1',
            title: 'Agri-Supply Chain & Logistics Specialist',
            position: 'Supply Chain Lead',
            company: 'Marondera Horticultural Consortium',
            startDate: 'Jan 2024',
            endDate: 'Present',
            description: 'Lead commercial blueberry packing, cold-chain integrity monitoring, and direct reefer transit logistics to R.G. Mugabe International Airport.'
          }
        ],
        awards: ['University of Zimbabwe Agricultural Economics Top Student Medal (2023)'],
        sports: ['Distance Running', 'Football'],
        hobbies: ['Soil Sensor Electronics', 'Coffee Roasting', 'Rural Economic Mentorship']
      },
      entries: [
        {
          id: 'journal-tendai-1',
          title: 'The Realities of Cold Chain Distribution in Southern Africa',
          contentHtml: '<h1>Bridging Field Yield to Airport Cargo</h1><p>In perishable horticultural export, temperature divergence of even 2 degrees Celsius cuts product shelf life drastically. By deploying low-cost IoT temperature probes in every reefer truck from Marondera to Harare, we transformed transit reliability into a bankable asset.</p>',
          includeInAI: true,
          createdAt: '2026-04-10T10:00:00Z',
          updatedAt: '2026-04-10T10:00:00Z'
        }
      ],
      linkedIn: { connected: false }
    }
  },
  ruvimbo: {
    user: {
      id: 'ruvimbo',
      name: 'Ruvimbo Chidzero',
      title: 'Civil & Structural Technologist | Universal Accessibility Specialist',
      bio: 'Harare Polytechnic Civil Engineering graduate and wheelchair athlete. Specializing in universal barrier-free infrastructure, structural concrete detailing, and municipal stormwater reticulation. Dedicated to engineering inclusive civic spaces across Southern Africa.',
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=300&auto=format&fit=crop',
      email: 'ruvimbo.chidzero@polytechnic.ac.zw',
      location: 'Harare, Zimbabwe',
      skills: [
        'Civil & Structural Drafting',
        'AutoCAD & Civil 3D',
        'Universal Design (ISO 21542 / SABS 0400-S)',
        'Municipal Stormwater Reticulation',
        'Reinforced Concrete Detailing',
        'Topographic Gradient Surveying',
        'Bill of Quantities (BOQ) & Estimating'
      ],
      certifications: [
        'Higher National Diploma (HND) in Civil Engineering — Harare Polytechnic',
        'Certified Civil 3D Infrastructure Modeler (Autodesk)',
        'Universal Design & Built Environment Accessibility Auditor (ZIE)'
      ],
      linkedin: 'https://linkedin.com/in/ruvimbo-chidzero-civil',
      github: 'https://github.com/ruvimbo-civil-design',
      website: 'https://ruvimbo-civil.co.zw'
    },
    files: [
      {
        id: 'ruvimbo-resume',
        title: 'Ruvimbo_Chidzero_Civil_Engineering_CV.pdf',
        category: 'CV',
        type: 'PDF',
        size: '58 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2026-04-11',
        textContent: `CURRICULUM VITAE - RUVIMBO CHIDZERO
Location: Harare, Zimbabwe | ruvimbo.chidzero@polytechnic.ac.zw

PROFESSIONAL SUMMARY:
Accomplished Civil & Structural Engineering Technologist graduated from Harare Polytechnic. Wheelchair user and passionate pioneer of Universal Accessibility and barrier-free civic design. Over 4 years of practical experience in structural concrete detailing, stormwater reticulation, and accessibility compliance retrofits across Harare metropolitan area.

EDUCATION:
- Higher National Diploma (HND) in Civil Engineering — Harare Polytechnic, Graduated with Distinction.
- National Diploma (ND) in Civil Engineering — Harare Polytechnic.
- Major Coursework: Theory of Structures, Hydraulics & Hydrology, Soil Mechanics & Foundation Design, Highway Engineering, Reinforced Concrete Design, Surveying.

TECHNICAL CAPABILITIES:
- AutoCAD, Autodesk Civil 3D, Prokon Structural Analysis, Universal Access Standards (ISO 21542, SABS 0400-S), Municipal Stormwater Drainage, Culvert & Bridge Abutment Design, Road Cross-Section Gradient Modeling.`
      },
      {
        id: 'ruvimbo-spec',
        title: 'Harare_Polytechnic_Universal_Accessibility_Audit_2025.pdf',
        category: 'Portfolio',
        type: 'PDF',
        size: '145 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2026-04-12',
        textContent: `PROJECT SPECIFICATION: UNIVERSAL ACCESSIBILITY AUDIT & RETROFIT
Location: Harare Polytechnic Campus (Herbert Chitepo Ave, Harare)
Lead Engineer: Ruvimbo Chidzero

KEY TECHNICAL DELIVERABLES:
1. Workshop Access Ramp Redesign: Re-engineered 8 main campus entrances from non-compliant 1:6 steps to standard 1:12 accessible ramps with continuous double handrails, intermediate landings, and tactile ground surface indicators.
2. Sanitary Facilities Retrofit: Designed wheelchair turning radius clearances (1500mm diameter), lever-operated fixtures, and grab rails compliant with ISO 21542 standards.
3. Stormwater Grating Safety: Replaced wide slotted drainage grates across pedestrian paths with heel-proof, wheelchair-safe perpendicular mesh grates.`
      }
    ],
    projects: [
      {
        id: 'proj-ruvimbo-1',
        title: 'Harare Polytechnic Universal Access Retrofit',
        description: 'Engineered comprehensive barrier-free campus modifications across 6 faculty blocks, designing compliant 1:12 ramp gradients, tactile guide paths, and accessible laboratory workbenches.',
        tags: ['Universal Design', 'Harare Poly', 'AutoCAD', 'Structural Ramps'],
        verified: true,
        link: 'https://ruvimbo-civil.co.zw/projects/harare-poly-retrofit'
      },
      {
        id: 'proj-ruvimbo-2',
        title: 'Highfield Municipal Stormwater & Drainage Channel',
        description: 'Designed reinforced precast concrete box culverts and trapezoidal open channels over 2.4km, eliminating perennial seasonal flash flooding for 1,200+ residential properties in Highfield.',
        tags: ['Hydraulics', 'Stormwater', 'Concrete Culverts', 'Municipal Civil'],
        verified: true
      },
      {
        id: 'proj-ruvimbo-3',
        title: 'Accessible Peri-Urban Water Kiosks & Borehole Network',
        description: 'Engineered wheelchair-accessible concrete aprons, gravity-fed reticulation pipelines, and low-level lever taps for solar-powered community borehole stations in Epworth.',
        tags: ['Water Reticulation', 'Inclusion', 'Public Works', 'Community Civil'],
        verified: true
      }
    ],
    recommendations: [
      {
        id: 'rec-ruvimbo-1',
        title: 'Attach AutoCAD / Civil 3D Structural DWG Exports',
        description: 'Upload CAD detail drawing sheets of culverts and ramp cross-sections to provide cryptographic proof of structural drafting proficiency.',
        category: 'Visuals',
        impact: 'High',
        resolved: false
      }
    ],
    logs: [
      {
        id: 'log-ruvimbo-1',
        action: 'Civil Technologist Persona Calibrated',
        timestamp: '2026-04-11T10:00:00Z',
        details: 'Grounded representation loaded with Harare Polytechnic civil engineering and universal accessibility credentials.',
        status: 'info'
      }
    ],
    selections: [
      {
        id: 'sel-ruvimbo-civil',
        name: 'Civil & Stormwater Infrastructure',
        description: 'Precast concrete culverts, hydraulic drainage channels, and municipal infrastructure plans'
      },
      {
        id: 'sel-ruvimbo-access',
        name: 'Universal Design & Accessibility',
        description: 'Ramp gradients, tactile paving, wheelchair-accessible sanitary and educational spaces'
      }
    ],
    images: [
      {
        id: 'img-ruvimbo-1',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80',
        caption: 'Civil Construction Site Survey & Gradient Inspection on Harare Municipal Drainage Channel',
        created_at: '2026-04-06',
        selectionIds: ['sel-ruvimbo-civil'],
        tags: ['civil', 'construction', 'drainage', 'surveying']
      },
      {
        id: 'img-ruvimbo-2',
        url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
        caption: 'AutoCAD Civil 3D Cross-Sectional Detailing of Reinforced Concrete Box Culvert',
        created_at: '2026-04-09',
        selectionIds: ['sel-ruvimbo-civil', 'sel-ruvimbo-access'],
        tags: ['cad', 'structural', 'culvert', 'drafting']
      },
      {
        id: 'img-ruvimbo-3',
        url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
        caption: 'Harare Polytechnic Entrance Ramp & Universal Accessibility Tactile Paving Plan',
        created_at: '2026-04-13',
        selectionIds: ['sel-ruvimbo-access'],
        tags: ['accessibility', 'ramps', 'universal-design', 'harare-poly']
      }
    ],
    journal: {
      profile: {
        firstName: 'Ruvimbo',
        surname: 'Chidzero',
        age: '25',
        gender: 'Female',
        dateOfBirth: '2001-03-22',
        countryOfResidence: 'Zimbabwe',
        programmes: [
          {
            id: 'prog-ruvimbo-1',
            degree: 'Higher National Diploma (HND) in Civil Engineering',
            institution: 'Harare Polytechnic',
            startYear: '2020',
            endYear: '2024',
            description: 'Civil and structural engineering technology, hydraulic structures, soil mechanics, reinforced concrete design, and topographic surveying.'
          }
        ],
        courses: [
          {
            id: 'course-ruvimbo-1',
            name: 'Universal Design & Built Environment Accessibility Standards (ISO 21542)',
            provider: 'Zimbabwe Institution of Engineers (ZIE)',
            year: '2024',
            description: 'Barrier-free architectural drafting, tactile ground surface indicators, and public works accessibility compliance.'
          }
        ],
        myStory: '<p>As a wheelchair user studying Civil Engineering at Harare Polytechnic, I experienced every single day how poor urban design excludes people. From stairs without ramps to open stormwater drains, the built environment often creates unnecessary barriers. I made it my life mission to master civil and structural engineering so I can build roads, drainage channels, and public structures that welcome everyone. My lived experience is my superpower: I design with an uncompromising eye for gradient precision, accessibility, and structural durability.</p>',
        workExperience: [
          {
            id: 'work-ruvimbo-1',
            title: 'Civil Engineering Technologist',
            position: 'Junior Civil Engineer',
            company: 'Chitepo & Associates Civil Consultants',
            startDate: 'Jan 2024',
            endDate: 'Present',
            description: 'Draft structural culvert detail drawings, calculate stormwater runoff coefficients, and conduct universal accessibility compliance audits for municipal and educational clients.'
          }
        ],
        awards: ['Harare Polytechnic Civil Engineering Department Innovation Prize (2024)', 'Zimbabwe Wheelchair Basketball National Team Representative'],
        sports: ['Wheelchair Basketball', 'Para-athletics (T54 Racing)'],
        hobbies: ['3D CAD Modeling', 'Accessible Architectural Sketching', 'Youth STEM Mentorship']
      },
      entries: [
        {
          id: 'journal-ruvimbo-1',
          title: 'Wheelchair Engineering: Designing What Others Overlook',
          contentHtml: '<h1>Lived Experience as Engineering Rigor</h1><p>Most able-bodied civil designers treat a 1:12 ramp slope as an abstract code number in a manual. For me, pushing up that slope every day teaches me the exact frictional resistance, handrail diameter comfort, and transition plate smoothness needed. That precision translates into better, safer civil engineering for everyone—from wheelchair users to parents with prams and elderly citizens.</p>',
          includeInAI: true,
          createdAt: '2026-04-11T10:00:00Z',
          updatedAt: '2026-04-11T10:00:00Z'
        }
      ],
      linkedIn: { connected: false }
    }
  },
  custom: {
    user: {
      id: 'custom',
      name: 'Malachai Uys',
      title: 'Senior Software Engineer & Tech Lead',
      bio: 'Ready to configure my own verified digital clone representation. Paste facts in the Knowledge Vault to seed my weights!',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      email: 'malachaistellenboschuniversity@gmail.com',
      location: 'Stellenbosch, South Africa',
      skills: ['TypeScript', 'Node.js', 'Express', 'React', 'Cloud Infrastructure', 'AI Systems'],
      certifications: ['Certified Cloud Security Architect', 'Kaitana Verified Developer'],
    },
    files: [
      {
        id: 'owner-resume',
        title: 'Malachai_Uys_Curriculum_Vitae.pdf',
        category: 'CV',
        type: 'PDF',
        size: '48 KB',
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        uploadDate: '2026-04-01',
        textContent: `RESUME FACT DIRECTIVES:\nApplicant: Malachai Uys.\nCore focus: Full-stack applications, Express microservices, and AI integrations.\nPast background: Developed key modular components for enterprise software suites, lifting transaction load capacities of backend queues by 40%.`
      }
    ],
    projects: [
      {
        id: 'owner-proj-1',
        title: 'Kaitana Verified RAG Platform',
        description: 'Engineered a highly secure shadow interview portal grounding generative responses strictly in verified user-provided file text database.',
        tags: ['React', 'Express', 'Gemini AI', 'Tailwind'],
        verified: true
      }
    ],
    recommendations: [
      {
        id: 'owner-audit-1',
        title: 'Integrate More Verified Credentials',
        description: 'Your database has only 1 verified fact. Upload certifications or portfolio sheets to lift your Kaitana Align Score above 80.',
        category: 'Structure',
        impact: 'High',
        resolved: false
      }
    ],
    logs: [
      {
        id: 'owner-log-1',
        action: 'Identity Vault Initialized',
        timestamp: '2026-04-01T10:00:00Z',
        details: 'Grounded representation engine loaded with template facts for Malachai Uys.',
        status: 'info'
      }
    ],
    selections: [
      {
        id: 'sel-farming',
        name: 'Farming Projects',
        description: 'Sustainable agriculture initiatives, blueberry cultivation, and fieldwork automation'
      },
      {
        id: 'sel-artwork',
        name: 'Artwork',
        description: 'Visual arts, generative design studies, and creative portfolio pieces'
      }
    ],
    images: [
      {
        id: 'img-farm-1',
        url: 'https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?auto=format&fit=crop&w=800&q=80',
        caption: 'Highbush Blueberry Cultivar Ripening in Organic Orchard',
        created_at: '2026-03-15',
        selectionIds: ['sel-farming'],
        tags: ['blueberry', 'harvest', 'fieldwork', 'agriculture']
      },
      {
        id: 'img-farm-2',
        url: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=800&q=80',
        caption: 'Hand-Selected Fresh Blueberry Harvest Prepared for Cold Chain Distribution',
        created_at: '2026-03-18',
        selectionIds: ['sel-farming'],
        tags: ['blueberry', 'harvest', 'logistics']
      },
      {
        id: 'img-farm-3',
        url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
        caption: 'Sustainable Precision Fieldwork and Soil Sensor Telemetry Grid',
        created_at: '2026-03-20',
        selectionIds: ['sel-farming'],
        tags: ['fieldwork', 'agriculture', 'sensors', 'irrigation']
      },
      {
        id: 'img-art-1',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        caption: 'Generative Chroma Study: Digital Expressionism and Geometric Forms',
        created_at: '2026-03-25',
        selectionIds: ['sel-artwork'],
        tags: ['artwork', 'generative', 'abstract', 'visual']
      },
      {
        id: 'img-art-2',
        url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=800&q=80',
        caption: 'Botanical Color Harmony & Acrylic Canvas Textures',
        created_at: '2026-03-28',
        selectionIds: ['sel-artwork', 'sel-farming'],
        tags: ['artwork', 'botanical', 'creative']
      }
    ],
    journal: {
      profile: {
        firstName: 'Malachai',
        surname: 'Uys',
        age: '24',
        gender: 'Male',
        dateOfBirth: '2002-06-15',
        countryOfResidence: 'South Africa',
        programmes: [
          {
            id: 'prog-custom-1',
            degree: 'BSc Computer Science & Agri-Tech Systems',
            institution: 'Stellenbosch University',
            startYear: '2021',
            endYear: '2025',
            description: 'Specialized in distributed backend systems, AI agent orchestration, and precision agriculture telemetry.'
          }
        ],
        courses: [
          {
            id: 'course-custom-1',
            name: 'Certified Cloud Security Architect',
            provider: 'Cloud Security Alliance',
            year: '2025',
            description: 'Zero-trust microservice architecture and cryptographic credential verification.'
          }
        ],
        myStory: '<p>Growing up in the Western Cape, I split my time between software engineering and sustainable blueberry farming. Building Kaitana came from wanting a verified, zero-hallucination way for creators and engineers to let their real work speak for itself.</p>',
        workExperience: [
          {
            id: 'work-custom-1',
            title: 'Senior Software Engineer & Tech Lead',
            position: 'Lead Engineer',
            company: 'Kaitana Labs',
            startDate: 'Jan 2025',
            endDate: 'Present',
            description: 'Architected the Kaitana grounded AI clone engine, multi-language TTS pipeline, and visual media vault.'
          }
        ],
        awards: ['Kaitana Verified Developer Pioneer'],
        sports: ['Trail Running', 'Rugby'],
        hobbies: ['Precision Blueberry Farming', 'Generative Art', 'Specialty Coffee Roasting']
      },
      entries: [
        {
          id: 'journal-custom-1',
          title: 'Building Grounded AI Clones & Sustainable Orchards',
          contentHtml: '<h1>My Personal Workspace</h1><p>This journal is the primary source of truth for my AI shadow clone. Any facts I record here take strict precedence over older PDFs or resumes in my Knowledge Vault.</p>',
          includeInAI: true,
          createdAt: '2026-04-01T10:00:00Z',
          updatedAt: '2026-04-01T10:00:00Z'
        }
      ],
      linkedIn: { connected: false }
    }
  }
};

