"""
Creates baseline medical knowledge text files for all 10 specialist RAG collections.
Run this instead of (or in addition to) download_sources.py when Wikipedia is unavailable.
Usage: python scripts/create_sample_data.py
"""
from pathlib import Path

DATA = {
    "general_practitioner": """
COMMON COLD
The common cold is a viral infection of the upper respiratory tract. Rhinoviruses are the most common cause, responsible for up to 50% of cases. Symptoms include runny nose, nasal congestion, sneezing, sore throat, cough, and mild fever. The average adult gets 2-3 colds per year. Treatment is supportive: rest, fluids, and over-the-counter medications for symptom relief. Antibiotics are ineffective against viral infections.

INFLUENZA (FLU)
Influenza is a contagious respiratory illness caused by influenza viruses. Symptoms include sudden onset of fever (38-40°C), chills, headache, muscle aches, fatigue, dry cough, sore throat, and runny nose. Influenza can lead to serious complications including pneumonia, especially in the elderly, young children, and immunocompromised individuals. Annual vaccination is the most effective prevention. Antiviral medications (oseltamivir, zanamivir) can reduce severity if taken within 48 hours of symptom onset.

FEVER
Fever is defined as a body temperature above 38°C (100.4°F). It is a natural immune response to infection. Common causes include viral and bacterial infections, inflammatory conditions, and certain medications. Treatment depends on cause and severity. Antipyretics such as acetaminophen or ibuprofen reduce fever. In children, fever above 38°C in infants under 3 months requires immediate medical attention. Seek medical care for fevers above 39.4°C, lasting more than 3 days, or accompanied by severe symptoms.

HYPERTENSION (HIGH BLOOD PRESSURE)
Hypertension is defined as blood pressure consistently at or above 130/80 mmHg. It affects approximately 1.3 billion people worldwide. Risk factors include age, obesity, sedentary lifestyle, high sodium diet, alcohol consumption, stress, smoking, and family history. Hypertension is the leading risk factor for heart disease and stroke. Lifestyle modifications (weight loss, DASH diet, exercise, reduced sodium, limiting alcohol) are first-line treatment. Medications include ACE inhibitors, ARBs, calcium channel blockers, and diuretics. Regular monitoring is essential.

DIABETES MELLITUS
Diabetes mellitus is a group of metabolic diseases characterized by high blood sugar. Type 1 diabetes is an autoimmune condition where the pancreas produces little or no insulin. Type 2 diabetes results from insulin resistance and is strongly associated with obesity. Symptoms include polyuria (frequent urination), polydipsia (excessive thirst), polyphagia (excessive hunger), fatigue, and blurred vision. Diagnosis by fasting blood glucose ≥126 mg/dL or HbA1c ≥6.5%. Management includes lifestyle changes, metformin (first-line for Type 2), and insulin therapy. Complications include neuropathy, nephropathy, retinopathy, and cardiovascular disease.

OBESITY
Obesity is defined as BMI ≥30 kg/m². It is a chronic disease associated with numerous health complications including type 2 diabetes, cardiovascular disease, sleep apnea, osteoarthritis, and certain cancers. Contributing factors include genetics, diet, physical inactivity, sleep deprivation, medications, and endocrine disorders. Treatment involves caloric restriction, increased physical activity, behavioral therapy, and in appropriate cases, pharmacotherapy or bariatric surgery. The goal is sustained 5-10% weight loss for meaningful health benefits.

PREVENTIVE HEALTHCARE
Preventive care includes screenings, vaccinations, and counseling to prevent disease and detect conditions early. Key screenings: blood pressure (adults), cholesterol (adults over 35), colorectal cancer (50+), breast cancer (mammography 40+), cervical cancer (Pap smear 21-65), diabetes screening (overweight adults). Adult vaccines include influenza (annual), COVID-19, Tdap, pneumococcal (65+), shingles (50+). Lifestyle counseling covers smoking cessation, alcohol use, diet, and exercise.

FATIGUE
Fatigue is persistent tiredness not relieved by rest. Common causes include anemia, thyroid disorders, diabetes, depression, sleep disorders (sleep apnea, insomnia), chronic infections, heart failure, and medications. Evaluation includes CBC, metabolic panel, thyroid function, iron studies. Red flags requiring urgent evaluation: fatigue with chest pain, dyspnea, unexplained weight loss, or lymphadenopathy. Treatment depends on underlying cause.

HEADACHE
Primary headaches: tension-type (most common, bilateral pressure/tightening), migraine (unilateral, throbbing, with aura), and cluster headaches (severe, unilateral, periorbital). Secondary headaches are caused by underlying conditions. Warning signs (thunderclap onset, worst headache of life, fever/stiff neck, neurological deficits, papilledema) require emergency evaluation. Tension headaches respond to NSAIDs, acetaminophen. Migraine treatment: triptans, NSAIDs, anti-nausea medications, preventive therapy (beta-blockers, topiramate, amitriptyline).

BODY MASS INDEX
BMI = weight (kg) / height (m)². Classification: Underweight <18.5, Normal 18.5-24.9, Overweight 25-29.9, Obese ≥30. BMI is a screening tool; waist circumference provides additional risk information. Health risks increase significantly with BMI >30. Limitations: doesn't differentiate muscle from fat, may underestimate risk in individuals with high muscle mass.
""",

    "cardiologist": """
HEART ATTACK (MYOCARDIAL INFARCTION)
A myocardial infarction occurs when coronary blood flow is blocked, causing cardiac muscle death. Symptoms: chest pain/pressure radiating to arm, jaw, or back; shortness of breath; sweating; nausea; light-headedness. Women may have atypical symptoms. Call emergency services immediately. Treatment: aspirin, nitroglycerin, PCI (percutaneous coronary intervention) or thrombolysis, anticoagulants. After MI: beta-blockers, ACE inhibitors, statins, antiplatelet therapy. Lifestyle: quit smoking, cardiac rehabilitation, heart-healthy diet.

HEART FAILURE
Heart failure occurs when the heart cannot pump enough blood to meet the body's needs. Types: HFrEF (reduced ejection fraction, <40%) and HFpEF (preserved EF, ≥50%). Symptoms: dyspnea on exertion, orthopnea, paroxysmal nocturnal dyspnea, peripheral edema, fatigue. Causes: coronary artery disease, hypertension, cardiomyopathy, valvular disease. NYHA Classification I-IV rates severity. Treatment: ACE inhibitors/ARBs/ARNIs, beta-blockers, diuretics, MRAs, SGLT2 inhibitors. Lifestyle: sodium restriction (<2g/day), fluid restriction, daily weights.

ATRIAL FIBRILLATION
AFib is the most common cardiac arrhythmia, characterized by irregular, rapid heart rate (100-175 bpm). Risk factors: age, hypertension, heart failure, coronary artery disease, sleep apnea, thyroid disease. Symptoms: palpitations, fatigue, shortness of breath, dizziness, chest discomfort. Some patients are asymptomatic. Complications: stroke (5x increased risk). Management: rate control (beta-blockers, calcium channel blockers), rhythm control (cardioversion, antiarrhythmics), anticoagulation (direct oral anticoagulants - apixaban, rivaroxaban, dabigatran). CHA₂DS₂-VASc score guides anticoagulation.

CORONARY ARTERY DISEASE
CAD results from atherosclerotic plaque buildup in coronary arteries. Risk factors: hypertension, diabetes, dyslipidemia, smoking, obesity, sedentary lifestyle, family history, age, male sex. Stable angina: chest pain with exertion, relieved by rest or nitrates. Diagnosis: ECG, stress test, coronary angiography, CT angiography. Treatment: lifestyle modification, aspirin, statins, beta-blockers, nitrates, calcium channel blockers, ACE inhibitors. Revascularization: PCI (stenting) or CABG (bypass surgery) for severe disease.

CHOLESTEROL AND DYSLIPIDEMIA
Normal values: Total cholesterol <200 mg/dL, LDL <100 mg/dL (high risk <70 mg/dL), HDL >40 mg/dL (men) >50 mg/dL (women), Triglycerides <150 mg/dL. High LDL causes atherosclerosis. Low HDL is an independent risk factor. Treatment: dietary changes (reduce saturated fat, trans fat, dietary cholesterol), exercise, statins (first-line), ezetimibe, PCSK9 inhibitors for high-risk patients. Target LDL based on cardiovascular risk.

HYPERTENSION CARDIAC EFFECTS
Chronic hypertension causes left ventricular hypertrophy, diastolic dysfunction, heart failure, and accelerated atherosclerosis. BP targets: general <130/80 mmHg, elderly may be higher. Ambulatory monitoring for white coat hypertension. Hypertensive crisis: BP >180/120 with organ damage - neurological symptoms, chest pain, renal failure. Hypertensive urgency: BP >180/120 without organ damage.

ARRHYTHMIAS
Bradyarrhythmias (HR <60): sinus bradycardia, heart blocks. Treatment: atropine, pacemaker. Tachyarrhythmias (HR >100): SVT, VT, VF. SVT: vagal maneuvers, adenosine, cardioversion. Ventricular fibrillation: immediate defibrillation. Palpitations evaluation: ECG, Holter monitor, event recorder, electrophysiology study.

CARDIAC CHEST PAIN
Typical: pressure, squeezing, burning, heaviness in chest. Radiation to left arm, jaw, neck. Associated with exertion, emotional stress. Atypical: epigastric pain, dyspnea alone. Differential: GERD, musculoskeletal, pleuritis, PE, aortic dissection, anxiety. ACS workup: serial ECGs, troponins. TIMI/GRACE risk scores guide management.
""",

    "orthopedist": """
OSTEOARTHRITIS
Osteoarthritis (OA) is the most common joint disease, characterized by cartilage degradation and bone changes. Affects mainly knee, hip, hand, and spine. Risk factors: age, obesity, previous joint injury, overuse, genetics. Symptoms: joint pain worsened by activity, stiffness after inactivity (morning stiffness <30 min), crepitus, reduced range of motion, joint enlargement. X-ray findings: joint space narrowing, osteophytes, subchondral sclerosis. Treatment: weight loss, exercise (aquatic, low-impact), physical therapy, acetaminophen, NSAIDs, intraarticular corticosteroids, hyaluronic acid injections. Severe: joint replacement.

BACK PAIN
Low back pain affects 80% of adults at some point. Mechanical (most common): muscle strain, disc herniation, facet arthropathy, spinal stenosis. Red flags requiring immediate evaluation: saddle anesthesia, bowel/bladder dysfunction (cauda equina), fever/weight loss (infection/malignancy), history of cancer, trauma, progressive neurological deficits. Disc herniation: sharp, radiating pain (sciatica) along dermatome. Treatment: NSAIDs, acetaminophen, muscle relaxants, physical therapy, epidural steroid injections. Surgery for failed conservative treatment.

KNEE PAIN
Common causes: osteoarthritis, meniscal tears, ligament injuries (ACL, MCL), patellofemoral pain syndrome, bursitis, tendinopathy. ACL tear: "pop" during injury, instability, hemarthrosis. Meniscal tear: joint line tenderness, locking, clicking. Evaluation: physical exam (Lachman, McMurray, varus/valgus stress tests), X-ray, MRI. Treatment: RICE (Rest, Ice, Compression, Elevation), NSAIDs, physical therapy, knee brace, arthroscopy, joint replacement.

OSTEOPOROSIS
Osteoporosis is characterized by low bone density (T-score ≤-2.5) and increased fracture risk. Risk factors: female sex, menopause, age, low body weight, smoking, excessive alcohol, corticosteroid use, low calcium/vitamin D. DEXA scan for diagnosis. Vertebral fractures (back pain, height loss, kyphosis), hip fractures (high morbidity), wrist fractures. Prevention/treatment: calcium (1200mg/day), vitamin D (800-1000 IU/day), weight-bearing exercise, fall prevention. Medications: bisphosphonates (alendronate, risedronate), denosumab, teriparatide for severe cases.

ROTATOR CUFF
Rotator cuff comprises supraspinatus, infraspinatus, teres minor, subscapularis. Tears from acute trauma or chronic degeneration. Symptoms: shoulder pain (worse at night, with overhead activity), weakness, reduced range of motion. Empty can test, drop arm test for supraspinatus. Treatment: physical therapy, NSAIDs, corticosteroid injections, surgical repair for large tears or failed conservative management.

FRACTURES
Fractures classified by pattern (transverse, oblique, spiral, comminuted), displacement, and location. Colles fracture (distal radius): fall on outstretched hand, common in elderly women. Hip fracture: high-energy in young, low-energy in elderly. Garden classification for femoral neck fractures. Treatment: closed reduction and casting, ORIF (open reduction internal fixation), or arthroplasty. Compartment syndrome: pain out of proportion, paresthesia, paralysis, pallor, pulselessness - surgical emergency.

CARPAL TUNNEL SYNDROME
Compression of median nerve at wrist. Symptoms: hand numbness and tingling (thumb, index, middle, radial half of ring finger), worse at night, weakness in grip, thenar wasting in severe cases. Phalen test, Tinel sign. Nerve conduction studies for confirmation. Treatment: wrist splinting (neutral position at night), NSAIDs, corticosteroid injection, surgical carpal tunnel release for refractory cases.

SCOLIOSIS
Lateral spinal curvature >10 degrees (Cobb angle). Idiopathic (80%) most common in adolescent females. Curve <20°: observation. 20-40°: bracing. >40-50°: surgical consideration. Physical exam: Adam's forward bend test, shoulder/waist asymmetry. Back pain, respiratory issues in severe thoracic curves.
""",

    "gynecologist": """
MENSTRUAL DISORDERS
Normal menstrual cycle: 21-35 days, duration 2-7 days, blood loss 20-60mL. Dysmenorrhea: painful menstruation - primary (prostaglandin-mediated, no pathology) or secondary (endometriosis, fibroids, PID). Treatment: NSAIDs (ibuprofen, naproxen), combined oral contraceptives. Menorrhagia: heavy menstrual bleeding (>80mL). Causes: fibroids, polyps, adenomyosis, coagulopathy, hypothyroidism, anovulation. Amenorrhea: absence of menstruation - primary (no period by 15) or secondary (>3 months absence in previously menstruating). Rule out pregnancy first.

POLYCYSTIC OVARY SYNDROME (PCOS)
Most common endocrine disorder in reproductive-age women (5-10%). Rotterdam criteria (2 of 3): oligo/anovulation, clinical/biochemical hyperandrogenism, polycystic ovaries on ultrasound. Symptoms: irregular periods, acne, hirsutism, alopecia, weight gain, infertility. Associated: insulin resistance, metabolic syndrome, type 2 diabetes risk. Treatment: lifestyle modification (weight loss), combined oral contraceptives (regulate periods, treat hyperandrogenism), metformin (insulin resistance), letrozole (ovulation induction for fertility).

ENDOMETRIOSIS
Presence of endometrial-like tissue outside uterus (ovaries, fallopian tubes, peritoneum). Affects 10% of reproductive-age women. Symptoms: dysmenorrhea (often severe), chronic pelvic pain, dyspareunia, dyschezia, infertility. Laparoscopy is gold standard for diagnosis. Staging I-IV. Medical treatment: NSAIDs, hormonal (combined pill, progestins, GnRH agonists/antagonists, Mirena IUD). Surgical: laparoscopic excision/ablation. Definitive: hysterectomy with bilateral oophorectomy.

MENOPAUSE
Natural menopause: cessation of menstruation for 12 consecutive months (average age 51). Perimenopause: 4-8 years before, irregular cycles, vasomotor symptoms. Symptoms: hot flashes, night sweats, vaginal dryness, mood changes, sleep disturbances, cognitive changes, decreased libido, urinary symptoms. Genitourinary syndrome of menopause: vaginal atrophy, recurrent UTIs. Treatment: hormone replacement therapy (most effective for vasomotor symptoms), topical vaginal estrogen (for genitourinary symptoms), SSNRIs (non-hormonal), lifestyle modifications.

CERVICAL CANCER SCREENING
Cervical cancer caused by high-risk HPV strains (16, 18 cause 70% of cases). Pap smear + HPV co-testing every 5 years (21-65), Pap alone every 3 years. Abnormal Pap management: colposcopy, LEEP, cone biopsy depending on results. HPV vaccination: recommended for girls and boys 9-26 years, can be given up to age 45 in some cases. Symptoms of cervical cancer: abnormal vaginal bleeding (postcoital, irregular), vaginal discharge, pelvic pain - often asymptomatic early.

PREGNANCY
First trimester (weeks 1-12): confirms pregnancy, dating ultrasound, initial labs (blood type, CBC, infections, genetic screening). Second trimester (weeks 13-26): anatomy ultrasound at 18-20 weeks, gestational diabetes screening (24-28 weeks), AFP screening. Third trimester (weeks 27-40): GBS screening (36 weeks), fetal position. Common concerns: nausea/vomiting (first trimester, vitamin B6, ginger, antiemetics), back pain, heartburn, constipation. Red flags: vaginal bleeding, severe headache, vision changes, right upper quadrant pain, decreased fetal movement.

CONTRACEPTION
Combined oral contraceptives: prevent ovulation, 91-99% effective with perfect use. Contraindications: smoking >35, hypertension, migraine with aura, thrombophilia, liver disease. Progestin-only pill ("mini-pill"): suitable for breastfeeding, fewer contraindications. IUDs: Mirena (5 years, reduces bleeding), Kyleena (5 years), Copper IUD (10 years, non-hormonal). Implant (Nexplanon): 3 years, highly effective. Emergency contraception: Plan B within 72 hours, ella within 120 hours, copper IUD most effective.

OVARIAN CYSTS
Functional cysts (follicular, corpus luteum) are most common, usually resolve spontaneously in 1-3 cycles. Dermoid cysts (teratomas), endometriomas, cystadenomas are pathological. PCOS: multiple small follicles. Evaluation: transvaginal ultrasound. CA-125 in postmenopausal women. Management: observation for functional cysts <5cm, serial ultrasound. Surgery for large (>7cm), persistent, symptomatic, or suspicious cysts. Ovarian torsion: sudden severe pain, nausea, surgical emergency.
""",

    "neurologist": """
MIGRAINE
Migraine is a neurological disorder with recurrent moderate-severe headache (4-72 hours), often unilateral, pulsating, worsened by activity. May be with aura (visual, sensory, language disturbances preceding headache). POUND criteria: Pulsating quality, duration 4-72 hours, Unilateral location, Nausea/vomiting, Disabling intensity. Triggers: stress, hormones, sleep changes, certain foods (tyramine, alcohol), weather. Acute treatment: NSAIDs, acetaminophen, triptans (sumatriptan, rizatriptan), anti-emetics, ergotamines. Preventive (≥4 attacks/month): propranolol, topiramate, amitriptyline, valproate, CGRP monoclonal antibodies (erenumab, fremanezumab). Lifestyle: regular sleep, meals, hydration, exercise.

EPILEPSY
Epilepsy: ≥2 unprovoked seizures >24 hours apart, or 1 seizure with high recurrence risk. Seizure types: focal (aware or impaired awareness), generalized (tonic-clonic, absence, myoclonic, atonic), unknown. Focal-to-bilateral tonic-clonic most dramatic. EEG and MRI for evaluation. First-line medications: levetiracetam, lamotrigine, valproate (generalized), carbamazepine (focal). Status epilepticus: >5 minutes continuous seizure - emergency, IV benzodiazepines. Seizure first aid: protect from injury, turn on side, do not restrain, do not put anything in mouth. Driving restrictions apply.

STROKE
Stroke: sudden neurological deficit from vascular cause. Ischemic (87%): thrombotic or embolic. Hemorrhagic (13%): intracerebral or subarachnoid. FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency. Other symptoms: sudden severe headache, vision loss, confusion, balance problems. Treatment window: IV tPA within 4.5 hours of onset. Mechanical thrombectomy up to 24 hours for large vessel occlusion. Secondary prevention: antiplatelets (aspirin, clopidogrel), anticoagulants (for afib), statins, blood pressure control. TIA: transient symptoms (<24h), high early stroke risk - urgent evaluation.

MULTIPLE SCLEROSIS
MS: autoimmune demyelinating disease of CNS. Types: relapsing-remitting (RRMS, most common), primary progressive, secondary progressive. Symptoms: optic neuritis (vision loss, pain with eye movement), sensory disturbances, weakness, spasticity, fatigue, bladder dysfunction, cognitive changes, Uhthoff phenomenon (worsening with heat). MRI: white matter lesions, enhancing lesions. CSF: oligoclonal bands. Evoked potentials. Treatment: disease-modifying therapies (interferons, glatiramer, natalizumab, ocrelizumab, siponimod). Acute relapses: IV methylprednisolone. Symptom management: baclofen (spasticity), modafinil (fatigue).

PARKINSON'S DISEASE
Parkinson's: progressive neurodegenerative disorder affecting dopaminergic neurons in substantia nigra. Motor features: resting tremor ("pill-rolling"), rigidity, bradykinesia, postural instability. Non-motor: anosmia, constipation, depression, sleep disorders (REM sleep behavior disorder), autonomic dysfunction, cognitive changes. Diagnosis: clinical. DaTscan for uncertain cases. Treatment: levodopa (most effective), dopamine agonists (pramipexole, ropinirole), MAO-B inhibitors (selegiline, rasagiline). Deep brain stimulation for advanced disease. Falls risk, speech therapy, physiotherapy important.

ALZHEIMER'S DISEASE
Most common dementia (60-70%). Progressive memory impairment, language difficulties, visuospatial problems, executive dysfunction, behavioral changes. Early: episodic memory loss, word-finding difficulty. Late: complete dependence. Risk factors: age (strongest), family history, APOE-ε4 allele, cardiovascular risk factors. Biomarkers: amyloid PET, CSF amyloid/tau, MRI showing hippocampal atrophy. No cure. Medications: cholinesterase inhibitors (donepezil, rivastigmine, galantamine), memantine (moderate-severe). Lecanemab (anti-amyloid antibody) for early AD.

PERIPHERAL NEUROPATHY
Damage to peripheral nerves. Causes: diabetes (most common - length-dependent, stocking-glove pattern), B12 deficiency, alcohol, medications (chemotherapy), hereditary (Charcot-Marie-Tooth), inflammatory (GBS, CIDP), infections (HIV, Lyme). Symptoms: numbness, tingling, burning pain, weakness, balance problems. EMG/nerve conduction studies for characterization. Treatment: address underlying cause, pain management (gabapentin, pregabalin, duloxetine, TCAs, topical lidocaine). Guillain-Barré: acute, ascending weakness post-infection - IVIG or plasmapheresis.

HEADACHE RED FLAGS (THUNDERCLAP)
Thunderclap headache: sudden severe headache reaching maximum intensity within 1 minute. Consider subarachnoid hemorrhage until proven otherwise. Evaluation: non-contrast CT head (sensitivity decreases after 6h), LP for xanthochromia if CT negative. Other red flags: new headache in patient >50 (giant cell arteritis), headache with fever/stiff neck (meningitis), progressive worsening, positional headache, headache with neurological signs.
""",

    "dermatologist": """
ACNE VULGARIS
Acne results from follicular plugging, sebum production, Cutibacterium acnes proliferation, and inflammation. Lesions: comedones (open/closed), papules, pustules, nodules, cysts. Grading: mild (comedones/papules), moderate (papules/pustules), severe (nodules/cysts). Treatment by severity - Mild: topical retinoids (tretinoin, adapalene), benzoyl peroxide, salicylic acid. Moderate: add topical/oral antibiotics (doxycycline, minocycline). Severe: isotretinoin (requires iPLEDGE program, teratogenic). Hormonal acne in women: oral contraceptives, spironolactone. Post-inflammatory hyperpigmentation and scarring are complications.

PSORIASIS
Chronic autoimmune skin disease. Types: plaque (most common - silvery scaly plaques on elbows, knees, scalp), guttate, inverse, pustular, erythrodermic. Psoriatic arthritis in 30%. Triggers: stress, infections, medications (lithium, beta-blockers, NSAIDs), alcohol, smoking. Auspitz sign (pinpoint bleeding). Topical: corticosteroids, vitamin D analogs (calcipotriol), retinoids, tar. Phototherapy: UVB, PUVA. Systemics: methotrexate, cyclosporine, acitretin. Biologics: TNF inhibitors (adalimumab, etanercept), IL-17 inhibitors (secukinumab), IL-23 inhibitors (guselkumab) for moderate-severe.

ECZEMA (ATOPIC DERMATITIS)
Chronic inflammatory skin condition associated with atopy (asthma, allergic rhinitis). Hallmark: intense pruritus. Distribution varies by age - infants: face/extensor surfaces; children: flexural surfaces; adults: hands, neck, face. Pathophysiology: skin barrier dysfunction (filaggrin mutations), Th2 inflammation. Triggers: irritants, allergens, stress, infections, sweating. Management: moisturizers (emollients), trigger avoidance, topical corticosteroids (mainstay), topical calcineurin inhibitors (pimecrolimus, tacrolimus), topical PDE4 inhibitors (crisaborole). Systemic: dupilumab (IL-4/13 inhibitor), JAK inhibitors (upadacitinib) for moderate-severe.

SKIN CANCER
Basal cell carcinoma (BCC): most common skin cancer, locally invasive, rarely metastasizes. Pearly papule with telangiectasias. Treatment: surgical excision, Mohs surgery for high-risk areas. Squamous cell carcinoma (SCC): second most common, can metastasize. Risk factors: UV exposure, immunosuppression, HPV. Treatment: excision, radiation. Melanoma: most deadly skin cancer. ABCDE criteria: Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution. Staging determines treatment. Surgery, immunotherapy (pembrolizumab, nivolumab), targeted therapy (BRAF inhibitors) for advanced disease. Monthly self-skin exams and annual dermatology visits for high-risk individuals.

CONTACT DERMATITIS
Allergic contact dermatitis: delayed hypersensitivity reaction (Type IV). Common allergens: nickel, fragrance, preservatives, latex, poison ivy. Patch testing identifies allergens. Irritant contact dermatitis: direct skin damage from chemicals, detergents, soaps. Treatment: identify and avoid causative agent, topical corticosteroids, emollients. Occupational skin disease common.

FUNGAL INFECTIONS
Tinea infections caused by dermatophytes. Tinea corporis (ringworm): annular scaly lesion. Tinea pedis (athlete's foot): interdigital scaling, maceration. Tinea capitis: scalp infection, common in children. Tinea unguium/onychomycosis: nail infection, yellow-brown discoloration. KOH preparation shows hyphae. Treatment: topical antifungals (clotrimazole, terbinafine) for skin; oral terbinafine or itraconazole for nail/scalp. Candida: yeasts, intertrigo, oral thrush, vaginal candidiasis - fluconazole.

ROSACEA
Chronic inflammatory facial condition. Subtypes: erythematotelangiectatic (flushing, erythema), papulopustular (acne-like lesions), phymatous (thickening, rhinophyma), ocular (eye involvement). Triggers: sunlight, heat, alcohol, spicy food, stress. Treatment: trigger avoidance, sun protection, topical metronidazole/azelaic acid/brimonidine, oral doxycycline for moderate-severe, isotretinoin for severe, laser/IPL for telangiectasias.

URTICARIA (HIVES)
Raised, erythematous, pruritic wheals that blanch. Acute (<6 weeks): usually allergic (food, medication, insect sting). Chronic (>6 weeks): often idiopathic, sometimes autoimmune. Angioedema: deeper swelling - may involve airway. Treatment: antihistamines (cetirizine, loratadine - non-sedating first-line), oral corticosteroids for acute severe episodes. Omalizumab for chronic spontaneous urticaria. Epinephrine for anaphylaxis. Identify and avoid triggers.
""",

    "gastroenterologist": """
GASTROESOPHAGEAL REFLUX DISEASE (GERD)
GERD: chronic acid reflux causing esophageal symptoms. Symptoms: heartburn (retrosternal burning), regurgitation, dysphagia, chronic cough, hoarseness, dental erosion. Barrett's esophagus: metaplasia from chronic GERD, increased esophageal adenocarcinoma risk. Diagnosis: clinical; endoscopy for alarm symptoms or evaluation of Barrett's. Lifestyle: weight loss, elevate head of bed, avoid triggers (fatty foods, alcohol, caffeine, chocolate, mint, late meals). Treatment: antacids, H2 blockers (famotidine), proton pump inhibitors (omeprazole, pantoprazole). Surgery: Nissen fundoplication for medication-refractory GERD.

IRRITABLE BOWEL SYNDROME (IBS)
Functional GI disorder - chronic abdominal pain with altered bowel habits (no structural abnormality). Subtypes: IBS-C (constipation-predominant), IBS-D (diarrhea-predominant), IBS-M (mixed), IBS-U (unclassified). Rome IV criteria: recurrent abdominal pain ≥1 day/week for 3 months related to defecation or change in stool frequency/form. Red flags exclude IBS: rectal bleeding, weight loss, fever, nocturnal symptoms, family history of colorectal cancer/IBD. Treatment: dietary changes (low-FODMAP diet), fiber supplementation, antispasmodics (hyoscine), antidiarrheals (loperamide), laxatives, antidepressants (TCAs, SSRIs), rifaximin for IBS-D.

INFLAMMATORY BOWEL DISEASE
Crohn's disease: transmural inflammation, any GI tract (mouth to anus), skip lesions, granulomas. Cobblestone mucosa, fistulas, strictures. Symptoms: abdominal pain, diarrhea (may be bloody), weight loss, fatigue, perianal disease. Ulcerative colitis: mucosal inflammation, continuous from rectum, bloody diarrhea, urgency, tenesmus, mucus. Extraintestinal manifestations: arthritis, uveitis, erythema nodosum, pyoderma gangrenosum, primary sclerosing cholangitis. Diagnosis: endoscopy, histology, imaging. Treatment: 5-aminosalicylates (UC), corticosteroids (flares), immunomodulators (azathioprine, methotrexate), biologics (infliximab, adalimumab, vedolizumab, ustekinumab). Colorectal cancer surveillance for long-standing UC.

PEPTIC ULCER DISEASE
Gastric and duodenal ulcers. Causes: H. pylori infection (70-90% of duodenal, 60-70% of gastric ulcers), NSAIDs, rarely Zollinger-Ellison syndrome. Symptoms: epigastric pain (burning/gnawing), may radiate to back. Gastric ulcer: pain worsened by food. Duodenal ulcer: pain relieved by food. Complications: bleeding (hematemesis, melena), perforation (acute abdomen), obstruction. Diagnosis: endoscopy, H. pylori testing (urea breath test, stool antigen, endoscopic biopsy). Treatment: PPI, H. pylori eradication (triple therapy: PPI + amoxicillin + clarithromycin 14 days), stop NSAIDs.

LIVER DISEASE
Hepatitis A: fecal-oral, self-limiting, vaccine available. Hepatitis B: blood/sexual, chronic infection risk, vaccine, antivirals (tenofovir, entecavir). Hepatitis C: blood-borne, 85% chronic, highly curable with DAAs (sofosbuvir/velpatasvir). Alcoholic liver disease: fatty liver → hepatitis → cirrhosis. NASH/NAFLD: non-alcoholic, associated with metabolic syndrome. Cirrhosis complications: portal hypertension, varices, ascites, hepatic encephalopathy, hepatorenal syndrome, HCC. Child-Pugh score/MELD score for severity. Liver function tests: ALT, AST, ALP, GGT, bilirubin, albumin, PT/INR.

COLORECTAL CANCER
Third most common cancer worldwide. Risk factors: age >50, family history (Lynch syndrome, FAP), IBD, diet (high red/processed meat, low fiber), obesity, alcohol, smoking. Prevention: colonoscopy screening every 10 years (50-75), annual FIT test. Polyp types: adenomatous (precancerous), hyperplastic. Symptoms: change in bowel habits, rectal bleeding, weight loss, abdominal pain, anemia. Staging: TNM, Dukes. Treatment: surgery (colectomy, anterior resection, APR), adjuvant chemotherapy (FOLFOX, CAPOX), radiation (rectal cancer), targeted therapy (bevacizumab, cetuximab for metastatic). CEA monitoring.

CONSTIPATION
Fewer than 3 bowel movements/week, hard stools, straining, incomplete evacuation. Primary: normal transit, slow transit, outlet obstruction. Secondary: medications (opioids, calcium channel blockers, iron), hypothyroidism, diabetes, Parkinson's, pregnancy, colorectal cancer (new onset). Rome IV criteria: ≥2 symptoms in 25% of defecations. Treatment: fiber (25-35g/day), hydration, exercise, osmotic laxatives (PEG, lactulose, sorbitol), stimulant laxatives (bisacodyl, senna), secretagogues (linaclotide, lubiprostone).

DIARRHEA
Acute (<2 weeks): usually infectious (viral - rotavirus, norovirus; bacterial - Salmonella, Campylobacter, E. coli; parasitic - Giardia). Bloody diarrhea: bacterial, IBD, ischemic colitis. Chronic (>4 weeks): IBS, IBD, malabsorption (celiac disease), microscopic colitis, medications, functional. Evaluation: stool cultures, C. diff PCR, colonoscopy. Supportive treatment: oral rehydration, BRAT diet. Antibiotics for bacterial if severe, persistent, or immunocompromised.
""",

    "pulmonologist": """
ASTHMA
Chronic inflammatory airway disease characterized by variable airflow obstruction and bronchial hyperresponsiveness. Symptoms: wheezing, shortness of breath, chest tightness, cough (worse at night/early morning). Triggers: allergens, exercise, cold air, infections, pollutants, NSAIDs (aspirin-exacerbated). Spirometry: FEV1/FVC <0.7, reversibility (>12% and 200mL improvement with bronchodilator). Classification: intermittent, mild-moderate-severe persistent. Treatment stepwise: SABA (albuterol) PRN → low-dose ICS → ICS/LABA (fluticasone/salmeterol, budesonide/formoterol) → medium-high dose ICS/LABA → add-ons (LAMA, biologics). Biologics for severe: dupilumab, mepolizumab (anti-IL5), benralizumab. Acute exacerbation: SABA, ipratropium, systemic corticosteroids, oxygen, heliox, IV magnesium.

CHRONIC OBSTRUCTIVE PULMONARY DISEASE (COPD)
COPD: progressive airflow limitation from emphysema (alveolar destruction) and chronic bronchitis (mucus hypersecretion ≥3 months/year for 2 consecutive years). Cause: smoking (85-90%), occupational exposure, air pollution, alpha-1 antitrypsin deficiency. GOLD staging by FEV1% predicted. Symptoms: chronic cough, sputum production, dyspnea on exertion progressing to rest. Spirometry: FEV1/FVC <0.7 post-bronchodilator. Treatment: smoking cessation (most important), SABA/SAMA PRN, LAMA (tiotropium) maintenance, LABA/ICS for frequent exacerbations, roflumilast, azithromycin prophylaxis. Pulmonary rehabilitation. Oxygen therapy for PaO2 <55 mmHg. Lung volume reduction surgery, transplantation for advanced.

PNEUMONIA
Lung parenchyma infection. Community-acquired (CAP): most common - Streptococcus pneumoniae, Mycoplasma, Chlamydophila, Haemophilus, viruses. Hospital-acquired (HAP): Gram-negative rods, MRSA. Aspiration: anaerobes. Symptoms: fever, productive cough, pleuritic chest pain, dyspnea, crackles on auscultation. CXR: lobar consolidation, interstitial pattern. CURB-65 score guides hospitalization (Confusion, Urea >7, RR>30, BP<90/60, Age≥65). Treatment: amoxicillin-clavulanate + macrolide or fluoroquinolone (outpatient CAP); broader coverage for HAP/immunocompromised. COVID-19 pneumonia: supportive, dexamethasone for severe.

SLEEP APNEA
Obstructive sleep apnea (OSA): repetitive upper airway collapse during sleep. Symptoms: snoring, witnessed apneas, excessive daytime sleepiness, morning headaches, nocturia. Risk factors: obesity, male sex, age, alcohol, sedatives, large neck circumference, retrognathia. Diagnosis: polysomnography - AHI ≥5 events/hour. Mild: AHI 5-14, moderate 15-29, severe ≥30. Complications: hypertension, cardiovascular disease, stroke, cognitive impairment, metabolic syndrome. Treatment: CPAP (first-line), weight loss, positional therapy, oral appliances, surgery (UPPP, hypoglossal nerve stimulation).

PULMONARY EMBOLISM
PE: clot in pulmonary arteries. Usually from DVT (deep vein thrombosis). Risk factors: immobility, surgery, malignancy, pregnancy, oral contraceptives, thrombophilia, obesity. Symptoms: acute dyspnea, pleuritic chest pain, tachycardia, cough, hemoptysis. Massive PE: hemodynamic instability, right heart strain. Wells criteria for pre-test probability. D-dimer (sensitive, not specific). CT pulmonary angiography (gold standard). V/Q scan if CTA contraindicated. Treatment: anticoagulation (DOAC - apixaban, rivaroxaban first-line), heparin bridge for unstable. Thrombolysis/embolectomy for massive PE. IVC filter if anticoagulation contraindicated.

TUBERCULOSIS
Caused by Mycobacterium tuberculosis. Spread by aerosol droplets. Primary infection often asymptomatic (latent TB). Reactivation TB: cough >3 weeks, hemoptysis, weight loss, night sweats, fever, fatigue. CXR: upper lobe cavitation, fibrosis, nodules. Diagnosis: sputum AFB smear and culture, GeneXpert MTB/RIF PCR, TST (tuberculin skin test), IGRA (interferon-gamma release assay). Latent TB treatment: isoniazid (6-9 months) or rifapentine/isoniazid (once weekly 12 weeks). Active TB treatment: RIPE - Rifampin, Isoniazid, Pyrazinamide, Ethambutol (2 months intensive), then RI (4 months). MDR-TB requires longer, more complex treatment.

LUNG CANCER
Most common cause of cancer death. Non-small cell (85%): adenocarcinoma (most common, peripheral, non-smokers), squamous cell (central, smokers), large cell. Small cell (15%): highly aggressive, strongly associated with smoking, early metastasis. Symptoms: cough (change in character), hemoptysis, dyspnea, weight loss, chest pain, hoarseness (recurrent laryngeal nerve), SVC syndrome. Screening: low-dose CT annual for high-risk smokers (50-80, 20 pack-years, current or quit <15 years). Staging determines treatment: surgery for early NSCLC, chemoradiation for locally advanced, systemic therapy for metastatic (chemotherapy, targeted therapy for EGFR/ALK/ROS1 mutations, immunotherapy for PD-L1+).

BRONCHITIS
Acute bronchitis: inflammation of bronchi, usually viral (rhinovirus, coronavirus, influenza). Cough lasting 10-20 days, may have sputum. Self-limiting. Antibiotics rarely indicated. Chronic bronchitis (COPD definition): mucus-producing cough most days for 3 months in 2 consecutive years.
""",

    "pediatrician": """
CHILDHOOD DEVELOPMENT
Developmental milestones: 2 months - social smile, tracks objects; 4 months - holds head up, laughs; 6 months - sits with support, babbles; 9 months - pincer grasp developing, understands "no"; 12 months - walks with support, says "mama/dada"; 18 months - walks independently, 10 words; 2 years - runs, 50+ words, 2-word phrases; 3 years - climbs stairs, 3-word sentences; 4 years - hops, tells stories; 5 years - skips, counts to 10. Red flags: no social smile by 2 months, not sitting by 9 months, no words by 12 months, no 2-word phrases by 2 years, any regression.

CHILDHOOD IMMUNIZATIONS
Recommended schedule: Birth (HBV1), 2 months (DTaP, IPV, Hib, PCV13, RV, HBV2), 4 months (DTaP, IPV, Hib, PCV13, RV), 6 months (DTaP, IPV, Hib, PCV13, RV, HBV3, IIV annual), 12-15 months (MMR1, Varicella1, Hib booster, PCV13 booster, HepA1), 15-18 months (DTaP4), 4-6 years (DTaP5, IPV4, MMR2, Varicella2), 11-12 years (Tdap, MenACWY, HPV series). Vaccine hesitancy addressed by evidence-based counseling. Contraindications: severe allergic reaction to previous dose, anaphylaxis to vaccine components. Live vaccines contraindicated in immunocompromised.

FEVER IN CHILDREN
Definition: temperature ≥38°C (100.4°F). Cause usually infectious. Risk stratification: <3 months - hospitalize all febrile infants, rule out bacterial infection (sepsis workup). 3-24 months - Streptococcus pneumoniae, H. influenzae most common bacterial causes. >2 years - viral most common. Treatment: acetaminophen (10-15mg/kg q4-6h) or ibuprofen (10mg/kg q6-8h) for fever >38.5°C. Never aspirin in children (Reye syndrome). Tepid sponging. When to seek care: <3 months any fever, >5 days, >40°C, appears ill, rash with fever (petechiae - urgent), seizure.

CHILDHOOD ASTHMA
Most common chronic childhood disease. Symptoms: recurrent wheezing, cough (especially nocturnal), breathlessness, chest tightness, exercise intolerance. Diagnosis: clinical + spirometry (children >5 years). Triggers: allergens, URTIs, exercise, cold air, smoke. Classification and treatment similar to adults. Spacers with MDI for children under 8. Nebulizers for severe exacerbations. Inhaled corticosteroids (fluticasone, budesonide) safe for long-term use. Montelukast for mild persistent or allergic rhinitis coexistence. Anaphylaxis epinephrine training for at-risk families.

EAR INFECTIONS (OTITIS MEDIA)
Most common bacterial infection in children. Acute otitis media (AOM): ear pain, irritability, fever, bulging erythematous tympanic membrane. Bacteria: Streptococcus pneumoniae, H. influenzae, M. catarrhalis. Treatment: watchful waiting for mild-moderate in >6 months; amoxicillin (high dose 80-90mg/kg/day) for severe, <2 years, bilateral. Amoxicillin-clavulanate if failed. Otitis media with effusion (OME): fluid without infection signs, watch 3 months, tympanostomy tubes if persistent affecting hearing.

ATTENTION DEFICIT HYPERACTIVITY DISORDER (ADHD)
Neurodevelopmental disorder. Inattentive type: poor attention, easily distracted, forgetful, disorganized. Hyperactive-impulsive: fidgeting, inability to stay seated, excessive talking, impulsive. Combined most common. DSM-5: ≥6 symptoms for 6 months, onset before 12, present in ≥2 settings, functional impairment. Evaluation: rating scales (Vanderbilt, Conners), behavioral assessment. Treatment: behavioral therapy (first-line for preschool), medications for school-age: stimulants (methylphenidate, amphetamines) most effective; non-stimulants (atomoxetine, guanfacine) alternatives.

CHILDHOOD OBESITY
BMI ≥95th percentile for age and sex. Prevalence increasing globally. Consequences: type 2 diabetes, hypertension, dyslipidemia, sleep apnea, musculoskeletal problems, psychosocial issues, early cardiovascular disease. Causes: genetic predisposition, diet (high calorie, sugar-sweetened beverages), sedentary behavior, sleep deprivation, medications. Treatment: family-based behavioral intervention, dietary changes (limit processed food, SSBs), increase activity (60 min/day moderate-vigorous), reduce screen time (<2h/day). Pharmacotherapy limited in adolescents. Bariatric surgery in severe adolescent obesity.

NEONATAL AND INFANT CARE
Newborn screening: metabolic disorders, hearing, critical congenital heart disease. Breastfeeding: recommended for at least 6 months, exclusive to 6 months. Benefits: IgA protection, bonding, reduces obesity/diabetes/SIDS/allergy risk. Formula: iron-fortified. Vitamin D 400 IU daily supplementation for breastfed infants. Fluoride supplementation from 6 months. SIDS prevention: back-to-sleep (supine), firm mattress, no soft bedding, room-sharing (not bed-sharing), avoid smoking. Well-child visits: 3-5 days, 1, 2, 4, 6, 9, 12, 15, 18, 24 months, then annually.
""",

    "psychiatrist": """
DEPRESSION (MAJOR DEPRESSIVE DISORDER)
MDD: depressed mood or anhedonia for ≥2 weeks plus ≥4 additional symptoms (sleep changes, appetite/weight changes, fatigue, concentration difficulty, psychomotor changes, worthlessness/guilt, suicidal ideation). PHQ-9 screening tool. Moderate-severe: antidepressants + psychotherapy. SSRIs first-line (fluoxetine, sertraline, escitalopram) - take 4-6 weeks for full effect, start low, titrate. SNRIs (venlafaxine, duloxetine) for depression with anxiety or pain. Bupropion: no sexual side effects, avoid in seizure/eating disorder. Mirtazapine: sedating, for insomnia/low appetite. Psychotherapy: CBT (most evidence), IPT, behavioral activation. Treatment-resistant: augmentation (lithium, atypical antipsychotics), TMS, ECT. Suicide risk assessment: every visit.

ANXIETY DISORDERS
Generalized anxiety disorder (GAD): excessive worry ≥6 months about multiple topics, difficult to control, with ≥3 of restlessness/fatigue/concentration/irritability/muscle tension/sleep disturbance. GAD-7 screening. Treatment: SSRIs/SNRIs (first-line, 4-6 weeks onset), buspirone, pregabalin. CBT (evidence-based). Avoid benzodiazepines long-term (dependence). Panic disorder: recurrent unexpected panic attacks (palpitations, chest tightness, shortness of breath, dizziness, depersonalization, fear of losing control/dying). SSRIs + CBT first-line. Social anxiety disorder: fear of social situations - SSRIs, CBT, beta-blockers for performance anxiety. Specific phobia: CBT with exposure.

POST-TRAUMATIC STRESS DISORDER (PTSD)
PTSD develops after exposure to traumatic event (combat, assault, accidents, disaster). Criteria: intrusion (flashbacks, nightmares), avoidance of trauma-related stimuli, negative cognitions/mood, hyperarousal (hypervigilance, exaggerated startle, sleep disturbance) - lasting >1 month. PCL-5 screening. Treatment: trauma-focused CBT (Prolonged Exposure, CPT) - most evidence. EMDR. SSRIs (sertraline, paroxetine - FDA approved), SNRIs. Prazosin for nightmares. Avoid benzodiazepines. Complex PTSD (repeated/prolonged trauma): additional emotional dysregulation, dissociation.

BIPOLAR DISORDER
Characterized by episodes of mania/hypomania and depression. Bipolar I: ≥1 manic episode (inflated self-esteem, decreased sleep, pressured speech, flight of ideas, increased goal-directed activity, poor judgment, impulsivity) lasting ≥7 days or requiring hospitalization. Bipolar II: hypomania + major depression (no full manic episodes). Cyclothymia: subsyndromal. Mood stabilizers: lithium (classic, requires monitoring of levels/renal/thyroid), valproate (women of childbearing age - teratogenic), lamotrigine (depression-dominant), quetiapine. Antidepressants: may trigger mania - use cautiously with mood stabilizer coverage. Psychoeducation, sleep hygiene, avoiding triggers.

SCHIZOPHRENIA
Psychotic disorder: positive symptoms (hallucinations - auditory most common, delusions - persecutory/referential most common, disorganized speech/behavior), negative symptoms (flat affect, alogia, avolition, anhedonia, asociality), cognitive symptoms (working memory, attention). Onset: late teens to early 30s, earlier in men. Diagnosis: ≥2 symptoms for ≥1 month, social/occupational dysfunction ≥6 months. Treatment: antipsychotics - second-generation (risperidone, olanzapine, quetiapine, aripiprazole, clozapine for treatment-resistant) preferred. Psychosocial rehabilitation, supported employment, CBTp. Long-acting injectable antipsychotics for adherence. Clozapine requires ANC monitoring.

SLEEP DISORDERS
Insomnia disorder: difficulty initiating/maintaining sleep ≥3 nights/week for ≥3 months causing distress/impairment. CBT-I (cognitive behavioral therapy for insomnia) is first-line. Sleep hygiene: consistent schedule, dark/cool/quiet bedroom, avoid screens/caffeine/alcohol before bed. Medications: melatonin (circadian issues), doxepin low-dose, lemborexant/suvorexant (orexin antagonists), avoid benzodiazepines long-term. Sleep apnea: CPAP. Restless legs syndrome: ferritin >75, dopamine agonists (pramipexole, ropinirole). Circadian rhythm disorders: light therapy, chronotherapy, melatonin.

SUBSTANCE USE DISORDERS
Alcohol use disorder: CAGE/AUDIT screening. Brief intervention. Alcohol withdrawal: seizures, delirium tremens (medical emergency). Treatment: benzodiazepines (CIWA protocol), thiamine. Medications: naltrexone (reduces craving/relapse), acamprosate (maintains abstinence), disulfiram. AA, motivational interviewing. Opioid use disorder: fentanyl overdose - naloxone. MOUD: buprenorphine (partial agonist, preferred outpatient), methadone (opioid treatment program), naltrexone (extended-release). Stimulants: no approved pharmacotherapy, CBT. Cannabis use disorder: increasingly common, CBT, motivational interviewing.

EATING DISORDERS
Anorexia nervosa: restriction, low body weight, distorted body image, intense fear of weight gain. Medical complications: bradycardia, hypotension, electrolyte abnormalities (refeeding syndrome risk), osteoporosis, amenorrhea. Highest mortality of any psychiatric disorder. Treatment: medical stabilization, nutritional rehabilitation, family-based treatment (adolescents), CBT-E (adults). Bulimia nervosa: binge-purge cycles, normal weight. SSRIs (fluoxetine high dose), CBT. Binge eating disorder: recurrent bingeing without purging. CBT, lisdexamfetamine (FDA approved).
"""
}


def create_sample_data():
    base_dir = Path("rag_data")
    total_files = 0

    for specialty, content in DATA.items():
        out_dir = base_dir / specialty
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "ledge.txt"
        out_path.write_text(content.strip(), encoding="utf-8")
        print(f"[OK] {specialty:30s} → {out_path}")
        total_files += 1

    print(f"\nCreated {total_files} knowledge files.")
    print("Next step: python scripts/ingest_all.py")


if __name__ == "__main__":
    create_sample_data()
