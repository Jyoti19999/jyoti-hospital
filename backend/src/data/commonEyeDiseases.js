// Common Eye Diseases Dataset
// This provides immediate functionality without waiting for ICD-11 API
// Can be also synced with ICD-11 later for official codes testing and validation

const commonEyeDiseases = [
    // Retinal Disorders
    {
        code: '9B71',
        title: 'Diabetic Retinopathy',
        category: 'Retinal Disorders',
        description: 'Damage to the retina caused by complications of diabetes mellitus',
        symptoms: ['Blurred vision', 'Floaters', 'Vision loss', 'Dark spots'],
        urgency: 'Urgent',
        requiresSurgery: true
    },
    {
        code: '9B70',
        title: 'Age-related Macular Degeneration',
        category: 'Retinal Disorders',
        description: 'Progressive deterioration of the macula',
        symptoms: ['Central vision loss', 'Distorted vision', 'Difficulty reading'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9B75',
        title: 'Retinal Detachment',
        category: 'Retinal Disorders',
        description: 'Separation of the retina from underlying tissue',
        symptoms: ['Sudden floaters', 'Flashes of light', 'Shadow in vision'],
        urgency: 'Emergency',
        requiresSurgery: true
    },

    // Glaucoma
    {
        code: '9C61',
        title: 'Primary Open-Angle Glaucoma',
        category: 'Glaucoma',
        description: 'Progressive optic neuropathy with elevated intraocular pressure',
        symptoms: ['Peripheral vision loss', 'Tunnel vision', 'Usually asymptomatic early'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9C60',
        title: 'Acute Angle-Closure Glaucoma',
        category: 'Glaucoma',
        description: 'Sudden blockage of aqueous humor drainage',
        symptoms: ['Severe eye pain', 'Headache', 'Nausea', 'Blurred vision', 'Halos'],
        urgency: 'Emergency',
        requiresSurgery: true
    },

    // Cataract - Expanded
    {
        code: '9B10',
        title: 'Senile Cataract',
        category: 'Lens Disorders',
        description: 'Age-related clouding of the lens',
        symptoms: ['Blurred vision', 'Glare', 'Difficulty with night vision'],
        urgency: 'Routine',
        requiresSurgery: true
    },
    {
        code: '9B11',
        title: 'Diabetic Cataract',
        category: 'Lens Disorders',
        description: 'Cataract associated with diabetes mellitus',
        symptoms: ['Rapid vision decline', 'Cloudy vision'],
        urgency: 'Urgent',
        requiresSurgery: true
    },
    {
        code: '9B12',
        title: 'Nuclear Cataract',
        category: 'Lens Disorders',
        description: 'Clouding in the center of the lens',
        symptoms: ['Gradual vision loss', 'Difficulty seeing at distance', 'Yellowing of vision'],
        urgency: 'Routine',
        requiresSurgery: true
    },
    {
        code: '9B13',
        title: 'Cortical Cataract',
        category: 'Lens Disorders',
        description: 'Clouding in the lens cortex',
        symptoms: ['Glare', 'Halos around lights', 'Difficulty with contrast'],
        urgency: 'Routine',
        requiresSurgery: true
    },
    {
        code: '9B14',
        title: 'Posterior Subcapsular Cataract',
        category: 'Lens Disorders',
        description: 'Clouding at the back of the lens',
        symptoms: ['Difficulty reading', 'Glare in bright light', 'Rapid progression'],
        urgency: 'Urgent',
        requiresSurgery: true
    },
    {
        code: '9B15',
        title: 'Congenital Cataract',
        category: 'Lens Disorders',
        description: 'Cataract present at birth',
        symptoms: ['Poor vision from birth', 'White pupil', 'Nystagmus'],
        urgency: 'Emergency',
        requiresSurgery: true
    },
    {
        code: '9B16',
        title: 'Traumatic Cataract',
        category: 'Lens Disorders',
        description: 'Cataract following eye injury',
        symptoms: ['Vision loss after trauma', 'Cloudy lens', 'Eye pain'],
        urgency: 'Urgent',
        requiresSurgery: true
    },

    // Corneal Disorders
    {
        code: '9A60',
        title: 'Keratoconus',
        category: 'Corneal Disorders',
        description: 'Progressive thinning and bulging of the cornea',
        symptoms: ['Distorted vision', 'Increased astigmatism', 'Light sensitivity'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9A61',
        title: 'Corneal Ulcer',
        category: 'Corneal Disorders',
        description: 'Open sore on the cornea',
        symptoms: ['Eye pain', 'Redness', 'Discharge', 'Blurred vision'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9A62',
        title: 'Corneal Dystrophy',
        category: 'Corneal Disorders',
        description: 'Inherited corneal disorder',
        symptoms: ['Cloudy cornea', 'Vision problems', 'Eye discomfort'],
        urgency: 'Routine',
        requiresSurgery: false
    },

    // Conjunctival Disorders
    {
        code: '9A73',
        title: 'Conjunctivitis',
        category: 'Conjunctival Disorders',
        description: 'Inflammation of the conjunctiva',
        symptoms: ['Red eye', 'Discharge', 'Itching', 'Tearing'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9A74',
        title: 'Pterygium',
        category: 'Conjunctival Disorders',
        description: 'Growth of conjunctival tissue onto the cornea',
        symptoms: ['Visible growth', 'Redness', 'Irritation'],
        urgency: 'Routine',
        requiresSurgery: true
    },

    // Refractive Errors
    {
        code: '9D00',
        title: 'Myopia',
        category: 'Refractive Errors',
        description: 'Nearsightedness',
        symptoms: ['Distant objects blurry', 'Squinting', 'Headaches'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9D01',
        title: 'Hyperopia',
        category: 'Refractive Errors',
        description: 'Farsightedness',
        symptoms: ['Near objects blurry', 'Eye strain', 'Headaches'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9D02',
        title: 'Astigmatism',
        category: 'Refractive Errors',
        description: 'Irregular curvature of cornea or lens',
        symptoms: ['Blurred vision', 'Eye strain', 'Headaches'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9D03',
        title: 'Presbyopia',
        category: 'Refractive Errors',
        description: 'Age-related loss of near focusing ability',
        symptoms: ['Difficulty reading', 'Need for reading glasses'],
        urgency: 'Routine',
        requiresSurgery: false
    },

    // Optic Nerve Disorders
    {
        code: '9C80',
        title: 'Optic Neuritis',
        category: 'Optic Nerve Disorders',
        description: 'Inflammation of the optic nerve',
        symptoms: ['Vision loss', 'Pain with eye movement', 'Color vision changes'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9C81',
        title: 'Optic Atrophy',
        category: 'Optic Nerve Disorders',
        description: 'Degeneration of optic nerve',
        symptoms: ['Progressive vision loss', 'Pale optic disc'],
        urgency: 'Urgent',
        requiresSurgery: false
    },

    // Eyelid Disorders
    {
        code: '9A00',
        title: 'Blepharitis',
        category: 'Orbital and Eyelid Disorders',
        description: 'Inflammation of the eyelids',
        symptoms: ['Red eyelids', 'Crusting', 'Itching', 'Burning'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9A01',
        title: 'Chalazion',
        category: 'Orbital and Eyelid Disorders',
        description: 'Blocked meibomian gland',
        symptoms: ['Eyelid lump', 'Swelling', 'Tenderness'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9A02',
        title: 'Ptosis',
        category: 'Orbital and Eyelid Disorders',
        description: 'Drooping of upper eyelid',
        symptoms: ['Droopy eyelid', 'Vision obstruction'],
        urgency: 'Routine',
        requiresSurgery: true
    },

    // Motility Disorders
    {
        code: '9D50',
        title: 'Strabismus',
        category: 'Motility Disorders',
        description: 'Misalignment of the eyes',
        symptoms: ['Crossed eyes', 'Double vision', 'Poor depth perception'],
        urgency: 'Routine',
        requiresSurgery: true
    },
    {
        code: '9D51',
        title: 'Amblyopia',
        category: 'Motility Disorders',
        description: 'Lazy eye',
        symptoms: ['Poor vision in one eye', 'Eye turn'],
        urgency: 'Urgent',
        requiresSurgery: false
    },

    // Other Common Conditions - Expanded
    {
        code: '9E00',
        title: 'Dry Eye Syndrome',
        category: 'Other Eye Disorders',
        description: 'Insufficient tear production or quality',
        symptoms: ['Dryness', 'Burning', 'Redness', 'Blurred vision'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9E01',
        title: 'Uveitis',
        category: 'Other Eye Disorders',
        description: 'Inflammation of the uvea',
        symptoms: ['Eye pain', 'Redness', 'Light sensitivity', 'Blurred vision'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9E02',
        title: 'Macular Hole',
        category: 'Retinal Disorders',
        description: 'Small break in the macula',
        symptoms: ['Central vision distortion', 'Blurred central vision', 'Straight lines appear wavy'],
        urgency: 'Urgent',
        requiresSurgery: true
    },
    {
        code: '9E03',
        title: 'Epiretinal Membrane',
        category: 'Retinal Disorders',
        description: 'Thin membrane on the retinal surface',
        symptoms: ['Distorted vision', 'Blurred vision', 'Difficulty reading'],
        urgency: 'Routine',
        requiresSurgery: true
    },
    {
        code: '9E04',
        title: 'Central Serous Retinopathy',
        category: 'Retinal Disorders',
        description: 'Fluid accumulation under the retina',
        symptoms: ['Central vision blur', 'Distortion', 'Dim vision', 'Central scotoma'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9E05',
        title: 'Retinal Vein Occlusion',
        category: 'Retinal Disorders',
        description: 'Blockage of retinal vein',
        symptoms: ['Sudden vision loss', 'Blurred vision', 'Floaters'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9E06',
        title: 'Retinal Artery Occlusion',
        category: 'Retinal Disorders',
        description: 'Blockage of retinal artery',
        symptoms: ['Sudden painless vision loss', 'Cherry red spot'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9A63',
        title: 'Keratitis',
        category: 'Corneal Disorders',
        description: 'Inflammation of the cornea',
        symptoms: ['Eye pain', 'Redness', 'Light sensitivity', 'Discharge', 'Blurred vision'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9A64',
        title: 'Corneal Abrasion',
        category: 'Corneal Disorders',
        description: 'Scratch on the corneal surface',
        symptoms: ['Severe pain', 'Tearing', 'Light sensitivity', 'Foreign body sensation'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9A65',
        title: 'Fuchs Dystrophy',
        category: 'Corneal Disorders',
        description: 'Progressive corneal endothelial disease',
        symptoms: ['Morning blur', 'Glare', 'Halos', 'Gradual vision loss'],
        urgency: 'Routine',
        requiresSurgery: true
    },
    {
        code: '9C62',
        title: 'Normal Tension Glaucoma',
        category: 'Glaucoma',
        description: 'Optic nerve damage with normal eye pressure',
        symptoms: ['Peripheral vision loss', 'Usually asymptomatic'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9C63',
        title: 'Pigmentary Glaucoma',
        category: 'Glaucoma',
        description: 'Glaucoma caused by pigment dispersion',
        symptoms: ['Blurred vision after exercise', 'Halos', 'Gradual vision loss'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9C64',
        title: 'Pseudoexfoliation Glaucoma',
        category: 'Glaucoma',
        description: 'Glaucoma with white flaky material on lens',
        symptoms: ['Gradual vision loss', 'Elevated eye pressure'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9A03',
        title: 'Hordeolum (Stye)',
        category: 'Orbital and Eyelid Disorders',
        description: 'Infection of eyelid gland',
        symptoms: ['Painful lump on eyelid', 'Swelling', 'Redness', 'Tearing'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9A04',
        title: 'Entropion',
        category: 'Orbital and Eyelid Disorders',
        description: 'Inward turning of eyelid',
        symptoms: ['Eye irritation', 'Tearing', 'Redness', 'Foreign body sensation'],
        urgency: 'Routine',
        requiresSurgery: true
    },
    {
        code: '9A05',
        title: 'Ectropion',
        category: 'Orbital and Eyelid Disorders',
        description: 'Outward turning of eyelid',
        symptoms: ['Excessive tearing', 'Dry eyes', 'Irritation', 'Redness'],
        urgency: 'Routine',
        requiresSurgery: true
    },
    {
        code: '9A75',
        title: 'Pinguecula',
        category: 'Conjunctival Disorders',
        description: 'Yellowish growth on conjunctiva',
        symptoms: ['Visible yellow bump', 'Irritation', 'Redness'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9A76',
        title: 'Subconjunctival Hemorrhage',
        category: 'Conjunctival Disorders',
        description: 'Blood under the conjunctiva',
        symptoms: ['Bright red patch on white of eye', 'Usually painless'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9C82',
        title: 'Papilledema',
        category: 'Optic Nerve Disorders',
        description: 'Optic disc swelling from increased intracranial pressure',
        symptoms: ['Headache', 'Vision changes', 'Nausea', 'Double vision'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9C83',
        title: 'Ischemic Optic Neuropathy',
        category: 'Optic Nerve Disorders',
        description: 'Optic nerve damage from poor blood flow',
        symptoms: ['Sudden vision loss', 'Altitudinal field defect'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9D52',
        title: 'Nystagmus',
        category: 'Motility Disorders',
        description: 'Involuntary eye movements',
        symptoms: ['Rhythmic eye movements', 'Reduced vision', 'Head tilting'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9D53',
        title: 'Diplopia',
        category: 'Motility Disorders',
        description: 'Double vision',
        symptoms: ['Seeing two images', 'Eye misalignment', 'Headache'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9E07',
        title: 'Ocular Hypertension',
        category: 'Other Eye Disorders',
        description: 'Elevated eye pressure without optic nerve damage',
        symptoms: ['Usually asymptomatic', 'Elevated IOP on exam'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9E08',
        title: 'Vitreous Hemorrhage',
        category: 'Other Eye Disorders',
        description: 'Bleeding into the vitreous cavity',
        symptoms: ['Sudden floaters', 'Vision loss', 'Red haze', 'Shadows'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9E09',
        title: 'Posterior Vitreous Detachment',
        category: 'Other Eye Disorders',
        description: 'Separation of vitreous from retina',
        symptoms: ['Sudden floaters', 'Flashes of light', 'Usually benign'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9E10',
        title: 'Endophthalmitis',
        category: 'Other Eye Disorders',
        description: 'Severe infection inside the eye',
        symptoms: ['Severe pain', 'Vision loss', 'Redness', 'Discharge'],
        urgency: 'Emergency',
        requiresSurgery: true
    },
    {
        code: '9E11',
        title: 'Orbital Cellulitis',
        category: 'Orbital and Eyelid Disorders',
        description: 'Infection of tissues around the eye',
        symptoms: ['Swelling', 'Pain', 'Fever', 'Limited eye movement', 'Vision changes'],
        urgency: 'Emergency',
        requiresSurgery: false
    },
    {
        code: '9E12',
        title: 'Thyroid Eye Disease',
        category: 'Orbital and Eyelid Disorders',
        description: 'Eye problems related to thyroid disorder',
        symptoms: ['Bulging eyes', 'Double vision', 'Dry eyes', 'Lid retraction'],
        urgency: 'Urgent',
        requiresSurgery: false
    },
    {
        code: '9B76',
        title: 'Retinitis Pigmentosa',
        category: 'Retinal Disorders',
        description: 'Inherited retinal degeneration',
        symptoms: ['Night blindness', 'Tunnel vision', 'Progressive vision loss'],
        urgency: 'Routine',
        requiresSurgery: false
    },
    {
        code: '9B77',
        title: 'Macular Edema',
        category: 'Retinal Disorders',
        description: 'Swelling of the macula',
        symptoms: ['Blurred central vision', 'Distorted vision', 'Color changes'],
        urgency: 'Urgent',
        requiresSurgery: false
    }
];

module.exports = commonEyeDiseases;
