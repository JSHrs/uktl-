-- Seed data — illustrative leads & candidates so the dashboard looks alive on first run.
-- Idempotent via INSERT OR IGNORE on stable IDs.

INSERT OR IGNORE INTO leads
  (id, created_at, updated_at, name, company, email, phone, service, message, score, priority, status)
VALUES
  ('lead_seed_001', 1714262400000, 1714262400000,
   'Sarah Mitchell', 'Meridian Logistics Ltd', 's.mitchell@meridian.co.uk', '07712 334 891',
   'HR Consultancy',
   'We''re a logistics company of 85 staff and need an HR audit plus updated employment contracts following recent tribunal changes.',
   92, 'High', 'New'),

  ('lead_seed_002', 1714176000000, 1714176000000,
   'James Okafor', 'Okafor & Partners', 'james@okaforpartners.com', '07845 221 003',
   'Employment Law',
   'One of our employees is claiming unfair dismissal. Need urgent legal guidance before the ET1 deadline next week.',
   88, 'High', 'Contacted'),

  ('lead_seed_003', 1714089600000, 1714089600000,
   'Priya Sharma', 'NovaTech Solutions', 'priya.sharma@novatech.io', '07920 441 772',
   'Recruitment',
   'Looking to hire 3 senior software engineers and a Head of Product. Middle East expansion coming in Q3.',
   79, 'Medium', 'Qualified'),

  ('lead_seed_004', 1714003200000, 1714003200000,
   'Tom Westbury', 'Self-employed', 'tomwestbury@gmail.com', '07633 118 200',
   'Employment Law',
   'Hi just wondering if you can help with IR35 question for my contract',
   34, 'Low', 'New'),

  ('lead_seed_005', 1713916800000, 1713916800000,
   'Aisha Nkrumah', 'Atlas Property Group', 'a.nkrumah@atlasproperty.co.uk', '07789 554 321',
   'HR Consultancy',
   'We''re scaling from 30 to 90 staff over 18 months and need an outsourced HR partner to build the people infrastructure.',
   96, 'High', 'Proposal Sent');

INSERT OR IGNORE INTO candidates
  (id, created_at, updated_at, name, role, client, email, stage, score, notes)
VALUES
  ('cand_seed_001', 1713571200000, 1713571200000,
   'David Chen', 'Head of Finance', 'Atlas Property Group', 'd.chen@email.com',
   'Shortlisted', 88,
   'Strong CFO background, 12 yrs PE-backed firms. Slight overqualified concern.'),

  ('cand_seed_002', 1713744000000, 1713744000000,
   'Fatima Al-Rashid', 'HR Director', 'Meridian Logistics Ltd', 'fatima.ar@email.com',
   'Interview', 94,
   'Exceptional. CIPD Level 7, logistics sector specific. Recommend fast-track.'),

  ('cand_seed_003', 1714003200000, 1714003200000,
   'Marcus Thompson', 'Senior Engineer', 'NovaTech Solutions', 'm.thompson@email.com',
   'Sourced', 71,
   'React/Node stack matches. 5yrs exp. Available immediately.'),

  ('cand_seed_004', 1713916800000, 1713916800000,
   'Zara Patel', 'Senior Engineer', 'NovaTech Solutions', 'zara.p@email.com',
   'Shortlisted', 82,
   'Strong TypeScript, AWS certified. Notice period 3 months.'),

  ('cand_seed_005', 1713398400000, 1713398400000,
   'Oliver Hughes', 'Head of Finance', 'Atlas Property Group', 'o.hughes@email.com',
   'Rejected', 58,
   'Gaps in PE experience. Not progressing.'),

  ('cand_seed_006', 1713830400000, 1713830400000,
   'Kenji Watanabe', 'Head of Product', 'NovaTech Solutions', 'k.watan@email.com',
   'Offer', 91,
   'Outstanding product sense, shipped 3 B2B SaaS products. Client loved him.');

INSERT OR IGNORE INTO content_items
  (id, created_at, title, type, tone, content, word_count, published)
VALUES
  ('cont_seed_001', 1713571200000,
   'IR35 in 2026: What UK Contractors Must Know',
   'Blog Article', 'Professional & Authoritative',
   '# IR35 in 2026: What UK Contractors Must Know\n\nThe IR35 rules continue to shape how contractors operate in the UK...',
   1240, 1),

  ('cont_seed_002', 1713139200000,
   '5 Signs Your Business Needs an HR Audit',
   'Blog Article', 'Approachable & Plain-English',
   '# 5 Signs Your Business Needs an HR Audit\n\nMany growing businesses underestimate when their HR function needs review...',
   980, 1),

  ('cont_seed_003', 1712707200000,
   'Redundancy Process: A Step-by-Step Guide',
   'LinkedIn Post', 'Thought Leadership',
   'Redundancy is one of the most challenging processes employers face...',
   310, 1);
