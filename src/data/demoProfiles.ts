/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, FileDoc, PortfolioProject, Recommendation, AuditLog } from '../types';

export interface FullProfile {
  user: UserProfile;
  files: FileDoc[];
  projects: PortfolioProject[];
  recommendations: Recommendation[];
  logs: AuditLog[];
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
    ]
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
    ]
  }
};
