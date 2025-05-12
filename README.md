# Artify One - AI-Powered Brand Generation Platform

Artify One is a full-stack web application that helps users create and manage their brand identity using AI. The platform uses Google's Gemini AI to generate comprehensive brand strategies, including visual identity, messaging, and marketing recommendations.

## Features

- User authentication (signup, login, password reset)
- AI-powered brand generation
- Comprehensive brand strategy creation
- Color palette generation
- Brand management dashboard
- Responsive design

## Technology Stack

- Backend: Node.js, Express
- Database: MySQL
- Frontend: EJS (templating), Bootstrap 5
- AI Integration: Google Gemini AI
- Email Service: Nodemailer

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Google Gemini AI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/artify-one.git
cd artify-one
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=artify_one

# Session Configuration
SESSION_SECRET=your_session_secret

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# Google AI (Gemini) Configuration
GEMINI_API_KEY=your_gemini_api_key
```

4. Set up the database:
```bash
mysql -u your_mysql_username -p < config/schema.sql
```

5. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Usage

1. Visit `http://localhost:3000` in your web browser
2. Create an account or log in
3. Enter your brand name to generate a comprehensive brand strategy
4. View and manage your brand details in the dashboard

## API Integration

### Google Gemini AI

To use the Gemini AI integration:

1. Get your API key from the [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the API key to your `.env` file
3. The application will automatically use the API key for brand generation

## Security Considerations

- Passwords are hashed using bcrypt
- Session management with express-session
- CSRF protection
- Input validation
- Secure password reset flow

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@artifyone.com or create an issue in the GitHub repository. 