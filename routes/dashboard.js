const express = require('express');
const router = express.Router();
const { Brand, User } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dns = require('dns').promises;
const { Plan } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware to set dashboard layout and common variables
router.use(isAuthenticated, async (req, res, next) => {
    res.locals.layout = 'layouts/dashboard-layout';
    try {
        // Set default values for layout variables
        res.locals.brands = [];
        res.locals.currentBrand = null;
        res.locals.activePage = 'dashboard';
        res.locals.canCreateMoreBrands = true;
        
        // Fetch user's brands
        const brands = await Brand.findAll({ 
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']]
        });
        
        res.locals.brands = brands;
        
        // Check if user can create more brands based on their plan
        if (req.user.plan) {
            const brandCount = brands.length;
            res.locals.canCreateMoreBrands = brandCount < req.user.plan.maxBrands;
        }
        
        // If there's a brand ID in the URL, set it as current brand
        if (req.params.id) {
            const currentBrand = brands.find(brand => brand.id === parseInt(req.params.id));
            if (currentBrand) {
                res.locals.currentBrand = currentBrand;
            }
        }
        
        next();
    } catch (error) {
        console.error('Error in dashboard middleware:', error);
        req.flash('error', 'An error occurred while loading the dashboard');
        res.redirect('/');
    }
});

// Helper function to extract section content
function extractSection(content, sectionName) {
    // Create a regex that matches the section name followed by a colon and captures all content until the next numbered section
    const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n\\d+\\.|$)`, 'i');
    const match = content.match(regex);
    
    if (!match) {
        console.log(`No match found for section: ${sectionName}`);
        return '';
    }
    
    const extractedContent = match[1].trim();
    console.log(`Extracted content for ${sectionName}:`, extractedContent.substring(0, 100) + '...');
    return extractedContent;
}

// Helper function to check domain availability
async function checkDomainAvailability(domain) {
    try {
        await dns.lookup(domain);
        return false; // Domain exists
    } catch (error) {
        if (error.code === 'ENOTFOUND') {
            return true; // Domain is available
        }
        return false; // Error occurred, assume domain is taken
    }
}

// Helper function to generate domain recommendations
async function generateDomainRecommendations(brandName) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate 5 domain name recommendations for the brand "${brandName}".
    Consider:
    1. The brand name itself
    2. Common variations (e.g., adding 'get', 'my', 'the')
    3. Industry-specific terms
    4. Memorable and brandable options
    
    Important rules:
    - Do NOT include TLDs in the domain name
    - Only use the name part in the 'name' field
    - Use ONLY these TLDs in the 'extension' field: .com, .io, .co, .app, .design, .studio
    - Do NOT combine TLDs (e.g., don't use .com.io)
    
    Example format:
    [
        {"name": "brandname", "extension": ".com"},
        {"name": "getbrandname", "extension": ".io"}
    ]
    
    Return only the JSON array, no markdown formatting or other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove any markdown formatting if present
    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
        const recommendations = JSON.parse(cleanJson);
        console.log('Parsed domain recommendations:', recommendations);

        // Validate and clean recommendations
        const cleanedRecommendations = recommendations.map(rec => {
            // Remove any TLDs from the name
            const cleanName = rec.name.replace(/\.(com|io|co|app|design|studio)$/i, '');
            return {
                name: cleanName,
                extension: rec.extension
            };
        });

        // Check availability for each domain
        const domainsWithAvailability = await Promise.all(
            cleanedRecommendations.map(async (domain) => {
                const fullDomain = `${domain.name}${domain.extension}`;
                const available = await checkDomainAvailability(fullDomain);
                return { ...domain, available };
            })
        );

        return domainsWithAvailability;
    } catch (error) {
        console.error('Error parsing domain recommendations:', error);
        console.error('Raw response:', text);
        return [];
    }
}

// Helper function to generate logo description
async function generateLogoDescription(brandName, brandDescription, visualIdentity) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Create a detailed logo design description for the brand "${brandName}" based on the following information:

Brand Description: ${brandDescription}

Visual Identity Guidelines: ${visualIdentity}

Provide a detailed description of the logo design that includes:
1. Logo type (e.g., wordmark, lettermark, pictorial mark, abstract mark, mascot, combination mark)
2. Color scheme (using the brand's color palette)
3. Typography style and characteristics
4. Symbol or icon description (if applicable)
5. Layout and composition
6. Style and aesthetic approach
7. Specific design elements and their meaning
8. How the logo reflects the brand's values and personality

Format the response as a structured description that can be used by a designer to create the logo.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Dashboard home
router.get('/', async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: ['plan']
        });
        
        res.render('dashboard/index', {
            title: 'Dashboard',
            user,
            activePage: 'dashboard',
            currentBrand: null,
            canCreateMoreBrands: res.locals.canCreateMoreBrands
        });
    } catch (error) {
        next(error);
    }
});

// Brand profile
router.get('/brand/:id', async (req, res, next) => {
    try {
        const brand = await Brand.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!brand) {
            req.flash('error', 'Brand not found');
            return res.redirect('/dashboard');
        }

        res.render('dashboard/brand-profile', {
            title: 'Brand Profile',
            brand,
            activePage: 'brand-profile',
            currentBrand: brand
        });
    } catch (error) {
        next(error);
    }
});

// Calendar
router.get('/calendar', async (req, res) => {
    res.render('dashboard/calendar', {
        title: 'Calendar',
        activePage: 'calendar',
        currentBrand: null
    });
});

// Blogs
router.get('/blogs', async (req, res) => {
    res.render('dashboard/blogs', {
        title: 'Blogs',
        activePage: 'blogs',
        currentBrand: null
    });
});

// Posts
router.get('/posts', async (req, res) => {
    res.render('dashboard/posts', {
        title: 'Posts',
        activePage: 'posts',
        currentBrand: null
    });
});

// Generate brand
router.post('/generate-brand', isAuthenticated, async (req, res) => {
    try {
        const { brandName, companyDescription } = req.body;

        // Check if user already has a brand
        const existingBrand = await Brand.findOne({
            where: { user_id: req.user.id }
        });

        if (existingBrand) {
            req.flash('error', 'You already have a brand. Please delete it first to create a new one.');
            return res.redirect('/dashboard');
        }

        // Generate domain recommendations
        console.log('Generating domain recommendations...');
        const domainRecommendations = await generateDomainRecommendations(brandName);
        console.log('Domain recommendations generated:', domainRecommendations);

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Generate brand content
        const prompt = `Create a comprehensive brand strategy for "${brandName}" based on the following company description:

${companyDescription}

IMPORTANT: You must return ONLY a valid JSON object with no additional text, no markdown formatting, and no code blocks. The response should start with { and end with }.

The JSON object must have the absolute following structure. Each field should contain 3-5 paragraphs of detailed content:

{
    "brandPositioning": "Define the brand's unique position in the market, its core differentiators, and how it wants to be perceived by customers.",
    "targetAudience": "Describe the primary and secondary target audiences in detail, including demographics, psychographics, behaviors, needs, and pain points.",
    "brandPurpose": "Explain the brand's mission, vision, and core values. What problem does it solve? What impact does it want to make?",
    "marketingStrategy": "Outline the key marketing goals, strategies, and tactics to reach the target audience and achieve business objectives.",
    "visualIdentity": "Describe the brand's visual elements, including logo design principles, typography preferences, and overall aesthetic direction.",
    "imageryStyle": "Define the brand's photography and illustration style in detail, including types of images, color treatment, composition guidelines, subject matter preferences, mood, lighting style, and quality requirements.",
    "brandMessaging": "Develop key messages and value propositions that communicate the brand's benefits and resonate with the target audience.",
    "brandVoice": "Define the tone, style, and personality of the brand's communication across all channels.",
    "competitiveAnalysis": "List and analyze the top 4 direct competitors, including their strengths, weaknesses, market position, and how they differentiate from our brand. The response must be plain text only. Do not use any markdown, bullet points, or special formatting. Use clear paragraphs and plain sentences.",
    "brandPersonality": "Describe the human characteristics and traits that define the brand's personality and how they manifest in communications.",
    "marketingEfforts": "Detail how all marketing activities will work together to create a consistent brand experience.",
    "longTermPerspective": "Outline the brand's growth strategy, future opportunities, and how it plans to evolve over time.",
    "brandVision": "Paint a picture of what the brand aims to achieve in the future and how it will impact its industry and customers.",
    "marketingToolkit": "List and describe the key marketing assets, tools, and resources needed to implement the brand strategy.",
    "strategicManagement": "Explain how the brand will be managed, monitored, and evolved over time to maintain relevance and effectiveness.",
    "brandStory": "Craft a compelling narrative that tells the brand's story, including its origins, journey, and future aspirations.",
    "websiteRecommendations": "Provide specific guidance for website design, content structure, and user experience that aligns with the brand.",
    "valueProposition": "Clearly articulate the unique value the brand offers to customers and why they should choose it over alternatives.",
    "slogan": "Create a memorable, impactful slogan that captures the essence of the brand and resonates with the target audience.",
    "colorPalette": [
        {
            "hex": "#HEXCODE",
            "description": "Detailed explanation of why this color was chosen and how it should be used"
        }
    ],
    "typography": "Recommend specific font families for body copy, titles, headlines, and subtitles. For each, specify font sizes for Mobile, Tablet, and Desktop. Include guidance for font weights, line heights, and any usage notes. The response must be plain text only, no markdown or bullet points. Use clear section headers for each text type.",
    "marketingInsights": "Provide detailed analysis of market trends, customer behavior patterns, competitive landscape, growth opportunities, challenges, KPIs, channel effectiveness, acquisition strategies, retention programs, and ROI measurement.",
    "idealCustomerProfile": "Create a detailed profile of the perfect customer, including demographics, psychographics, professional background, pain points, goals, buying behavior, communication preferences, decision-making process, brand loyalty factors, and lifetime value potential."
}`;

        console.log('Sending request to Gemini API...');
        const result = await model.generateContent(prompt);
        console.log('Received response from Gemini API');
        
        const response = await result.response;
        let brandContent = response.text().trim();
        console.log('Successfully processed brand content');
        console.log('brand content:', brandContent);

        // Clean up the response to ensure it's valid JSON
        brandContent = brandContent
            .replace(/```json\n?/g, '') // Remove ```json prefix
            .replace(/```\n?/g, '')     // Remove ``` suffix
            .replace(/^[^{]*/, '')      // Remove any text before the first {
            .replace(/[^}]*$/, '')      // Remove any text after the last }
            .trim();

        // Parse the JSON response
        let brandData;
        try {
            brandData = JSON.parse(brandContent);
        } catch (error) {
            console.error('Error parsing brand content:', error);
            console.error('Cleaned content:', brandContent);
            throw new Error('Failed to parse brand content from AI response');
        }

        // Generate logo description
        console.log('Generating logo description...');
        const logoDescription = await generateLogoDescription(brandName, companyDescription, brandData.visualIdentity);
        console.log('Logo description generated');

        // Create brand in database
        await Brand.create({
            user_id: req.user.id,
            name: brandName,
            position: brandData.brandPositioning,
            target_audience: brandData.targetAudience,
            purpose: brandData.brandPurpose,
            marketing_strategy: brandData.marketingStrategy,
            visual_identity: brandData.visualIdentity,
            imagery_style: brandData.imageryStyle,
            messaging: brandData.brandMessaging,
            brand_voice: brandData.brandVoice,
            competitive_analysis: brandData.competitiveAnalysis,
            personality: brandData.brandPersonality,
            marketing_efforts: brandData.marketingEfforts,
            long_term_perspective: brandData.longTermPerspective,
            brand_vision: brandData.brandVision,
            marketing_toolkit: brandData.marketingToolkit,
            strategic_management: brandData.strategicManagement,
            brand_story: brandData.brandStory,
            website_recommendations: brandData.websiteRecommendations,
            value_proposition: brandData.valueProposition,
            slogan: brandData.slogan,
            color_palette: JSON.stringify(brandData.colorPalette),
            domain_recommendations: JSON.stringify(domainRecommendations),
            marketing_insights: brandData.marketingInsights,
            ideal_customer_profile: brandData.idealCustomerProfile,
            typography: brandData.typography
        });

        req.flash('success', 'Brand generated successfully!');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error generating brand:', error);
        req.flash('error', `An error occurred while generating your brand: ${error.message}`);
        res.redirect('/dashboard');
    }
});

// Delete brand
router.post('/brand/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const brand = await Brand.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!brand) {
            req.flash('error', 'Brand not found');
            return res.redirect('/dashboard');
        }

        await brand.destroy();
        req.flash('success', 'Brand deleted successfully');
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while deleting the brand');
        res.redirect('/dashboard');
    }
});

// Get plans page
router.get('/plans', isAuthenticated, async (req, res) => {
    try {
        const plans = await Plan.findAll({ where: { isActive: true } });
        res.render('dashboard/plans', { 
            user: req.user,
            plans,
            csrfToken: req.csrfToken(),
            hideFooter: true
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        req.flash('error', 'Error loading plans. Please try again.');
        res.redirect('/dashboard');
    }
});

// Handle plan upgrade
router.post('/plans/upgrade', isAuthenticated, async (req, res) => {
    try {
        const { plan } = req.body;
        const selectedPlan = await Plan.findOne({ where: { name: plan, isActive: true } });
        
        if (!selectedPlan) {
            req.flash('error', 'Invalid plan selected.');
            return res.redirect('/dashboard/plans');
        }

        // Here you would typically integrate with a payment processor
        // For now, we'll just update the user's plan
        req.user.plan_id = selectedPlan.id;
        req.user.subscriptionStatus = 'active';
        req.user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        await req.user.save();

        req.flash('success', `Successfully upgraded to ${selectedPlan.name} plan!`);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error upgrading plan:', error);
        req.flash('error', 'Error upgrading plan. Please try again.');
        res.redirect('/dashboard/plans');
    }
});

// Handle plan downgrade
router.post('/plans/downgrade', isAuthenticated, async (req, res) => {
    try {
        const freePlan = await Plan.findOne({ where: { name: 'free', isActive: true } });
        
        if (!freePlan) {
            req.flash('error', 'Error finding free plan.');
            return res.redirect('/dashboard/plans');
        }

        // Check if user has more brands than allowed in free plan
        const userBrands = await req.user.getBrands();
        if (userBrands.length > freePlan.maxBrands) {
            req.flash('error', `Please delete some brands before downgrading. Free plan allows only ${freePlan.maxBrands} brand(s).`);
            return res.redirect('/dashboard/plans');
        }

        req.user.plan_id = freePlan.id;
        req.user.subscriptionStatus = 'inactive';
        req.user.subscriptionEndDate = null;
        await req.user.save();

        req.flash('success', 'Successfully downgraded to free plan.');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error downgrading plan:', error);
        req.flash('error', 'Error downgrading plan. Please try again.');
        res.redirect('/dashboard/plans');
    }
});

module.exports = router; 