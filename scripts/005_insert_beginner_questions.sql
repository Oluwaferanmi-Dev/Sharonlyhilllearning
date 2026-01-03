-- Insert all beginner level topics with complete Q&A from EDOHERMA standards

-- Fixed CTE scope - use proper subquery to get beginner_level id
INSERT INTO public.assessment_topics (level_id, name, description)
SELECT 
  (SELECT id FROM public.assessment_levels WHERE name = 'Beginner' LIMIT 1) as level_id,
  topic_name, 
  description 
FROM (
  VALUES
    ('Care Treatment & Services (CTS)', 'Basic understanding of care treatment and service requirements'),
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
    ('Record of Care, Treatment, and Services (RC)', 'Documentation of patient care and clinical records')
) AS t(topic_name, description);

-- Removed ON CONFLICT clauses - quiz_questions table has no unique constraint to match

-- CTS Questions
WITH cts_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Care Treatment & Services (CTS)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT cts_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('When a patient first arrives at a facility, what is the most appropriate first step in care, treatment, and services?', 'Give medication immediately', 'Discharge the patient quickly', 'Conduct an initial assessment of the patient''s needs', 'Ask the patient to return another day', 'C'),
    ('Which best describes an individualised plan of care?', 'One generic plan used for all patients', 'A plan based on each patient''s assessment, needs, and preferences', 'A plan focused only on medication prescriptions', 'A plan written only for legal protection', 'B'),
    ('A patient has been treated and is ready to go home. Which action best reflects good CTS practice?', 'Discharge without any instructions', 'Provide clear discharge instructions and follow-up plans', 'Only tell the patient to come back if they feel worse', 'Ask the patient to write their own discharge summary', 'B'),
    ('A child is brought with signs of physical abuse. What should staff do in line with CTS and EDOHERMA expectations?', 'Ignore the signs to avoid trouble', 'Provide care and follow protocols for reporting and protecting the child', 'Send the child home without action', 'Only inform the media', 'B'),
    ('In the EDOHERMA framework, what is the main goal of Care, Treatment, and Services?', 'To maximise hospital revenue', 'To ensure each person receives safe, appropriate, and coordinated care based on their needs', 'To keep patients in hospital as long as possible', 'To reduce the number of staff', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN cts_topic;

-- EC Questions
WITH ec_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Environment of Care (EC)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT ec_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Which situation best shows a safe environment of care?', 'Fire exits blocked by beds and equipment', 'Medicines stored on the floor in patient areas', 'Clear, unobstructed exit routes with visible signs and lighting', 'Electrical wires hanging loosely in corridors', 'C'),
    ('Why is proper waste disposal important in the environment of care?', 'To keep the facility looking attractive only', 'To protect patients, staff, and the community from infection and injury', 'To save space in the store room', 'To reduce paperwork', 'B'),
    ('In a ward, oxygen cylinders are stored near an open flame used for heating. Which is the best description of this situation?', 'Acceptable because oxygen is needed for patients', 'Safe as long as staff are present', 'A serious environment-of-care and fire-safety risk', 'Only a minor housekeeping issue', 'C'),
    ('A facility has broken handwashing sinks in most wards. What does this most directly affect?', 'Patient entertainment', 'Staff uniforms', 'Infection prevention and the safety of the care environment', 'Hospital finances only', 'C'),
    ('Within the EDOHERMA framework, what is the main purpose of monitoring the Environment of Care?', 'To assess interior decoration choices', 'To ensure physical conditions support safe, high-quality care and minimise risk', 'To reduce the number of staff on duty', 'To increase hospital profit', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN ec_topic;

-- EM Questions
WITH em_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Emergency Management (EM)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT em_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Why should every facility have an emergency plan?', 'To show visitors a thick document', 'To ensure staff know what to do during fires, outbreaks, and other emergencies', 'To reduce routine clinic workload', 'To avoid keeping patient records', 'B'),
    ('Which example best shows basic emergency preparedness in a ward?', 'Staff have never practised a drill', 'Fire extinguishers are present, clearly labelled, and staff know how to use them', 'All exit doors are locked to prevent theft', 'Emergency exits are hidden behind cupboards', 'B'),
    ('A facility is in an area prone to flooding. What should be included in its emergency planning?', 'A policy for staff dress during rain', 'Arrangements to protect critical services and move patients if areas flood', 'A rule to close the facility at the first sign of rain', 'A requirement that patients provide their own rescue boats', 'B'),
    ('During a fire alarm drill, some staff do not know where the nearest exit is. What does this show about emergency management?', 'Drills are unnecessary', 'The emergency plan is perfect', 'Staff training and communication about emergency routes are inadequate', 'Patients should lead the evacuation', 'C'),
    ('In the EDOHERMA framework, what is the main goal of Emergency Management in health facilities?', 'To avoid media coverage of incidents', 'To ensure facilities can protect lives and continue essential services during and after emergencies', 'To reduce the number of inspections', 'To shorten outpatient queues', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN em_topic;

-- HRM Questions
WITH hrm_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Human Resources Management (HRM)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT hrm_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Why is it important for each staff member to have a written job description?', 'To decorate the HR office', 'To clearly define duties and required qualifications for the role', 'To increase staff workload', 'To help staff choose their own tasks', 'B'),
    ('Before a nurse starts work in a facility, what HR action is most important?', 'Asking about favourite colour', 'Verifying licence and required qualifications', 'Checking social media', 'Asking the nurse to design the uniform', 'B'),
    ('What is the main purpose of staff orientation?', 'To introduce staff to the canteen', 'To familiarise staff with policies, safety procedures, and their roles', 'To decide who gets the best office', 'To reduce the number of meetings', 'B'),
    ('A facility never evaluates staff performance. Which HRM concept is being missed?', 'Staff uniforms', 'Ongoing performance appraisal', 'Holiday schedule', 'Parking allocation', 'B'),
    ('In the EDOHERMA framework, Human Resources Management mainly aims to:', 'Reduce salaries', 'Ensure the right number of competent staff are in the right roles', 'Limit staff training', 'Remove written policies', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN hrm_topic;

-- IC Questions
WITH ic_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Infection Prevention and Control (IC)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT ic_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Which action best prevents spread of infection between patients?', 'Wearing the same gloves for all patients', 'Regular hand hygiene before and after patient contact', 'Eating in the treatment room', 'Re-using needles after boiling', 'B'),
    ('Used needles should be disposed of:', 'In open dustbins', 'On the floor', 'In puncture-resistant sharps containers', 'In regular office wastebags', 'C'),
    ('A coughing patient with suspected TB is placed in a crowded waiting area with closed windows. What is the main IC concern?', 'Noise', 'Increased risk of spreading airborne infection', 'Cost of chairs', 'Lighting', 'B'),
    ('Why is regular cleaning of frequently touched surfaces important?', 'Only to improve appearance', 'To reduce contamination and infection risk', 'To make work for cleaners', 'To reduce number of visitors', 'B'),
    ('In EDOHERMA''s framework, Infection Prevention and Control mainly ensures that:', 'Only visitors wash hands', 'Systems are in place to reduce infections for patients, staff, and community', 'Staff never wear protective equipment', 'Wards are always air-conditioned', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN ic_topic;

-- IM Questions
WITH im_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Information Management (IM)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT im_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Which statement about patient records is most correct?', 'Anyone can read them', 'They must be accurate, legible, and kept confidential', 'They should be written in pencil', 'They are optional', 'B'),
    ('A facility frequently sends monthly data with obvious errors. Which IM issue is this?', 'Parking', 'Data quality and accuracy', 'Staff uniforms', 'Canteen prices', 'B'),
    ('Why is it important to back up electronic health records?', 'To increase electricity costs', 'To ensure records are not lost if systems fail', 'To slow down care', 'To reduce confidentiality', 'B'),
    ('Patient records left open on a desk where anyone can see them mainly violate:', 'Interior design rules', 'Privacy and confidentiality requirements', 'Uniform policy', 'Visitor policy', 'B'),
    ('In EDOHERMA''s framework, Information Management ensures that:', 'Data is collected but never used', 'Reliable information supports safe care and effective regulation', 'Only paper records are allowed', 'Only managers see data', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN im_topic;

-- LD Questions
WITH ld_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Leadership (LD)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT ld_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Which behaviour best shows good facility leadership for safety?', 'Ignoring staff reports of hazards', 'Encouraging staff to report safety concerns without fear', 'Hiding problems from EDOHERMA', 'Blaming staff for all incidents', 'B'),
    ('Why should leaders review inspection and performance reports regularly?', 'To prepare for media interviews', 'To identify problems and drive improvements in services', 'Only to defend against complaints', 'To reduce number of staff', 'B'),
    ('A facility has no clear person in charge. What leadership issue does this create?', 'Better teamwork', 'Confusion about roles and accountability', 'Fewer meetings', 'Lower electricity bills', 'B'),
    ('Leaders who only focus on finances and ignore quality mainly fail in which area?', 'Marketing', 'Safety and quality of care', 'Building design', 'Staff uniforms', 'B'),
    ('In the EDOHERMA framework, the main role of Leadership is to:', 'Approve staff uniforms', 'Set direction, support a safety culture, and ensure compliance with standards', 'Avoid contact with regulators', 'Write all patient notes', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN ld_topic;

-- LS Questions
WITH ls_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Life Safety (LS)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT ls_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Which practice is safest for life safety?', 'Locking all exit doors during working hours', 'Keeping exits clear and unlocked for quick escape', 'Storing boxes in exit corridors', 'Painting over exit signs', 'B'),
    ('Fire extinguishers should be:', 'Hidden in the store', 'Available, clearly marked, and regularly checked', 'Locked away at night', 'Used as doorstops', 'B'),
    ('Over-crowding wards with beds blocking passageways mainly affects:', 'Staff uniforms', 'Ability to evacuate safely in an emergency', 'Food supply', 'Record storage', 'B'),
    ('Why should facilities avoid using open flames near oxygen?', 'It wastes oxygen', 'It creates a serious fire and explosion risk', 'It makes the room too hot', 'It increases electricity bills', 'B'),
    ('In EDOHERMA''s framework, Life Safety primarily focuses on:', 'Office decoration', 'Protecting lives by ensuring buildings and systems are safe in emergencies', 'Staff scheduling', 'Ambulance colours', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN ls_topic;

-- MM Questions
WITH mm_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Medication Management (MM)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT mm_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Which is the safest way to store medicines on a ward?', 'On open tables where anyone can reach them', 'In locked, organised cupboards with expiry checks', 'Mixed with cleaning products', 'In staff handbags', 'B'),
    ('What should staff do if they find expired medicines?', 'Use them if they look fine', 'Remove them from stock and follow facility policy for disposal', 'Mix them with new stock', 'Give them only to staff', 'B'),
    ('Before giving a medicine, staff should first verify:', 'Patient''s favourite food', 'Right patient, right medicine, right dose, right route, and right time', 'Colour of the tablet', 'Patient''s religion', 'B'),
    ('High-alert medications (e.g., concentrated electrolytes) should be:', 'Stored anywhere on general wards', 'Managed with extra precautions such as clear labelling and restricted access', 'Given without checking dose', 'Avoided completely', 'B'),
    ('In the EDOHERMA framework, Medication Management mainly aims to:', 'Increase drug sales', 'Ensure medicines are used safely and effectively to benefit patients', 'Reduce the number of prescriptions recorded', 'Allow anyone to dispense drugs', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN mm_topic;

-- NPSG Questions
WITH npsg_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'National Patient Safety Goals (NPSG)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT npsg_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('Which practice supports safe patient identification?', 'Asking only "Are you Mr. Okon?"', 'Using at least two identifiers, like full name and date of birth', 'Identifying patients by bed number alone', 'Recognising patients only by face', 'B'),
    ('To improve communication about critical lab results, staff should:', 'Never call the result', 'Use read-back when results are communicated', 'Only send written notes hours later', 'Ask patients to tell the doctor', 'B'),
    ('A common safety goal related to infection is to:', 'Reduce nutrition', 'Improve hand hygiene and infection prevention practices', 'Increase visiting hours', 'Reduce number of sinks', 'B'),
    ('Why are safety goals used in facilities?', 'To increase paperwork only', 'To focus attention on high-risk areas and prevent harm', 'To replace all other standards', 'To decide staff uniforms', 'B'),
    ('In the EDOHERMA framework, National Patient Safety Goals mainly help facilities to:', 'Compete with each other', 'Target key safety risks with specific, measurable actions', 'Reduce the number of inspections', 'Decide building colours', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN npsg_topic;

-- PI Questions
WITH pi_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Performance Improvement (PI)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT pi_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('A facility counts monthly infection cases and draws a simple chart. This is an example of:', 'Marketing', 'Performance measurement', 'Staff discipline', 'Decoration', 'B'),
    ('After noticing long waiting times, what is the next PI step?', 'Ignore the problem', 'Analyse causes and test simple changes to improve flow', 'Blame patients', 'Close the clinic', 'B'),
    ('Why should staff involved in care see performance data (e.g., charts on hand hygiene)?', 'To punish them', 'To help them understand performance and support improvements', 'To decide uniforms', 'To reduce salaries', 'B'),
    ('If a facility collects data but never acts on it, which PI element is missing?', 'Measurement', 'Use of data for improvement', 'Staff uniforms', 'Accreditation', 'B'),
    ('In EDOHERMA''s framework, Performance Improvement supports:', 'Random changes without data', 'Continuous, data-driven efforts to improve safety and quality', 'Reducing documentation of errors', 'Avoiding inspections', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN pi_topic;

-- RC Questions
WITH rc_topic AS (
  SELECT id FROM public.assessment_topics 
  WHERE name = 'Record of Care, Treatment, and Services (RC)' LIMIT 1
)
INSERT INTO public.quiz_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT rc_topic.id, question, opt_a, opt_b, opt_c, opt_d, correct FROM (
  VALUES
    ('The main purpose of the clinical record is to:', 'Store old papers', 'Show what care was provided and support coordination and continuity', 'Document only errors', 'Provide material for lawsuits', 'B'),
    ('When a patient is transferred to another department, the clinical record should:', 'Be left behind', 'Accompany the patient so care continues without interruption', 'Be destroyed', 'Be archived immediately', 'B'),
    ('A clinical record without clear dates and times for care provided mainly affects:', 'Office cleanliness', 'Continuity and quality of care, and medico-legal protection', 'Cafeteria quality', 'Staff parking', 'B'),
    ('If a clinical note is incomplete or incorrect, the best action is to:', 'Write over the mistake', 'Cross out and initial the entry, then write the correct information with date and time', 'Throw away the form', 'Ignore it', 'B'),
    ('In EDOHERMA''s framework, Records of Care, Treatment, and Services mainly ensure:', 'Papers fill the filing room', 'Accurate information is documented, accessible, and protects continuity of care', 'Fewer records are kept', 'Only doctors write notes', 'B')
) AS t(question, opt_a, opt_b, opt_c, opt_d, correct)
CROSS JOIN rc_topic;
