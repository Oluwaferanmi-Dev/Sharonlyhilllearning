-- Clean slate: Remove all beginner topics and recreate with 14 complete topics
DELETE FROM public.quiz_questions 
WHERE topic_id IN (
  SELECT id FROM public.assessment_topics 
  WHERE level_id = (SELECT id FROM public.assessment_levels WHERE name = 'Beginner' LIMIT 1)
);

DELETE FROM public.assessment_topics 
WHERE level_id = (SELECT id FROM public.assessment_levels WHERE name = 'Beginner' LIMIT 1);

-- Insert all 14 beginner level topics
INSERT INTO public.assessment_topics (level_id, name, description)
SELECT 
  (SELECT id FROM public.assessment_levels WHERE name = 'Beginner' LIMIT 1) as level_id,
  topic_name, 
  description 
FROM (
  VALUES
    ('Care, Treatment, and Services (CTS)', 'Basic understanding of care treatment and service requirements'),
    ('Environment of Care (EC)', 'Safe and functional healthcare facility environments'),
    ('Emergency Management (EM)', 'Preparedness and response to facility emergencies'),
    ('Human Resources Management (HRM)', 'Staff qualifications, training, and performance management'),
    ('Infection Prevention and Control (IC)', 'Infection prevention practices and protocols'),
    ('Information Management (IM)', 'Patient records, data quality, and confidentiality'),
    ('Leadership (LD)', 'Healthcare facility leadership and governance'),
    ('Life Safety (LS)', 'Building safety, fire prevention, and emergency egress'),
    ('Medication Management (MM)', 'Safe medication storage, handling, and administration'),
    ('National Patient Safety Goals (NPSG)', 'Key patient safety priorities and practices'),
    ('Performance Improvement (PI)', 'Data-driven continuous quality improvement'),
    ('Record of Care, Treatment, and Services (RC)', 'Documentation of patient care and clinical records'),
    ('Rights and Responsibilities of the Individual (RI)', 'Patient rights, informed consent, and ethical treatment'),
    ('Waived Testing (WT)', 'Overview of CLIA waived testing procedures and regulations')
) AS t(topic_name, description);

-- Insert 5 questions per topic (70 total questions for 14 topics)

-- CTS Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Care, Treatment, and Services (CTS)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is the primary goal of care, treatment, and services?', 'To maximize profit', 'To provide safe, effective, and person-centered care', 'To reduce staff hours', 'To avoid legal issues', 'B'),
    ('Which element is essential for person-centered care?', 'Minimizing patient input', 'Focusing on staff preferences', 'Respecting patient preferences and values', 'Standardizing all treatment approaches', 'C'),
    ('What should be included in care planning?', 'Only medical procedures', 'Patient and family involvement', 'Only physician orders', 'Administrative requirements only', 'B'),
    ('How should care be adapted for individual needs?', 'One-size-fits-all approach', 'Based on age only', 'Based on individual assessment and preferences', 'Based on facility protocols only', 'C'),
    ('What is continuity of care?', 'Repeating the same procedures', 'Coordinated care across transitions', 'Limiting patient options', 'Avoiding documentation', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- EC Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Environment of Care (EC)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is the primary purpose of environmental safety?', 'Cost reduction', 'To prevent harm to patients and staff', 'Staff convenience', 'Regulatory compliance only', 'B'),
    ('Which is a key component of a safe physical environment?', 'Clutter in hallways', 'Adequate lighting and clear pathways', 'Broken equipment', 'Minimal cleaning', 'B'),
    ('How often should safety equipment be inspected?', 'Once a year', 'As per manufacturer guidelines', 'Never', 'When problems are noticed', 'B'),
    ('What should be done with hazardous materials?', 'Store anywhere convenient', 'Properly labeled and stored', 'Mixed with other supplies', 'Left in open areas', 'B'),
    ('Which factor is important for infection prevention in the environment?', 'Allowing dust accumulation', 'Regular cleaning and disinfection', 'Minimal ventilation', 'Shared equipment without cleaning', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- EM Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Emergency Management (EM)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is emergency preparedness?', 'Ignoring potential risks', 'Planning and preparing for potential emergencies', 'Only responding after emergencies occur', 'Administrative paperwork only', 'B'),
    ('Which of the following is a key component of an emergency plan?', 'No staff training', 'Communication protocols and evacuation routes', 'Minimal documentation', 'Ignoring high-risk scenarios', 'B'),
    ('How often should emergency drills be conducted?', 'Never', 'Regularly as per regulations', 'Only when required by law', 'At random times', 'B'),
    ('What should be included in an emergency supply kit?', 'Expired medications', 'Current medications, water, first aid supplies', 'Only paperwork', 'Electrical equipment only', 'B'),
    ('Who is responsible for emergency preparedness?', 'Only administrators', 'All staff members', 'Only medical personnel', 'Only security', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- HRM Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Human Resources Management (HRM)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is the primary purpose of staff training?', 'Paperwork compliance', 'To ensure staff competence and patient safety', 'To reduce hiring costs', 'To meet administration preferences', 'B'),
    ('Which is essential for staff credentialing?', 'Experience only', 'Education, training, and verification of qualifications', 'Self-reported credentials', 'Annual reviews only', 'B'),
    ('How should performance be evaluated?', 'Subjective opinions only', 'Objective criteria and regular feedback', 'Never formally evaluated', 'Once at hiring', 'B'),
    ('What should be included in staff files?', 'Personal information only', 'Credentials, training, and performance records', 'Only positive feedback', 'Incomplete documentation', 'B'),
    ('When should mandatory training be completed?', 'Never', 'As per organization requirements', 'Only if requested by staff', 'Optional for some staff', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- IC Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Infection Prevention and Control (IC)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is the first line of defense against infection?', 'Antibiotics only', 'Hand hygiene', 'Isolation precautions', 'PPE only', 'B'),
    ('When should hand hygiene be performed?', 'Only when visibly soiled', 'Before and after patient contact', 'Never', 'At the end of the day', 'B'),
    ('Which is appropriate use of PPE?', 'No PPE needed', 'Select appropriate PPE for the task', 'All PPE at all times', 'PPE optional', 'B'),
    ('How should contaminated items be handled?', 'Mixed with clean items', 'Separately in designated containers', 'Left on work surfaces', 'Shared with others', 'B'),
    ('What should be done with spills?', 'Ignore them', 'Clean and disinfect immediately', 'Cover them up', 'Report only to staff', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- IM Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Information Management (IM)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is patient confidentiality?', 'Sharing patient information freely', 'Protecting patient privacy and health information', 'No need to protect records', 'Avoiding documentation', 'B'),
    ('Who has access to patient records?', 'Anyone who asks', 'Only authorized personnel with legitimate need', 'Public access', 'Staff choice', 'B'),
    ('How long should records be retained?', 'No specific timeframe', 'According to legal requirements', 'Until staff preference', 'Only current records matter', 'B'),
    ('What must be included in medical records?', 'Only positive notes', 'Complete, accurate, and timely documentation', 'Incomplete information', 'Staff opinions only', 'B'),
    ('How should confidential information be disposed of?', 'In regular trash', 'Through secure shredding or destruction', 'Recycling bin', 'Left in open areas', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- LD Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Leadership (LD)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is the role of leadership?', 'Profit maximization only', 'Setting vision and ensuring quality care', 'Avoiding decision-making', 'Staff minimization', 'B'),
    ('Which is essential for effective governance?', 'No oversight', 'Clear policies and accountability', 'Avoiding responsibility', 'Minimal communication', 'B'),
    ('How should leaders handle quality concerns?', 'Ignore them', 'Investigate and address them', 'Blame staff only', 'Deny problems exist', 'B'),
    ('What is the importance of communication in leadership?', 'Minimal information sharing', 'Clear and transparent communication with all levels', 'Only top-down directives', 'No feedback welcome', 'B'),
    ('How should leaders promote safety culture?', 'Ignore safety issues', 'Model safe practices and hold all accountable', 'Blame frontline staff', 'Focus on cost only', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- LS Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Life Safety (LS)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is life safety?', 'General comfort measures', 'Protection of people from fire and other hazards', 'Aesthetics only', 'Furniture arrangement', 'B'),
    ('How should fire extinguishers be maintained?', 'Never checked', 'Inspected regularly per regulations', 'Only when used', 'Never needed', 'B'),
    ('What should staff know about exits?', 'Location is optional', 'Know all emergency exits and routes', 'Only management knows', 'Exits are not important', 'B'),
    ('How often should evacuation routes be reviewed?', 'Never', 'Regularly and before drills', 'Only if there is a fire', 'Once per year', 'B'),
    ('What is the purpose of emergency lighting?', 'Decoration only', 'To provide visibility during emergencies', 'Cost reduction', 'No specific purpose', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- MM Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Medication Management (MM)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is medication management?', 'Ignoring proper procedures', 'Safe handling, storage, and administration of medications', 'Sharing medications', 'Minimal documentation', 'B'),
    ('How should medications be stored?', 'At room temperature anywhere', 'According to manufacturer specifications', 'Mixed together', 'In open areas', 'B'),
    ('What should be checked before administering medication?', 'Nothing', 'Patient identity, medication, and dose', 'Only the patient name', 'Just the medication name', 'B'),
    ('How should expired medications be handled?', 'Use them anyway', 'Properly dispose according to regulations', 'Throw in trash', 'Give to staff', 'B'),
    ('What documentation is required for medications?', 'No documentation needed', 'Complete records of all medications given', 'Optional notes', 'Only significant doses', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- NPSG Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'National Patient Safety Goals (NPSG)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What are National Patient Safety Goals?', 'Optional recommendations', 'Standards to improve patient safety', 'Marketing tools', 'Administrative requirements only', 'B'),
    ('Which is a key patient safety goal?', 'Minimizing communication', 'Correct patient identification', 'Rushing care', 'Limiting staff training', 'B'),
    ('How should medication errors be handled?', 'Ignore them', 'Report and investigate immediately', 'Blame individual staff', 'Hide from administration', 'B'),
    ('What role does communication play in safety?', 'Minimal importance', 'Critical for preventing errors', 'Only for management', 'Not necessary', 'B'),
    ('Why is patient involvement important in safety?', 'Patients should not be involved', 'Patients are partners in their safety', 'Only during emergencies', 'Not their responsibility', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- PI Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Performance Improvement (PI)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is performance improvement?', 'Blaming staff for problems', 'Systematically improving organizational performance', 'One-time fixes', 'Administrative burden', 'B'),
    ('How should data be used for improvement?', 'Ignored', 'To identify problems and measure changes', 'Only for reporting', 'Not applicable', 'B'),
    ('What is the first step in PI?', 'Implementing solutions', 'Identifying opportunities and gathering data', 'Blame assignment', 'Documentation only', 'B'),
    ('How should improvements be measured?', 'By opinion', 'Through objective metrics and outcomes', 'Not necessary', 'Once annually', 'B'),
    ('Who should be involved in improvement efforts?', 'Management only', 'Multidisciplinary teams including frontline staff', 'Senior leadership only', 'No staff input needed', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- RC Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Record of Care, Treatment, and Services (RC)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What is the purpose of medical records?', 'Legal formality only', 'To document care and communicate information', 'Minimal importance', 'Storage only', 'B'),
    ('Who should document care?', 'Only supervisors', 'The staff member providing care', 'Only at shift end', 'Optional', 'B'),
    ('What should be included in documentation?', 'Only positive findings', 'Objective, accurate, and timely information', 'Staff opinions only', 'Incomplete notes', 'B'),
    ('How should corrections be made in records?', 'White-out or erasure', 'With single line-through and initialed', 'Overwrite the original', 'Delete the entry', 'B'),
    ('When should documentation be completed?', 'Days later', 'Immediately or as soon as possible', 'End of week', 'Never timely', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- RI Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Rights and Responsibilities of the Individual (RI)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What are patient rights?', 'Optional considerations', 'Fundamental entitlements to safe and ethical care', 'Administrative burden', 'Only in certain situations', 'B'),
    ('What is informed consent?', 'Proceeding without patient knowledge', 'Patient understanding and agreement to treatment', 'Doctor decision only', 'Assumed agreement', 'B'),
    ('How should patient preferences be handled?', 'Ignore them', 'Respect and incorporate when possible', 'Overrule if inconvenient', 'Not important', 'B'),
    ('What responsibility do patients have?', 'No responsibility', 'To provide accurate information and follow care plans', 'Only financial responsibility', 'Just to comply', 'B'),
    ('How should patient complaints be handled?', 'Ignore or discourage', 'Listen and address respectfully', 'Defensive response', 'Blame the patient', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);

-- WT Questions
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT (SELECT id FROM public.assessment_topics WHERE name = 'Waived Testing (WT)' LIMIT 1),
  question_text, option_a, option_b, option_c, option_d, correct_answer
FROM (
  VALUES
    ('What are CLIA waived tests?', 'All laboratory tests', 'Simple tests approved for healthcare settings with minimal training', 'Complex tests only', 'Unapproved tests', 'B'),
    ('Who can perform waived testing?', 'Anyone without training', 'Authorized personnel with proper training', 'Only doctors', 'Laboratory staff only', 'B'),
    ('How should waived tests be performed?', 'Without instructions', 'Following manufacturer guidelines exactly', 'At staff preference', 'Minimally trained staff', 'B'),
    ('What documentation is needed for waived tests?', 'No documentation', 'Complete records of test performed and results', 'Optional records', 'Only for abnormal results', 'B'),
    ('How often should waived testing be validated?', 'Never', 'Regularly per regulations and manufacturer guidelines', 'Only if inaccurate', 'Once per year only', 'B')
) AS t(question_text, option_a, option_b, option_c, option_d, correct_answer);
