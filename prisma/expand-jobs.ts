/**
 * JOBS EXPANSION — Add all new jobs with rich tags + questions.
 * Only touches jobs category. Does NOT modify any other data.
 * Run: bun run prisma/expand-jobs.ts
 */
import { db } from "../src/lib/db";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface Job {
  name: string;
  sub?: string;
  description: string;
  tags: string[];
  popularity: number;
  difficulty: number;
}

function j(sub: string, desc: string, tags: string[], pop: number, diff: number = 2): Job {
  return { sub, description: desc, tags: ["profession", "industry-healthcare", ...tags], popularity: pop, difficulty: diff };
}

// Helper for non-healthcare jobs
function jj(sub: string, industry: string, desc: string, tags: string[], pop: number, diff: number = 2): Job {
  return { sub, description: desc, tags: ["profession", industry, ...tags], popularity: pop, difficulty: diff };
}

const JOBS: Job[] = [
  // === HEALTHCARE ===
  { name: "Pediatrician", ...j("healthcare", "A doctor specializing in children's health.", ["healthcare", "doctorate", "degree", "indoor", "hospital", "office", "high-income", "public-facing", "regular-hours", "people-focused", "science", "caregiving", "works-with-children", "license-required", "precise"], 68, 2) },
  { name: "Psychiatrist", ...j("healthcare", "A doctor who treats mental health conditions.", ["healthcare", "doctorate", "degree", "indoor", "office", "high-income", "public-facing", "regular-hours", "people-focused", "science", "caregiving", "mental-health", "license-required", "prescribes-medication"], 60, 3) },
  { name: "Nurse Practitioner", ...j("healthcare", "An advanced nurse who can diagnose and prescribe.", ["healthcare", "degree", "indoor", "hospital", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "caregiving", "license-required", "prescribes-medication"], 55, 3) },
  { name: "Occupational Therapist", ...j("healthcare", "Helps patients recover daily living skills.", ["healthcare", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "caregiving", "rehabilitation", "hands-on"], 50, 3) },
  { name: "Anesthesiologist", ...j("healthcare", "A doctor who administers anesthesia during surgery.", ["healthcare", "doctorate", "degree", "indoor", "hospital", "high-income", "on-call", "high-stress", "life-or-death", "science", "precise", "license-required", "operating-room"], 58, 4) },
  { name: "Cardiologist", ...j("healthcare", "A doctor specializing in heart conditions.", ["healthcare", "doctorate", "degree", "indoor", "hospital", "high-income", "public-facing", "regular-hours", "people-focused", "science", "heart-specialist", "license-required"], 55, 4) },
  { name: "Dermatologist", ...j("healthcare", "A doctor specializing in skin conditions.", ["healthcare", "doctorate", "degree", "indoor", "office", "high-income", "public-facing", "regular-hours", "people-focused", "science", "skin-specialist", "license-required", "precise"], 52, 4) },
  { name: "Ophthalmologist", ...j("healthcare", "A doctor specializing in eye surgery and disease.", ["healthcare", "doctorate", "degree", "indoor", "office", "high-income", "public-facing", "regular-hours", "people-focused", "science", "eye-specialist", "license-required", "precise", "surgical"], 48, 4) },
  { name: "Orthopedic Surgeon", ...j("healthcare", "A surgeon specializing in bones and joints.", ["healthcare", "doctorate", "degree", "indoor", "hospital", "high-income", "on-call", "high-stress", "life-or-death", "science", "bone-specialist", "surgical", "license-required", "precise", "manual-dexterity"], 55, 4) },
  { name: "Neurologist", ...j("healthcare", "A doctor specializing in the nervous system.", ["healthcare", "doctorate", "degree", "indoor", "hospital", "high-income", "public-facing", "regular-hours", "people-focused", "science", "brain-specialist", "license-required"], 50, 5) },
  { name: "Pathologist", ...j("healthcare", "A doctor who diagnoses disease from tissue samples.", ["healthcare", "doctorate", "degree", "indoor", "lab", "hospital", "high-income", "solo-work", "regular-hours", "science", "microscope-work", "license-required", "precise", "lab-work"], 42, 5) },
  { name: "Psychologist", ...j("healthcare", "A professional who provides therapy and counseling.", ["healthcare", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "caregiving", "mental-health", "talk-therapy", "no-medication"], 58, 3) },
  { name: "Genetic Counselor", ...j("healthcare", "Advises patients on genetic risks and conditions.", ["healthcare", "masters", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "science", "genetics-specialist", "counseling"], 30, 5) },
  { name: "Audiologist", ...j("healthcare", "Specialist in hearing and balance disorders.", ["healthcare", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "science", "hearing-specialist", "instruments", "precise"], 35, 4) },
  { name: "Chiropractor", ...j("healthcare", "Treats musculoskeletal issues through adjustment.", ["healthcare", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "hands-on", "alternative-medicine", "license-required", "manual-dexterity"], 40, 3) },
  { name: "Dietitian", ...j("healthcare", "Advises on nutrition and diet.", ["healthcare", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "science", "nutrition-specialist", "food", "license-required"], 40, 3) },
  { name: "Medical Laboratory Technician", ...j("healthcare", "Runs lab tests on patient samples.", ["healthcare", "certificate", "indoor", "lab", "hospital", "low-income", "solo-work", "regular-hours", "science", "lab-work", "instruments", "precise", "microscope-work"], 35, 4) },
  { name: "Emergency Medical Technician (EMT)", ...j("healthcare", "Provides emergency medical care in the field.", ["healthcare", "certificate", "outdoor", "indoor", "vehicle", "low-income", "shift-work", "night-shift", "on-call", "life-or-death", "high-stress", "physical", "uniform", "people-focused", "caregiving", "dangerous"], 50, 2) },
  { name: "Dental Hygienist", ...j("healthcare", "Cleans teeth and educates patients on oral health.", ["healthcare", "certificate", "indoor", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "precise", "instruments", "manual-dexterity"], 42, 2) },
  { name: "Pharmacy Technician", ...j("healthcare", "Assists pharmacists with dispensing medication.", ["healthcare", "certificate", "indoor", "office", "low-income", "public-facing", "regular-hours", "precise", "license-required"], 35, 3) },
  { name: "Medical Assistant", ...j("healthcare", "Performs clinical and administrative tasks in clinics.", ["healthcare", "certificate", "indoor", "office", "low-income", "public-facing", "regular-hours", "people-focused", "caregiving", "administrative"], 38, 2) },
  { name: "Nursing Assistant", ...j("healthcare", "Provides basic patient care under nurse supervision.", ["healthcare", "certificate", "indoor", "hospital", "low-income", "shift-work", "physical", "people-focused", "caregiving", "hands-on"], 35, 2) },
  { name: "Home Health Aide", ...j("healthcare", "Provides personal care to patients at home.", ["healthcare", "no-degree", "indoor", "outdoor", "vehicle", "low-income", "shift-work", "physical", "people-focused", "caregiving", "hands-on", "driving"], 32, 2) },

  // === TECHNOLOGY & IT ===
  { name: "Network Administrator", ...jj("technology", "industry-technology", "Manages computer networks and infrastructure.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "analytical", "machine-focused", "certification-common"], 52, 3) },
  { name: "Database Administrator", ...jj("technology", "industry-technology", "Manages and maintains database systems.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "solo-work", "regular-hours", "computer", "coding", "analytical", "machine-focused", "data-focused"], 50, 3) },
  { name: "Systems Analyst", ...jj("technology", "industry-technology", "Analyzes and improves IT systems.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "team-work", "regular-hours", "computer", "analytical", "problem-solving"], 48, 3) },
  { name: "Cloud Architect", ...jj("technology", "industry-technology", "Designs cloud computing infrastructure.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "analytical", "machine-focused", "certification-common"], 55, 4) },
  { name: "UX/UI Designer", ...jj("technology", "industry-technology", "Designs user interfaces and experiences.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "medium-income", "team-work", "regular-hours", "computer", "creative", "design-focused", "user-research"], 55, 3) },
  { name: "Game Developer", ...jj("technology", "industry-technology", "Creates video games.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "team-work", "irregular-hours", "computer", "coding", "creative", "gaming-industry"], 52, 3) },
  { name: "Mobile App Developer", ...jj("technology", "industry-technology", "Builds apps for phones and tablets.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "creative"], 50, 3) },
  { name: "Machine Learning Engineer", ...jj("technology", "industry-technology", "Builds ML models and AI systems.", ["technology", "masters", "degree", "indoor", "office", "remote", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "analytical", "math", "research"], 55, 4) },
  { name: "IT Support Specialist", ...jj("technology", "industry-technology", "Provides technical support to users.", ["technology", "certificate", "indoor", "office", "medium-income", "public-facing", "regular-hours", "computer", "problem-solving", "machine-focused"], 45, 2) },
  { name: "Technical Writer", ...jj("technology", "industry-technology", "Writes documentation for technical products.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "medium-income", "solo-work", "regular-hours", "computer", "writing", "creative", "communication"], 40, 3) },
  { name: "Frontend Developer", ...jj("technology", "industry-technology", "Builds the visual side of websites.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "creative", "design-focused"], 55, 2) },
  { name: "Backend Developer", ...jj("technology", "industry-technology", "Builds server-side logic and APIs.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "analytical", "data-focused"], 53, 3) },
  { name: "Full Stack Developer", ...jj("technology", "industry-technology", "Works on both frontend and backend.", ["technology", "bachelors", "degree", "indoor", "office", "remote", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "analytical", "creative"], 58, 3) },
  { name: "QA Tester", ...jj("technology", "industry-technology", "Tests software for bugs and quality.", ["technology", "certificate", "indoor", "office", "remote", "medium-income", "solo-work", "regular-hours", "computer", "analytical", "detail-oriented", "repetitive"], 42, 2) },
  { name: "Product Manager (Tech)", ...jj("technology", "industry-technology", "Manages product development in tech companies.", ["technology", "bachelors", "degree", "indoor", "office", "high-income", "team-work", "regular-hours", "computer", "analytical", "leadership", "client-facing", "problem-solving"], 55, 3) },

  // === BUSINESS & FINANCE ===
  { name: "Financial Analyst", ...jj("business-law", "industry-finance", "Analyzes financial data and trends.", ["finance", "bachelors", "degree", "indoor", "office", "high-income", "solo-work", "regular-hours", "computer", "analytical", "math", "data-focused", "client-facing"], 52, 3) },
  { name: "Marketing Manager", ...jj("business-law", "industry-business", "Manages marketing campaigns and strategy.", ["business", "bachelors", "degree", "indoor", "office", "high-income", "team-work", "regular-hours", "computer", "creative", "leadership", "client-facing", "public-speaking"], 55, 2) },
  { name: "Sales Director", ...jj("business-law", "industry-business", "Leads sales teams and strategy.", ["business", "bachelors", "degree", "indoor", "office", "outdoor", "high-income", "team-work", "irregular-hours", "people-focused", "leadership", "client-facing", "sales", "public-speaking", "frequent-travel"], 55, 2) },
  { name: "Operations Manager", ...jj("business-law", "industry-business", "Oversees daily operations of a business.", ["business", "bachelors", "degree", "indoor", "office", "high-income", "team-work", "regular-hours", "leadership", "problem-solving", "logistics"], 50, 2) },
  { name: "Supply Chain Manager", ...jj("business-law", "industry-business", "Manages supply chain and logistics.", ["business", "bachelors", "degree", "indoor", "office", "high-income", "team-work", "regular-hours", "computer", "analytical", "logistics", "problem-solving"], 45, 3) },
  { name: "Risk Analyst", ...jj("business-law", "industry-finance", "Assesses financial risks for organizations.", ["finance", "bachelors", "degree", "indoor", "office", "high-income", "solo-work", "regular-hours", "computer", "analytical", "math", "data-focused"], 42, 4) },
  { name: "Business Development Manager", ...jj("business-law", "industry-business", "Identifies and pursues new business opportunities.", ["business", "bachelors", "degree", "indoor", "office", "outdoor", "high-income", "team-work", "irregular-hours", "people-focused", "client-facing", "sales", "public-speaking", "frequent-travel"], 48, 3) },
  { name: "Insurance Agent", ...jj("business-law", "industry-finance", "Sells insurance policies to clients.", ["finance", "certificate", "indoor", "office", "medium-income", "public-facing", "client-facing", "irregular-hours", "people-focused", "sales", "license-required"], 42, 2) },
  { name: "Auditor", ...jj("business-law", "industry-finance", "Examines financial records for accuracy.", ["finance", "bachelors", "degree", "indoor", "office", "high-income", "solo-work", "regular-hours", "computer", "analytical", "detail-oriented", "client-facing", "license-required"], 45, 3) },
  { name: "Tax Consultant", ...jj("business-law", "industry-finance", "Advises on tax planning and compliance.", ["finance", "bachelors", "degree", "indoor", "office", "high-income", "client-facing", "regular-hours", "computer", "analytical", "detail-oriented", "seasonal", "license-required"], 42, 3) },
  { name: "Credit Analyst", ...jj("business-law", "industry-finance", "Evaluates creditworthiness of applicants.", ["finance", "bachelors", "degree", "indoor", "office", "medium-income", "solo-work", "regular-hours", "computer", "analytical", "data-focused"], 38, 4) },
  { name: "Investment Advisor", ...jj("business-law", "industry-finance", "Advises clients on investment strategies.", ["finance", "bachelors", "degree", "indoor", "office", "high-income", "client-facing", "regular-hours", "people-focused", "analytical", "license-required"], 45, 3) },

  // === EDUCATION & ACADEMIA ===
  { name: "Education Administrator", ...jj("education", "industry-education", "Manages educational institutions.", ["education", "masters", "degree", "indoor", "office", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "leadership", "administrative", "works-with-children"], 40, 3) },
  { name: "School Principal", ...jj("education", "industry-education", "Leads a school.", ["education", "masters", "degree", "indoor", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "leadership", "administrative", "works-with-children", "public-speaking"], 48, 3) },
  { name: "University Dean", ...jj("education", "industry-education", "Administers a university faculty.", ["education", "doctorate", "degree", "indoor", "school", "high-income", "public-facing", "regular-hours", "people-focused", "leadership", "administrative", "public-speaking", "research"], 40, 5) },
  { name: "Special Education Teacher", ...jj("education", "industry-education", "Teaches students with special needs.", ["education", "bachelors", "degree", "indoor", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "caregiving", "works-with-children", "patience-required", "license-required"], 42, 3) },
  { name: "Curriculum Developer", ...jj("education", "industry-education", "Designs educational curricula.", ["education", "masters", "degree", "indoor", "office", "remote", "medium-income", "solo-work", "team-work", "regular-hours", "computer", "creative", "analytical", "writing"], 35, 4) },
  { name: "Educational Psychologist", ...jj("education", "industry-education", "Studies how people learn.", ["education", "masters", "degree", "indoor", "school", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "science", "research", "mental-health"], 35, 5) },
  { name: "English Teacher", ...jj("education", "industry-education", "Teaches English language and literature.", ["education", "bachelors", "degree", "indoor", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "creative", "public-speaking", "works-with-children", "license-required"], 45, 2) },
  { name: "Math Teacher", ...jj("education", "industry-education", "Teaches mathematics.", ["education", "bachelors", "degree", "indoor", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "analytical", "math", "public-speaking", "works-with-children", "license-required"], 42, 2) },
  { name: "Science Teacher", ...jj("education", "industry-education", "Teaches science subjects.", ["education", "bachelors", "degree", "indoor", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "science", "public-speaking", "works-with-children", "license-required"], 40, 2) },
  { name: "History Teacher", ...jj("education", "industry-education", "Teaches history and social studies.", ["education", "bachelors", "degree", "indoor", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "creative", "writing", "public-speaking", "works-with-children", "license-required"], 38, 2) },
  { name: "Art Teacher", ...jj("education", "industry-education", "Teaches art and creative skills.", ["education", "bachelors", "degree", "indoor", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "creative", "hands-on", "works-with-children", "license-required"], 38, 2) },

  // === CREATIVE & ARTS ===
  { name: "Director", ...jj("arts-media", "industry-arts", "Directs films, TV, or theater.", ["arts", "bachelors", "degree", "indoor", "outdoor", "studio", "variable-income", "team-work", "irregular-hours", "creative", "leadership", "public-speaking", "fame-possible"], 55, 3) },
  { name: "Screenwriter", ...jj("arts-media", "industry-arts", "Writes scripts for film and TV.", ["arts", "no-degree", "indoor", "office", "remote", "variable-income", "solo-work", "irregular-hours", "creative", "writing", "computer"], 42, 3) },
  { name: "Film Editor", ...jj("arts-media", "industry-arts", "Edits film and video footage.", ["arts", "certificate", "indoor", "studio", "office", "variable-income", "solo-work", "irregular-hours", "creative", "computer", "detail-oriented", "sitting"], 40, 3) },
  { name: "Sculptor", ...jj("arts-media", "industry-arts", "Creates three-dimensional art.", ["arts", "no-degree", "indoor", "studio", "variable-income", "solo-work", "irregular-hours", "creative", "hands-on", "manual-dexterity", "physical"], 28, 5) },
  { name: "Composer", ...jj("arts-media", "industry-arts", "Writes original music.", ["arts", "no-degree", "indoor", "studio", "variable-income", "solo-work", "irregular-hours", "creative", "computer", "instruments"], 35, 4) },
  { name: "Music Producer", ...jj("arts-media", "industry-arts", "Produces and oversees music recordings.", ["arts", "no-degree", "indoor", "studio", "variable-income", "team-work", "irregular-hours", "night-shift", "creative", "computer", "instruments", "fame-possible"], 45, 3) },
  { name: "Art Director", ...jj("arts-media", "industry-arts", "Oversees visual style of publications or campaigns.", ["arts", "bachelors", "degree", "indoor", "office", "studio", "medium-income", "team-work", "regular-hours", "creative", "leadership", "design-focused"], 42, 3) },
  { name: "Creative Director", ...jj("arts-media", "industry-arts", "Leads creative vision for agencies or brands.", ["arts", "bachelors", "degree", "indoor", "office", "high-income", "team-work", "irregular-hours", "creative", "leadership", "public-speaking", "client-facing"], 48, 3) },
  { name: "Video Editor", ...jj("arts-media", "industry-arts", "Edits video content for various media.", ["arts", "certificate", "indoor", "office", "studio", "variable-income", "solo-work", "irregular-hours", "creative", "computer", "detail-oriented"], 42, 2) },
  { name: "Motion Graphics Artist", ...jj("arts-media", "industry-arts", "Creates animated graphics and effects.", ["arts", "certificate", "indoor", "office", "remote", "variable-income", "solo-work", "irregular-hours", "creative", "computer", "design-focused"], 38, 4) },
  { name: "Illustrator", ...jj("arts-media", "industry-arts", "Creates drawings for publications and media.", ["arts", "no-degree", "indoor", "studio", "office", "remote", "variable-income", "solo-work", "irregular-hours", "creative", "hands-on", "computer", "manual-dexterity"], 38, 3) },
  { name: "Art Curator", ...jj("arts-media", "industry-arts", "Manages art collections and exhibitions.", ["arts", "masters", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "creative", "analytical", "writing", "people-focused"], 30, 5) },
  { name: "Calligrapher", ...jj("arts-media", "industry-arts", "Creates decorative handwriting and lettering.", ["arts", "no-degree", "indoor", "studio", "variable-income", "solo-work", "irregular-hours", "creative", "hands-on", "manual-dexterity", "precise"], 20, 5) },
  { name: "Landscape Architect", ...jj("arts-media", "industry-arts", "Designs outdoor landscapes and gardens.", ["arts", "bachelors", "degree", "indoor", "outdoor", "medium-income", "client-facing", "regular-hours", "creative", "analytical", "hands-on", "license-required", "design-focused"], 38, 4) },

  // === TRADES & MANUAL LABOR ===
  { name: "Mason", ...jj("trades", "industry-construction", "Builds structures with brick and stone.", ["trades", "certificate", "indoor", "outdoor", "construction-site", "medium-income", "physical", "dangerous", "tools", "hands-on", "manual-dexterity", "heavy-lifting", "license-required"], 35, 3) },
  { name: "Roofer", ...jj("trades", "industry-construction", "Installs and repairs roofs.", ["trades", "certificate", "outdoor", "construction-site", "medium-income", "physical", "dangerous", "tools", "heavy-lifting", "heights", "weather-exposed"], 35, 3) },
  { name: "Painter (Construction)", ...jj("trades", "industry-construction", "Paints buildings and structures.", ["trades", "no-degree", "indoor", "outdoor", "construction-site", "low-income", "physical", "tools", "hands-on", "manual-dexterity"], 35, 2) },
  { name: "Construction Laborer", ...jj("trades", "industry-construction", "Performs general construction work.", ["trades", "no-degree", "outdoor", "construction-site", "low-income", "physical", "dangerous", "tools", "heavy-lifting", "team-work"], 38, 1) },
  { name: "Heavy Equipment Operator", ...jj("trades", "industry-construction", "Operates bulldozers, cranes, and excavators.", ["trades", "certificate", "outdoor", "construction-site", "medium-income", "physical", "dangerous", "machinery", "license-required", "solo-work"], 40, 3) },
  { name: "Forklift Operator", ...jj("trades", "industry-manufacturing", "Operates forklifts in warehouses.", ["trades", "certificate", "indoor", "warehouse", "low-income", "solo-work", "shift-work", "machinery", "license-required", "physical"], 38, 2) },
  { name: "Auto Technician", ...jj("trades", "industry-manufacturing", "Diagnoses and repairs vehicle problems.", ["trades", "certificate", "indoor", "garage", "medium-income", "physical", "dangerous", "tools", "machinery", "vehicles", "manual-dexterity", "solo-work"], 42, 2) },
  { name: "HVAC Technician", ...jj("trades", "industry-construction", "Installs and repairs heating and cooling systems.", ["trades", "certificate", "indoor", "outdoor", "construction-site", "medium-income", "physical", "dangerous", "tools", "license-required", "solo-work", "irregular-hours"], 45, 3) },
  { name: "Locksmith", ...jj("trades", "industry-construction", "Installs and picks locks.", ["trades", "certificate", "indoor", "outdoor", "low-income", "solo-work", "irregular-hours", "tools", "precise", "manual-dexterity", "license-required"], 30, 4) },
  { name: "Glass Installer", ...jj("trades", "industry-construction", "Installs windows and glass panels.", ["trades", "certificate", "indoor", "outdoor", "construction-site", "medium-income", "physical", "dangerous", "tools", "manual-dexterity"], 28, 4) },
  { name: "Flooring Installer", ...jj("trades", "industry-construction", "Installs floors and carpets.", ["trades", "no-degree", "indoor", "construction-site", "medium-income", "physical", "tools", "hands-on", "manual-dexterity", "kneeling"], 30, 3) },
  { name: "Tiler", ...jj("trades", "industry-construction", "Installs tiles on floors and walls.", ["trades", "no-degree", "indoor", "construction-site", "medium-income", "physical", "tools", "hands-on", "manual-dexterity", "precise", "kneeling"], 28, 3) },
  { name: "Gardener", ...jj("trades", "industry-agriculture", "Maintains gardens and plants.", ["trades", "no-degree", "outdoor", "low-income", "physical", "tools", "hands-on", "early-riser", "seasonal", "creative"], 35, 1) },
  { name: "Arborist", ...jj("trades", "industry-agriculture", "Cares for and maintains trees.", ["trades", "certificate", "outdoor", "medium-income", "physical", "dangerous", "tools", "heights", "climbing", "license-required", "early-riser"], 32, 4) },

  // === SERVICE & HOSPITALITY ===
  { name: "Sous Chef", ...jj("arts-media", "industry-hospitality", "Second-in-command in a kitchen.", ["hospitality", "certificate", "indoor", "kitchen", "medium-income", "team-work", "shift-work", "night-shift", "high-stress", "creative", "physical", "hands-on", "food"], 45, 3) },
  { name: "Baker", ...jj("arts-media", "industry-hospitality", "Bakes bread and pastries.", ["hospitality", "no-degree", "indoor", "kitchen", "low-income", "solo-work", "shift-work", "early-riser", "physical", "creative", "hands-on", "food", "precise"], 38, 2) },
  { name: "Barista", ...jj("arts-media", "industry-hospitality", "Prepares coffee drinks.", ["hospitality", "no-degree", "indoor", "low-income", "public-facing", "shift-work", "early-riser", "physical", "creative", "people-focused", "food", "standing"], 40, 1) },
  { name: "Restaurant Manager", ...jj("arts-media", "industry-hospitality", "Manages restaurant operations.", ["hospitality", "certificate", "indoor", "kitchen", "medium-income", "public-facing", "shift-work", "night-shift", "high-stress", "leadership", "team-work", "people-focused", "problem-solving", "food"], 45, 2) },
  { name: "Event Planner", ...jj("arts-media", "industry-hospitality", "Organizes events and celebrations.", ["hospitality", "bachelors", "degree", "indoor", "outdoor", "medium-income", "public-facing", "client-facing", "irregular-hours", "high-stress", "people-focused", "creative", "problem-solving", "weekend-work"], 42, 3) },
  { name: "Wedding Planner", ...jj("arts-media", "industry-hospitality", "Organizes weddings.", ["hospitality", "certificate", "indoor", "outdoor", "medium-income", "public-facing", "client-facing", "irregular-hours", "high-stress", "people-focused", "creative", "weekend-work", "event-planning"], 38, 3) },
  { name: "Caterer", ...jj("arts-media", "industry-hospitality", "Provides food for events.", ["hospitality", "no-degree", "indoor", "kitchen", "outdoor", "variable-income", "team-work", "irregular-hours", "weekend-work", "physical", "food", "hands-on"], 35, 2) },
  { name: "Receptionist", ...jj("arts-media", "industry-hospitality", "Greets visitors and manages front desk.", ["hospitality", "no-degree", "indoor", "office", "low-income", "public-facing", "regular-hours", "people-focused", "administrative", "computer", "phone-work", "sitting"], 38, 1) },
  { name: "Concierge", ...jj("arts-media", "industry-hospitality", "Assists hotel guests with services.", ["hospitality", "no-degree", "indoor", "medium-income", "public-facing", "shift-work", "people-focused", "problem-solving", "local-knowledge", "standing"], 35, 2) },
  { name: "Travel Agent", ...jj("arts-media", "industry-hospitality", "Books travel for clients.", ["hospitality", "certificate", "indoor", "office", "medium-income", "public-facing", "client-facing", "regular-hours", "computer", "people-focused", "phone-work"], 32, 3) },
  { name: "Casino Dealer", ...jj("arts-media", "industry-hospitality", "Operates table games at casinos.", ["hospitality", "certificate", "indoor", "medium-income", "public-facing", "shift-work", "night-shift", "people-focused", "precise", "math", "license-required", "standing"], 30, 4) },
  { name: "Housekeeper", ...jj("arts-media", "industry-hospitality", "Cleans rooms and buildings.", ["hospitality", "no-degree", "indoor", "low-income", "solo-work", "shift-work", "physical", "repetitive", "cleaning", "standing"], 35, 1) },
  { name: "Janitor", ...jj("arts-media", "industry-hospitality", "Maintains cleanliness of buildings.", ["hospitality", "no-degree", "indoor", "low-income", "solo-work", "shift-work", "night-shift", "physical", "repetitive", "cleaning"], 35, 1) },

  // === GOVERNMENT & LAW ENFORCEMENT ===
  { name: "Detective", ...jj("business-law", "industry-government", "Investigates crimes.", ["government", "certificate", "indoor", "outdoor", "medium-income", "public-facing", "shift-work", "dangerous", "high-stress", "people-focused", "uniform", "license-required", "firearm", "problem-solving", "investigative"], 50, 3) },
  { name: "Attorney / Lawyer", ...jj("business-law", "industry-legal", "Practices law and represents clients.", ["legal", "doctorate", "degree", "indoor", "office", "courtroom", "high-income", "public-facing", "client-facing", "regular-hours", "irregular-hours", "high-stress", "analytical", "problem-solving", "license-required", "public-speaking", "writing"], 60, 2) },
  { name: "District Attorney", ...jj("business-law", "industry-legal", "Prosecutes criminal cases.", ["legal", "doctorate", "degree", "indoor", "courtroom", "office", "high-income", "public-facing", "regular-hours", "high-stress", "analytical", "public-speaking", "license-required", "leadership"], 45, 4) },
  { name: "Public Defender", ...jj("business-law", "industry-legal", "Defends those who cannot afford lawyers.", ["legal", "doctorate", "degree", "indoor", "courtroom", "office", "medium-income", "public-facing", "regular-hours", "high-stress", "analytical", "public-speaking", "license-required", "people-focused"], 40, 4) },
  { name: "FBI Agent", ...jj("business-law", "industry-government", "Federal investigative agent.", ["government", "bachelors", "degree", "indoor", "outdoor", "high-income", "dangerous", "high-stress", "shift-work", "uniform", "firearm", "investigative", "physical", "frequent-travel", "people-focused"], 50, 4) },
  { name: "Secret Service Agent", ...jj("business-law", "industry-government", "Protects officials and investigates crimes.", ["government", "bachelors", "degree", "indoor", "outdoor", "high-income", "dangerous", "high-stress", "shift-work", "uniform", "firearm", "physical", "frequent-travel", "protective"], 40, 5) },
  { name: "Border Patrol Agent", ...jj("business-law", "industry-government", "Patrols national borders.", ["government", "bachelors", "degree", "outdoor", "medium-income", "dangerous", "shift-work", "night-shift", "uniform", "firearm", "physical", "vehicle", "solo-work"], 35, 4) },
  { name: "Customs Officer", ...jj("business-law", "industry-government", "Inspects goods at borders.", ["government", "certificate", "indoor", "outdoor", "medium-income", "public-facing", "shift-work", "uniform", "people-focused", "investigative", "standing"], 35, 3) },
  { name: "Embassy Staff", ...jj("business-law", "industry-government", "Works at diplomatic missions abroad.", ["government", "bachelors", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "people-focused", "international", "frequent-travel", "foreign-language", "administrative"], 35, 4) },
  { name: "Intelligence Analyst", ...jj("business-law", "industry-government", "Analyzes intelligence data.", ["government", "bachelors", "degree", "indoor", "office", "high-income", "solo-work", "regular-hours", "analytical", "computer", "investigative", "secret-clearance", "data-focused"], 38, 5) },
  { name: "Correctional Officer", ...jj("business-law", "industry-government", "Supervises inmates in prisons.", ["government", "certificate", "indoor", "medium-income", "dangerous", "shift-work", "night-shift", "uniform", "physical", "people-focused", "high-stress"], 38, 3) },
  { name: "Probation Officer", ...jj("business-law", "industry-government", "Supervises people on probation.", ["government", "bachelors", "degree", "indoor", "outdoor", "vehicle", "medium-income", "public-facing", "regular-hours", "people-focused", "dangerous", "high-stress", "writing", "license-required"], 35, 3) },

  // === SCIENCE & ENGINEERING ===
  { name: "Mechanical Engineer", ...jj("trades", "industry-science", "Designs machines and mechanical systems.", ["science", "bachelors", "degree", "indoor", "office", "lab", "high-income", "team-work", "regular-hours", "computer", "analytical", "math", "problem-solving", "design-focused"], 55, 3) },
  { name: "Electrical Engineer", ...jj("trades", "industry-science", "Designs electrical systems.", ["science", "bachelors", "degree", "indoor", "office", "lab", "high-income", "team-work", "regular-hours", "computer", "analytical", "math", "dangerous", "problem-solving", "design-focused"], 55, 3) },
  { name: "Chemical Engineer", ...jj("trades", "industry-science", "Designs chemical manufacturing processes.", ["science", "bachelors", "degree", "indoor", "lab", "office", "high-income", "team-work", "regular-hours", "computer", "analytical", "science", "dangerous", "problem-solving"], 50, 4) },
  { name: "Petroleum Engineer", ...jj("trades", "industry-science", "Works on oil and gas extraction.", ["science", "bachelors", "degree", "indoor", "outdoor", "high-income", "team-work", "irregular-hours", "computer", "analytical", "dangerous", "oil-industry", "frequent-travel", "field-work"], 45, 4) },
  { name: "Aerospace Engineer", ...jj("trades", "industry-science", "Designs aircraft and spacecraft.", ["science", "bachelors", "degree", "indoor", "office", "lab", "high-income", "team-work", "regular-hours", "computer", "analytical", "math", "problem-solving", "design-focused", "space-industry"], 50, 4) },
  { name: "Environmental Scientist", ...jj("trades", "industry-science", "Studies environmental issues.", ["science", "masters", "degree", "indoor", "outdoor", "lab", "medium-income", "solo-work", "team-work", "regular-hours", "analytical", "science", "field-work", "research", "computer"], 40, 3) },
  { name: "Geologist", ...jj("trades", "industry-science", "Studies rocks and Earth's structure.", ["science", "masters", "degree", "indoor", "outdoor", "lab", "medium-income", "solo-work", "regular-hours", "analytical", "science", "field-work", "research", "physical"], 38, 4) },
  { name: "Meteorologist", ...jj("trades", "industry-science", "Forecasts weather.", ["science", "bachelors", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "computer", "analytical", "science", "public-speaking", "data-focused"], 40, 3) },
  { name: "Physicist", ...jj("trades", "industry-science", "Studies the laws of nature.", ["science", "doctorate", "degree", "indoor", "lab", "office", "medium-income", "solo-work", "regular-hours", "analytical", "science", "math", "research", "computer"], 40, 5) },
  { name: "Microbiologist", ...jj("trades", "industry-science", "Studies microorganisms.", ["science", "masters", "degree", "indoor", "lab", "medium-income", "solo-work", "regular-hours", "analytical", "science", "lab-work", "research", "instruments", "microscope-work", "dangerous"], 35, 5) },
  { name: "Ecologist", ...jj("trades", "industry-science", "Studies ecosystems.", ["science", "masters", "degree", "indoor", "outdoor", "lab", "medium-income", "solo-work", "regular-hours", "analytical", "science", "field-work", "research"], 30, 5) },
  { name: "Oceanographer", ...jj("trades", "industry-science", "Studies oceans and marine environments.", ["science", "doctorate", "degree", "indoor", "outdoor", "lab", "vehicle", "medium-income", "solo-work", "regular-hours", "analytical", "science", "field-work", "research", "swimming", "frequent-travel"], 25, 5) },
  { name: "Paleontologist", ...jj("trades", "industry-science", "Studies fossils.", ["science", "doctorate", "degree", "indoor", "outdoor", "lab", "medium-income", "solo-work", "regular-hours", "analytical", "science", "field-work", "research", "physical"], 25, 5) },
  { name: "Anthropologist", ...jj("trades", "industry-science", "Studies human cultures.", ["science", "masters", "degree", "indoor", "outdoor", "medium-income", "solo-work", "regular-hours", "analytical", "science", "field-work", "research", "writing", "people-focused"], 25, 5) },
  { name: "Sociologist", ...jj("trades", "industry-science", "Studies society and social behavior.", ["science", "masters", "degree", "indoor", "office", "medium-income", "solo-work", "regular-hours", "analytical", "science", "research", "writing", "data-focused"], 25, 5) },

  // === TRANSPORTATION & LOGISTICS ===
  { name: "Bus Driver", ...jj("business-law", "industry-transportation", "Drives buses for public transit.", ["transportation", "certificate", "indoor", "vehicle", "low-income", "public-facing", "shift-work", "early-riser", "solo-work", "license-required", "sedentary", "sitting", "local-travel"], 40, 1) },
  { name: "Taxi Driver", ...jj("business-law", "industry-transportation", "Drives passengers for hire.", ["transportation", "certificate", "indoor", "vehicle", "low-income", "public-facing", "irregular-hours", "night-shift", "solo-work", "license-required", "sedentary", "sitting", "local-travel", "people-focused"], 38, 1) },
  { name: "Dispatcher", ...jj("business-law", "industry-transportation", "Coordinates vehicle schedules and routes.", ["transportation", "certificate", "indoor", "office", "low-income", "solo-work", "shift-work", "night-shift", "computer", "phone-work", "analytical", "high-stress", "problem-solving", "sedentary"], 38, 2) },
  { name: "Warehouse Manager", ...jj("business-law", "industry-manufacturing", "Manages warehouse operations.", ["manufacturing", "bachelors", "degree", "indoor", "warehouse", "medium-income", "team-work", "regular-hours", "computer", "leadership", "logistics", "problem-solving", "physical"], 42, 2) },
  { name: "Package Handler", ...jj("business-law", "industry-manufacturing", "Sorts and loads packages.", ["manufacturing", "no-degree", "indoor", "warehouse", "low-income", "physical", "shift-work", "early-riser", "team-work", "repetitive", "heavy-lifting", "standing"], 35, 1) },

  // === SPORTS & FITNESS ===
  { name: "Personal Trainer", ...jj("trades", "industry-arts", "Trains clients in fitness.", ["arts", "certificate", "indoor", "outdoor", "gym", "medium-income", "public-facing", "client-facing", "irregular-hours", "physical", "people-focused", "license-required", "fitness", "standing"], 45, 1) },
  { name: "Yoga Instructor", ...jj("trades", "industry-arts", "Teaches yoga classes.", ["arts", "certificate", "indoor", "studio", "gym", "variable-income", "public-facing", "irregular-hours", "physical", "people-focused", "flexibility", "creative", "license-required", "fitness"], 40, 2) },
  { name: "Football Player", ...jj("trades", "industry-arts", "Professional football/soccer player.", ["arts", "no-degree", "outdoor", "variable-income", "public-facing", "team-work", "irregular-hours", "physical", "dangerous", "people-focused", "fame-possible", "fitness", "ball-sport", "popular-sport"], 55, 1) },
  { name: "Basketball Player", ...jj("trades", "industry-arts", "Professional basketball player.", ["arts", "no-degree", "indoor", "variable-income", "public-facing", "team-work", "irregular-hours", "physical", "people-focused", "fame-possible", "fitness", "ball-sport", "tall", "popular-sport"], 50, 1) },
  { name: "Coach", ...jj("trades", "industry-arts", "Coaches athletes or teams.", ["arts", "bachelors", "degree", "indoor", "outdoor", "medium-income", "public-facing", "team-work", "irregular-hours", "people-focused", "leadership", "physical", "public-speaking", "fitness"], 45, 2) },
  { name: "Referee", ...jj("trades", "industry-arts", "Officiates sports games.", ["arts", "certificate", "indoor", "outdoor", "variable-income", "public-facing", "irregular-hours", "physical", "people-focused", "high-stress", "license-required", "standing", "quick-decisions"], 35, 3) },
  { name: "Sports Commentator", ...jj("trades", "industry-arts", "Commentates on sports events.", ["arts", "bachelors", "degree", "indoor", "outdoor", "variable-income", "public-facing", "irregular-hours", "people-focused", "public-speaking", "communication", "fame-possible", "sports-knowledge"], 38, 3) },
  { name: "Professional Athlete", ...jj("trades", "industry-arts", "Competes professionally in sports.", ["arts", "no-degree", "indoor", "outdoor", "variable-income", "public-facing", "irregular-hours", "physical", "dangerous", "fame-possible", "fitness", "people-focused", "team-work"], 50, 2) },

  // === MEDIA & JOURNALISM ===
  { name: "Journalist", ...jj("arts-media", "industry-arts", "Reports news and stories.", ["arts", "bachelors", "degree", "indoor", "outdoor", "office", "variable-income", "public-facing", "irregular-hours", "people-focused", "writing", "communication", "public-speaking", "investigative", "frequent-travel", "deadline-pressure"], 48, 2) },
  { name: "News Anchor", ...jj("arts-media", "industry-arts", "Presents news on television.", ["arts", "bachelors", "degree", "indoor", "studio", "medium-income", "public-facing", "irregular-hours", "shift-work", "people-focused", "public-speaking", "communication", "fame-possible", "teleprompter", "appearance-focused"], 45, 2) },
  { name: "Radio Host", ...jj("arts-media", "industry-arts", "Hosts radio shows.", ["arts", "bachelors", "degree", "indoor", "studio", "variable-income", "public-facing", "irregular-hours", "shift-work", "people-focused", "public-speaking", "communication", "voice-focused", "fame-possible"], 38, 2) },
  { name: "Blogger", ...jj("arts-media", "industry-arts", "Writes content for blogs.", ["arts", "no-degree", "indoor", "office", "remote", "variable-income", "solo-work", "irregular-hours", "creative", "writing", "computer", "self-employed", "flexible-hours"], 35, 1) },
  { name: "Editor", ...jj("arts-media", "industry-arts", "Edits written content for publication.", ["arts", "bachelors", "degree", "indoor", "office", "remote", "medium-income", "solo-work", "team-work", "regular-hours", "creative", "writing", "detail-oriented", "computer", "deadline-pressure"], 42, 2) },
  { name: "Copywriter", ...jj("arts-media", "industry-arts", "Writes promotional and marketing copy.", ["arts", "bachelors", "degree", "indoor", "office", "remote", "medium-income", "solo-work", "team-work", "regular-hours", "creative", "writing", "computer", "deadline-pressure", "client-facing"], 42, 2) },
  { name: "Public Relations Specialist", ...jj("arts-media", "industry-arts", "Manages public image of organizations.", ["arts", "bachelors", "degree", "indoor", "office", "medium-income", "public-facing", "client-facing", "regular-hours", "people-focused", "writing", "communication", "public-speaking", "problem-solving", "deadline-pressure"], 42, 2) },
  { name: "Social Media Manager", ...jj("arts-media", "industry-arts", "Manages social media presence.", ["arts", "bachelors", "degree", "indoor", "office", "remote", "medium-income", "solo-work", "team-work", "regular-hours", "creative", "computer", "writing", "analytical", "trends-focused"], 45, 1) },
];

// Additional discriminating questions
const NEW_QUESTIONS: { text: string; tag: string }[] = [
  { text: "Does this job involve working with children?", tag: "works-with-children" },
  { text: "Does this job involve mental health?", tag: "mental-health" },
  { text: "Does this job involve surgery?", tag: "surgical" },
  { text: "Does this job involve prescribing medication?", tag: "prescribes-medication" },
  { text: "Does this job involve lab work?", tag: "lab-work" },
  { text: "Does this job involve writing?", tag: "writing" },
  { text: "Does this job involve public speaking?", tag: "public-speaking" },
  { text: "Does this job involve sales?", tag: "sales" },
  { text: "Does this job involve leadership?", tag: "leadership" },
  { text: "Does this job involve logistics?", tag: "logistics" },
  { text: "Does this job involve fitness?", tag: "fitness" },
  { text: "Does this job involve investigative work?", tag: "investigative" },
  { text: "Does this job involve food preparation?", tag: "food" },
  { text: "Does this job involve design?", tag: "design-focused" },
  { text: "Does this job involve data analysis?", tag: "data-focused" },
  { text: "Does this job involve heights?", tag: "heights" },
  { text: "Does this job involve heavy lifting?", tag: "heavy-lifting" },
  { text: "Does this job involve driving?", tag: "driving" },
  { text: "Does this job involve standing for long periods?", tag: "standing" },
  { text: "Does this job involve sitting for long periods?", tag: "sitting" },
  { text: "Does this job involve using instruments?", tag: "instruments" },
  { text: "Does this job involve using a microscope?", tag: "microscope-work" },
  { text: "Does this job involve working in an operating room?", tag: "operating-room" },
  { text: "Does this job involve firearms?", tag: "firearm" },
  { text: "Does this job involve a uniform?", tag: "uniform" },
  { text: "Does this job involve weekend work?", tag: "weekend-work" },
  { text: "Does this job involve early mornings?", tag: "early-riser" },
  { text: "Does this job involve frequent travel?", tag: "frequent-travel" },
  { text: "Does this job involve being famous?", tag: "fame-possible" },
  { text: "Does this job involve problem-solving?", tag: "problem-solving" },
  { text: "Does this job involve client-facing work?", tag: "client-facing" },
  { text: "Does this job involve manual dexterity?", tag: "manual-dexterity" },
  { text: "Does this job involve foreign languages?", tag: "foreign-language" },
  { text: "Does this job involve creative work?", tag: "creative" },
  { text: "Does this job involve people management?", tag: "team-work" },
  { text: "Is this a government job?", tag: "government" },
  { text: "Does this job involve physical labor?", tag: "physical" },
  { text: "Does this job involve a security clearance?", tag: "secret-clearance" },
  { text: "Does this job involve working in a courtroom?", tag: "courtroom" },
  { text: "Is this a low-paying job?", tag: "low-income" },
  { text: "Does this job involve using tools?", tag: "tools" },
  { text: "Does this job involve machinery?", tag: "machinery" },
  { text: "Does this job involve operating vehicles?", tag: "vehicle" },
  { text: "Does this job involve research?", tag: "research" },
  { text: "Does this job involve math?", tag: "math" },
  { text: "Does this job require working outdoors?", tag: "outdoor" },
  { text: "Does this job involve working in a warehouse?", tag: "warehouse" },
  { text: "Does this job involve working in a kitchen?", tag: "kitchen" },
  { text: "Does this job involve working in a studio?", tag: "studio" },
  { text: "Does this job involve working in a gym?", tag: "gym" },
  { text: "Does this job involve working in a school?", tag: "school" },
  { text: "Does this job involve working in a garage?", tag: "garage" },
];

async function ensureTag(name: string): Promise<{ id: string; slug: string }> {
  const slug = slugify(name);
  const existing = await db.tag.findUnique({ where: { slug } });
  if (existing) return { id: existing.id, slug };
  const created = await db.tag.create({ data: { name, slug } });
  return { id: created.id, slug };
}

async function main() {
  console.log("=== EXPANDING JOBS ===\n");
  const cat = await db.category.findUnique({ where: { slug: "jobs" } });
  if (!cat) { console.error("Jobs category not found!"); process.exit(1); }

  // Add questions
  console.log("Adding questions...");
  let qAdded = 0;
  for (const q of NEW_QUESTIONS) {
    const existing = await db.question.findFirst({ where: { text: q.text } });
    if (existing) continue;
    const tag = await ensureTag(q.tag);
    await db.question.create({ data: { text: q.text, primaryTagId: tag.id, categoryId: cat.id, isActive: true } });
    qAdded++;
  }
  console.log(`  + ${qAdded} questions added`);

  // Add/update jobs
  console.log("\nAdding jobs...");
  let created = 0, updated = 0, skipped = 0;
  for (const job of JOBS) {
    const slug = slugify(job.name);
    const existing = await db.entity.findUnique({ where: { categoryId_slug: { categoryId: cat.id, slug } } });

    // Find subcategory
    let subId: string | null = null;
    if (job.sub) {
      const sub = await db.subcategory.findFirst({ where: { slug: job.sub, categoryId: cat.id } });
      subId = sub?.id ?? null;
    }

    // Build tags (remove industry-healthcare for non-healthcare jobs, deduplicate)
    const tags = [...new Set(job.tags.filter(t => t !== "industry-healthcare" || job.sub === "healthcare"))];
    const tagSlugs: string[] = [];
    const tagIds: string[] = [];
    const seenTagIds = new Set<string>();
    for (const tagName of tags) {
      const tag = await ensureTag(tagName);
      if (seenTagIds.has(tag.id)) continue;
      seenTagIds.add(tag.id);
      tagSlugs.push(tag.slug);
      tagIds.push(tag.id);
    }

    if (existing) {
      // Update: replace tags
      await db.entityTag.deleteMany({ where: { entityId: existing.id } });
      await db.entityTag.createMany({ data: tagIds.map(id => ({ entityId: existing.id, tagId: id, weight: 1 })) });
      await db.entity.update({ where: { id: existing.id }, data: { description: job.description, popularity: job.popularity, difficulty: job.difficulty, tagCache: tagSlugs.join(","), isActive: true } });
      updated++;
    } else {
      await db.entity.create({ data: { name: job.name, slug, description: job.description, categoryId: cat.id, subcategoryId: subId, difficulty: job.difficulty, popularity: job.popularity, tagCache: tagSlugs.join(","), tags: { create: tagIds.map(id => ({ tagId: id, weight: 1 })) } } });
      created++;
    }
  }
  console.log(`  Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);

  const total = await db.entity.count({ where: { categoryId: cat.id, isActive: true } });
  const totalQ = await db.question.count({ where: { categoryId: cat.id, isActive: true } });
  console.log(`\n=== FINAL ===\n  Jobs: ${total}\n  Questions: ${totalQ}`);
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
