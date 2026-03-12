// ParkingPradha Backend

// Enable various services
const log = console.log; // to log messages

function registerUser(email, password) {
    try {
        // Simulated registration logic
        if (!email || !password) {
            throw new Error('Email and password are required.');
        }
        // Simulate user registration process
        log('User registered:', email);
        return { success: true, message: 'User registered successfully.' };
    } catch (error) {
        log('Error registering user:', error.message);
        return { success: false, message: error.message };
    }
}

function loginUser(email, password) {
    try {
        // Simulated login logic
        if (!email || !password) {
            throw new Error('Email and password are required.');
        }
        // Simulate user login process
        log('User logged in:', email);
        return { success: true, message: 'User logged in successfully.' };
    } catch (error) {
        log('Error logging in user:', error.message);
        return { success: false, message: error.message };
    }
}

function main() {
    log('ParkingPradha backend script initiated.');
    // Example user registration and login
    log(registerUser('example@example.com', 'password123'));
    log(loginUser('example@example.com', 'password123'));
}

// Run the main function
main();