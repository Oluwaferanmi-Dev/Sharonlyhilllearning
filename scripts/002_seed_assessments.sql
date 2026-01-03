-- Insert Assessment Levels
INSERT INTO public.assessment_levels (name, order_index, description, price, requires_payment)
VALUES
  ('Beginner', 1, 'Foundation level assessment covering basic healthcare regulation concepts', 100.00, true),
  ('Intermediate', 2, 'Intermediate level assessment for advanced understanding', 150.00, true),
  ('Advanced', 3, 'Advanced level assessment for expert-level knowledge', 200.00, true)
ON CONFLICT DO NOTHING;

-- Insert Topics for Beginner Level
WITH beginner_level AS (
  SELECT id FROM public.assessment_levels WHERE name = 'Beginner' LIMIT 1
)
INSERT INTO public.assessment_topics (level_id, name, description)
SELECT beginner_level.id, topic_name, description FROM (
  VALUES
    ('Care Treatment & Services (CTS)', 'Basic understanding of care treatment and service requirements'),
    ('Emergency Management (EM)', 'Fundamentals of emergency preparedness and response'),
    ('Patient Safety Standards', 'Core patient safety protocols and standards'),
    ('Staff Qualifications', 'Required staff qualifications and certifications'),
    ('Infection Control', 'Basic infection prevention and control measures')
) AS t(topic_name, description)
CROSS JOIN beginner_level
ON CONFLICT DO NOTHING;

-- Insert sample questions for first Beginner topic
WITH beginner_cts AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Care Treatment & Services (CTS)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT beginner_cts.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Which of the following is a core component of quality care?', 'Patient dignity and respect', 'Minimal documentation', 'Quick turnaround time', 'Cost reduction', 'A'),
    ('What should a healthcare facility do when a patient complaint is received?', 'Ignore if not serious', 'Document and investigate', 'Dismiss without review', 'Report only to management', 'B'),
    ('Which regulatory body oversees healthcare standards in most regions?', 'Finance department', 'Ministry of Health', 'Local market', 'Staff union', 'B'),
    ('What is the primary goal of care treatment standards?', 'Maximize profits', 'Ensure patient safety and quality', 'Reduce staffing', 'Minimize documentation', 'B'),
    ('How often should healthcare facilities review their care protocols?', 'Never', 'Annually at minimum', 'Only when required', 'Every 10 years', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN beginner_cts
ON CONFLICT DO NOTHING;
