const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const commonEyeDiseases = require('../data/commonEyeDiseases');

const prisma = new PrismaClient();

// ICD-11 API Configuration (API v2)
const ICD11_API_BASE = 'https://id.who.int/icd';
const ICD11_TOKEN_URL = 'https://icdaccessmanagement.who.int/connect/token';
const ICD11_RELEASE = 'release/11/2023-01'; // Stable release
const ICD11_LINEARIZATION = 'mms'; // Mortality and Morbidity Statistics linearization

class DiagnosisMasterController {
    // Get ICD-11 access token
    async getICD11Token() {
        try {
            console.log('🔑 Attempting to get ICD-11 token...');
            console.log('Client ID:', process.env.ICD11_CLIENT_ID ? 'Present' : 'Missing');
            console.log('Client Secret:', process.env.ICD11_CLIENT_SECRET ? 'Present' : 'Missing');

            const response = await axios.post(ICD11_TOKEN_URL,
                'client_id=' + process.env.ICD11_CLIENT_ID +
                '&client_secret=' + process.env.ICD11_CLIENT_SECRET +
                '&scope=icdapi_access&grant_type=client_credentials',
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            console.log('✅ ICD-11 token obtained successfully');
            return response.data.access_token;
        } catch (error) {
            console.error('❌ Error getting ICD-11 token:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            if (error.response?.status === 400) {
                throw new Error('Invalid ICD-11 API credentials. Please check your CLIENT_ID and CLIENT_SECRET.');
            } else if (error.response?.status === 401) {
                throw new Error('ICD-11 API credentials are unauthorized. Please verify your account status.');
            } else {
                throw new Error(`Failed to authenticate with ICD-11 API: ${error.message}`);
            }
        }
    }

    // Fetch eye-related diseases from ICD-11
    async fetchEyeDiseases(req, res) {
        try {
            console.log('🔍 Starting to fetch eye diseases from ICD-11...');
            const token = await this.getICD11Token();

            // Step 1: Get the root of MMS linearization to find all chapters
            const rootUrl = `${ICD11_API_BASE}/${ICD11_RELEASE}/${ICD11_LINEARIZATION}`;
            console.log('📡 Fetching root linearization from:', rootUrl);

            const rootResponse = await axios.get(rootUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Accept-Language': 'en',
                    'API-Version': 'v2'
                }
            });

            console.log('✅ Root fetched successfully');
            console.log('Total chapters:', rootResponse.data.child?.length || 0);

            // Step 2: Chapter 09 is the 9th chapter (index 8)
            // ICD-11 chapters are ordered: 01, 02, 03... 09 is at index 8
            const eyeChapterUri = rootResponse.data.child?.[8];

            if (!eyeChapterUri) {
                throw new Error('Chapter 09 not found at expected index');
            }

            console.log('📡 Fetching Chapter 09 from:', eyeChapterUri);

            const response = await axios.get(eyeChapterUri, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Accept-Language': 'en',
                    'API-Version': 'v2'
                }
            });

            console.log('✅ Successfully fetched chapter data');
            console.log('Chapter title:', response.data.title);
            console.log('Chapter code:', response.data.code);
            console.log('Number of children:', response.data.child?.length || 0);

            const eyeDiseases = await this.processEyeChapter(response.data, token);
            console.log(`✅ Processed ${eyeDiseases.length} eye diseases`);

            res.json({
                success: true,
                message: 'Eye diseases fetched successfully',
                data: {
                    totalDiseases: eyeDiseases.length,
                    diseases: eyeDiseases
                }
            });
        } catch (error) {
            console.error('❌ Error fetching eye diseases:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                url: error.config?.url
            });

            let errorMessage = 'Failed to fetch eye diseases from ICD-11';
            let statusCode = 500;

            if (error.message.includes('Invalid ICD-11 API credentials')) {
                errorMessage = 'Invalid ICD-11 API credentials. Please check configuration.';
                statusCode = 401;
            } else if (error.response?.status === 404) {
                errorMessage = 'ICD-11 chapter not found. The API structure may have changed.';
                statusCode = 404;
            } else if (error.response?.status === 403) {
                errorMessage = 'Access denied to ICD-11 API. Please check your account permissions.';
                statusCode = 403;
            }

            res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: error.message,
                details: error.response?.data || null
            });
        }
    }

    // Process eye chapter and extract diseases
    async processEyeChapter(chapterData, token) {
        const diseases = [];

        if (chapterData.child) {
            for (const childUrl of chapterData.child) {
                try {
                    const childResponse = await axios.get(childUrl, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'Accept-Language': 'en',
                            'API-Version': 'v2'
                        }
                    });

                    const childData = childResponse.data;

                    // Process this disease/category
                    const disease = this.extractDiseaseInfo(childData);
                    if (disease) {
                        diseases.push(disease);
                    }

                    // Recursively process children
                    if (childData.child && childData.child.length > 0) {
                        const childDiseases = await this.processEyeChapter(childData, token);
                        diseases.push(...childDiseases);
                    }
                } catch (error) {
                    console.error('Error processing child:', childUrl, error.message);
                }
            }
        }

        return diseases;
    }

    // Extract disease information from ICD-11 data
    extractDiseaseInfo(data) {
        if (!data.title || !data.code) return null;

        return {
            foundationId: data.id || data['@id'],
            code: data.code,
            title: data.title,
            definition: data.definition || null,
            chapter: '09', // Visual system chapter
            isEyeRelated: true,
            ophthalmologyCategory: this.categorizeOphthalmologyDisease(data.title, data.code),
            inclusionTerms: data.inclusion || null,
            exclusionTerms: data.exclusion || null,
            isActive: true
        };
    }

    // Categorize ophthalmology diseases
    categorizeOphthalmologyDisease(title, code) {
        const titleLower = JSON.stringify(title).toLowerCase();

        if (titleLower.includes('retina') || titleLower.includes('macula')) {
            return 'Retinal Disorders';
        } else if (titleLower.includes('glaucoma')) {
            return 'Glaucoma';
        } else if (titleLower.includes('cataract') || titleLower.includes('lens')) {
            return 'Lens Disorders';
        } else if (titleLower.includes('cornea')) {
            return 'Corneal Disorders';
        } else if (titleLower.includes('conjunctiva')) {
            return 'Conjunctival Disorders';
        } else if (titleLower.includes('eyelid') || titleLower.includes('orbit')) {
            return 'Orbital and Eyelid Disorders';
        } else if (titleLower.includes('optic') || titleLower.includes('nerve')) {
            return 'Optic Nerve Disorders';
        } else if (titleLower.includes('refract') || titleLower.includes('myopia') || titleLower.includes('hyperopia')) {
            return 'Refractive Errors';
        } else if (titleLower.includes('strabismus') || titleLower.includes('diplopia')) {
            return 'Motility Disorders';
        } else {
            return 'Other Eye Disorders';
        }
    }

    // Import diseases to database
    async importDiseases(req, res) {
        try {
            const { diseases } = req.body;

            if (!diseases || !Array.isArray(diseases)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid diseases data provided'
                });
            }

            const results = {
                imported: 0,
                updated: 0,
                errors: []
            };

            for (const diseaseData of diseases) {
                try {
                    // Check if ICD code already exists
                    const existingIcd = await prisma.icd11Code.findUnique({
                        where: { foundationId: diseaseData.foundationId }
                    });

                    let icd11Code;
                    if (existingIcd) {
                        // Update existing
                        icd11Code = await prisma.icd11Code.update({
                            where: { foundationId: diseaseData.foundationId },
                            data: diseaseData
                        });
                        results.updated++;
                    } else {
                        // Create new
                        icd11Code = await prisma.icd11Code.create({
                            data: diseaseData
                        });
                        results.imported++;
                    }

                    // Create corresponding disease entry if it doesn't exist
                    const existingDisease = await prisma.disease.findFirst({
                        where: { icd11CodeId: icd11Code.id }
                    });

                    if (!existingDisease) {
                        await prisma.disease.create({
                            data: {
                                icd11CodeId: icd11Code.id,
                                diseaseName: diseaseData.title,
                                commonNames: null,
                                ophthalmologyCategory: diseaseData.ophthalmologyCategory,
                                affectedStructure: null,
                                eyeAffected: 'Both',
                                symptoms: null,
                                signs: null,
                                diagnosticCriteria: null,
                                treatmentProtocols: null,
                                surgicalOptions: null,
                                prognosis: null,
                                visualImpactLevel: 'Unknown',
                                urgencyLevel: 'Routine',
                                isChronic: false,
                                requiresSurgery: false,
                                affectsVision: true
                            }
                        });
                    }
                } catch (error) {
                    results.errors.push({
                        foundationId: diseaseData.foundationId,
                        error: error.message
                    });
                }
            }

            res.json({
                success: true,
                message: 'Diseases import completed',
                data: results
            });
        } catch (error) {
            console.error('Error importing diseases:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to import diseases',
                error: error.message
            });
        }
    }

    // Get current diagnosis master data
    async getDiagnosisMaster(req, res) {
        try {
            const { page = 1, limit = 50, search = '', category = '' } = req.query;
            const skip = (page - 1) * limit;

            // Build search conditions for better partial matching
            let searchConditions = [];
            if (search) {
                // Split search term into words for better matching
                const searchWords = search.trim().toLowerCase().split(/\s+/);

                // For each word, create OR conditions
                searchWords.forEach(word => {
                    if (word.length > 0) {
                        searchConditions.push(
                            { code: { contains: word, mode: 'insensitive' } },
                            { title: { path: ['@value'], string_contains: word } },
                            { ophthalmologyCategory: { contains: word, mode: 'insensitive' } }
                        );
                    }
                });
            }

            const where = {
                isEyeRelated: true,
                isActive: true,
                ...(searchConditions.length > 0 && { OR: searchConditions }),
                ...(category && { ophthalmologyCategory: category })
            };

            const [icdCodes, total] = await Promise.all([
                prisma.icd11Code.findMany({
                    where,
                    include: {
                        diseases: true
                    },
                    skip: parseInt(skip),
                    take: parseInt(limit),
                    orderBy: { code: 'asc' }
                }),
                prisma.icd11Code.count({ where })
            ]);

            // Get categories for filter
            const categories = await prisma.icd11Code.findMany({
                where: { isEyeRelated: true, isActive: true },
                select: { ophthalmologyCategory: true },
                distinct: ['ophthalmologyCategory']
            });

            res.json({
                success: true,
                data: {
                    icdCodes,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    },
                    categories: categories.map(c => c.ophthalmologyCategory).filter(Boolean)
                }
            });
        } catch (error) {
            console.error('Error fetching diagnosis master:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch diagnosis master data',
                error: error.message
            });
        }
    }

    // Update disease details
    async updateDisease(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const disease = await prisma.disease.update({
                where: { id },
                data: updateData,
                include: {
                    icd11Code: true
                }
            });

            res.json({
                success: true,
                message: 'Disease updated successfully',
                data: disease
            });
        } catch (error) {
            console.error('Error updating disease:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update disease',
                error: error.message
            });
        }
    }

    // Delete disease
    async deleteDisease(req, res) {
        try {
            const { id } = req.params;

            await prisma.disease.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Disease deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting disease:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete disease',
                error: error.message
            });
        }
    }

    // Search diagnoses for autocomplete (optimized)
    async searchDiagnoses(req, res) {
        try {
            const { q = '', limit = 10 } = req.query;

            if (!q || q.length < 2) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const searchTerm = q.trim().toLowerCase();

            // Fetch all active eye-related ICD codes
            const allCodes = await prisma.icd11Code.findMany({
                where: {
                    isEyeRelated: true,
                    isActive: true
                },
                include: {
                    diseases: true
                }
            });

            // Score and filter results
            const scoredResults = allCodes
                .map(icd => {
                    const code = (icd.code || '').toLowerCase();
                    const title = typeof icd.title === 'object'
                        ? (icd.title['@value'] || '').toLowerCase()
                        : (icd.title || '').toLowerCase();
                    const category = (icd.ophthalmologyCategory || '').toLowerCase();

                    let score = 0;

                    // Exact code match (highest priority)
                    if (code === searchTerm) {
                        score += 1000;
                    } else if (code.startsWith(searchTerm)) {
                        score += 500;
                    } else if (code.includes(searchTerm)) {
                        score += 100;
                    }

                    // Title word matching
                    const titleWords = title.split(/\s+/);
                    titleWords.forEach(word => {
                        if (word === searchTerm) {
                            score += 200; // Exact word match
                        } else if (word.startsWith(searchTerm)) {
                            score += 150; // Word starts with search term
                        } else if (word.includes(searchTerm)) {
                            score += 50; // Word contains search term
                        }
                    });

                    // Full title match
                    if (title.includes(searchTerm)) {
                        score += 75;
                    }

                    // Category match
                    if (category.includes(searchTerm)) {
                        score += 25;
                    }

                    return { icd, score };
                })
                .filter(item => item.score > 0) // Only include matches
                .sort((a, b) => b.score - a.score) // Sort by score descending
                .slice(0, parseInt(limit)) // Limit results
                .map(item => item.icd); // Extract ICD codes

            res.json({
                success: true,
                data: scoredResults
            });
        } catch (error) {
            console.error('Error searching diagnoses:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search diagnoses',
                error: error.message
            });
        }
    }

    // Get statistics
    async getStatistics(req, res) {
        try {
            const [
                totalIcdCodes,
                totalDiseases,
                categoryCounts,
                recentImports
            ] = await Promise.all([
                prisma.icd11Code.count({ where: { isEyeRelated: true, isActive: true } }),
                prisma.disease.count(),
                prisma.icd11Code.groupBy({
                    by: ['ophthalmologyCategory'],
                    where: { isEyeRelated: true, isActive: true },
                    _count: true
                }),
                prisma.icd11Code.findMany({
                    where: { isEyeRelated: true, isActive: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        ophthalmologyCategory: true,
                        createdAt: true
                    }
                })
            ]);

            res.json({
                success: true,
                data: {
                    totalIcdCodes,
                    totalDiseases,
                    categoryCounts,
                    recentImports
                }
            });
        } catch (error) {
            console.error('Error fetching statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics',
                error: error.message
            });
        }
    }

    // Seed common eye diseases (Quick setup without ICD-11 API)
    async seedCommonDiseases(req, res) {
        try {
            console.log('🌱 Starting to seed common eye diseases...');

            const results = {
                imported: 0,
                updated: 0,
                skipped: 0,
                errors: []
            };

            for (const diseaseData of commonEyeDiseases) {
                try {
                    // Create a mock foundation ID from the code
                    const foundationId = `http://id.who.int/icd/entity/mock/${diseaseData.code}`;

                    // Check if already exists
                    const existing = await prisma.icd11Code.findUnique({
                        where: { foundationId }
                    });

                    if (existing) {
                        results.skipped++;
                        continue;
                    }

                    // Create ICD code
                    const icd11Code = await prisma.icd11Code.create({
                        data: {
                            foundationId,
                            code: diseaseData.code,
                            title: { '@value': diseaseData.title },
                            definition: { '@value': diseaseData.description },
                            chapter: '09',
                            isEyeRelated: true,
                            ophthalmologyCategory: diseaseData.category,
                            inclusionTerms: null,
                            exclusionTerms: null,
                            isActive: true
                        }
                    });

                    // Create disease
                    await prisma.disease.create({
                        data: {
                            icd11CodeId: icd11Code.id,
                            diseaseName: { '@value': diseaseData.title },
                            commonNames: null,
                            ophthalmologyCategory: diseaseData.category,
                            affectedStructure: null,
                            eyeAffected: 'Both',
                            symptoms: { '@value': diseaseData.symptoms.join(', ') },
                            signs: null,
                            diagnosticCriteria: null,
                            treatmentProtocols: null,
                            surgicalOptions: null,
                            prognosis: null,
                            visualImpactLevel: 'Moderate',
                            urgencyLevel: diseaseData.urgency,
                            isChronic: false,
                            requiresSurgery: diseaseData.requiresSurgery,
                            affectsVision: true
                        }
                    });

                    results.imported++;
                } catch (error) {
                    results.errors.push({
                        code: diseaseData.code,
                        error: error.message
                    });
                }
            }

            console.log(`✅ Seeding complete: ${results.imported} imported, ${results.skipped} skipped`);
            console.log(`📊 Total diseases in dataset: ${commonEyeDiseases.length}`);

            res.json({
                success: true,
                message: 'Common eye diseases seeded successfully',
                data: results
            });
        } catch (error) {
            console.error('Error seeding diseases:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to seed common diseases',
                error: error.message
            });
        }
    }
}

module.exports = new DiagnosisMasterController();