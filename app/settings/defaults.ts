import type { FeedCategory } from "~/types/feeds";

export type FeedCategoryId = string;

export const DEFAULT_FEED_CATEGORIES: FeedCategory[] = [
  { id: 'all', label: 'All' },
  { id: 'ai-ml', label: 'Artificial Intelligence', q: 'topic: Artificial Intelligence and Machine Learning, Natural Language Processing, Computer Vision and Pattern Recognition, Generative AI and Foundation Models, MLOps and Model Engineering, AI Ethics and Governance' },
  { id: 'security-privacy', label: 'Cybersecurity', q: 'topic: Cybersecurity and Threat Intelligence, Privacy Engineering and Data Protection, Network Security and Firewalls, Identity and Access Management, Digital Forensics and Incident Response' },
  { id: 'software-engineering-devtools', label: 'Software Engineering', q: 'topic: Software Engineering and Programming, Programming Languages and Compilers, Web Development and Internet Technologies, Mobile App Development' },
  { id: 'cloud-data-infra', label: 'Cloud, Data & Infrastructure', q: 'topic: Cloud Computing and Distributed Systems, Databases and Data Engineering, DevOps and Site Reliability, High Performance Computing' },
  { id: 'hardware-embedded-edge', label: 'Hardware & Embedded Systems', q: 'topic: Computer Hardware and Architecture, Semiconductor Design and Fabrication, Microprocessors and Chipsets, Embedded Systems and Firmware, Internet of Things and Smart Devices, Wearable Technology, Consumer Electronics and Gadgets' },
  { id: 'robotics-automation-autonomous', label: 'Robotics & Autonomous Systems', q: 'topic: Robotics and Autonomous Systems, Industrial Automation and Control Systems, Mechatronics and Motion Systems, Drones and Uncrewed Systems' },
  { id: 'gaming-interactive-media', label: 'Gaming & Interactive Media', q: 'topic: Video Games and Game Development, Virtual Reality and Mixed Reality, Interactive Entertainment and Streaming' },
  { id: 'crypto', label: 'Cryptocurrency', q: 'topic: Blockchain and Distributed Ledgers, Cryptocurrency and Digital Assets, Decentralized Finance and Web3' }
]

export const DEFAULT_PUBLISHED_WINDOW = 7 // days
