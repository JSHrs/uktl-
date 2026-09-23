# Human-review preparation

Four synthetic CV cases: two Construction and two Technology. Each includes a short synthetic source text, parsed profile, curated role and deterministic-score expectation. They exercise full evidence and unknown fields and are regression fixtures, not a representative model-quality benchmark.

A domain reviewer must replace/extend these with approved anonymized representative CVs, run actual extraction/assessment in isolated staging, correct a deliberate extraction error, inspect quotation relevance and score explanations, and record expected versus actual outcomes. Fill reviewer, date, approval and notes only after that review. No reviewer identity or approval has been invented. Keep real CVs and personal data out of GitHub; store authorized evaluation artifacts privately and refer to anonymized case IDs.

Run automated rules checks with `npm run test:unit`. This does not validate the AI provider or satisfy human acceptance by itself.
