const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error_msg', 'Please login to access this page');
        res.redirect('/auth/login');
    }
};

// Generate brand
router.post('/generate', isAuthenticated, async (req, res) => {
    try {
        const { brandName } = req.body;

        // Check if user already has a brand
        const [existingBrands] = await db.query(
            'SELECT * FROM brands WHERE user_id = ?',
            [req.session.user.id]
        );

        if (existingBrands.length > 0) {
            req.flash('error_msg', 'You already have a brand. Please delete it first to create a new one.');
            return res.redirect('/dashboard');
        }

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Generate brand content
        const prompt = `Create a comprehensive brand strategy for "${brandName}". Include:
        1. Brand positioning
        2. Target audience
        3. Brand purpose
        4. Marketing strategy objectives
        5. Visual identity
        6. Brand messaging
        7. Brand voice
        8. Competitive analysis
        9. Brand personality
        10. Marketing efforts alignment
        11. Competitor analysis
        12. Long-term perspective
        13. Brand vision
        14. Marketing toolkit
        15. Strategic management
        16. Brand story
        17. Website development recommendations
        18. Value proposition
        19. Slogan
        20. Color palette with hex codes and explanations for each color choice`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const brandContent = response.text();

        // Parse the response and extract color palette
        const colorPaletteMatch = brandContent.match(/Color palette:([\s\S]*?)(?=\n\n|$)/);
        const colorPalette = colorPaletteMatch ? colorPaletteMatch[1].trim() : null;

        // Create brand in database
        await db.query(
            `INSERT INTO brands (
                user_id, name, position, target_audience, purpose, marketing_strategy,
                visual_identity, messaging, brand_voice, competitive_analysis,
                personality, marketing_efforts, competitor_analysis, long_term_perspective,
                brand_vision, marketing_toolkit, strategic_management, brand_story,
                website_recommendations, value_proposition, slogan, color_palette
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.user.id,
                brandName,
                // Extract each section from brandContent and insert into database
                // This is a simplified version - you might want to parse the content more carefully
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                brandContent,
                JSON.stringify(colorPalette)
            ]
        );

        req.flash('success_msg', 'Brand generated successfully!');
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while generating your brand');
        res.redirect('/dashboard');
    }
});

// View brand details
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const [brands] = await db.query(
            'SELECT * FROM brands WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.user.id]
        );

        if (brands.length === 0) {
            req.flash('error_msg', 'Brand not found');
            return res.redirect('/dashboard');
        }

        res.render('dashboard/brand-details', {
            title: 'Brand Details',
            brand: brands[0],
            hideFooter: true
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while loading brand details');
        res.redirect('/dashboard');
    }
});

// Delete brand
router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM brands WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.user.id]
        );

        req.flash('success_msg', 'Brand deleted successfully');
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while deleting the brand');
        res.redirect('/dashboard');
    }
});

module.exports = router; 