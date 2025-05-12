const { User } = require('../models');

async function createUser() {
    try {
        // Delete existing user if exists
        await User.destroy({ where: { username: 'behzad' } });
        
        const password = 'password123';
        console.log('Creating user with password:', password);
        
        const hashedPassword = await User.hashPassword(password);
        console.log('Generated hash:', hashedPassword);
        
        const user = await User.create({
            username: 'behzad',
            email: 'behzad@example.com',
            password: hashedPassword
        });

        console.log('User created successfully:', {
            id: user.id,
            username: user.username,
            hasPassword: !!user.password
        });
        
        // Verify the password works
        const isValid = await user.isValidPassword(password);
        console.log('Password verification test:', isValid);
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
}

createUser(); 