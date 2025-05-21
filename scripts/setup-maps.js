const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(process.cwd(), '.env.local');

// Check if .env.local exists, if not create from example
const checkEnvFile = () => {
    try {
        if (!fs.existsSync(envPath)) {
            console.log('.env.local file not found, creating from .env.local.example...');

            const examplePath = path.join(process.cwd(), '.env.local.example');
            if (!fs.existsSync(examplePath)) {
                console.error('Error: .env.local.example file not found!');
                process.exit(1);
            }

            fs.copyFileSync(examplePath, envPath);
            console.log('.env.local file created successfully!');
        }

        return true;
    } catch (err) {
        console.error('Error creating .env.local file:', err);
        return false;
    }
};

// Update the Google Maps API key in .env.local
const updateApiKey = (apiKey) => {
    try {
        let envContent = fs.readFileSync(envPath, 'utf8');

        // Check if the key already exists in the file
        if (envContent.includes('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=')) {
            // Replace existing key
            envContent = envContent.replace(
                /NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=.*/,
                `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${apiKey}`
            );
        } else {
            // Add key if it doesn't exist
            envContent += `\n# Added by setup script\nNEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${apiKey}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('Google Maps API key has been successfully updated in .env.local');
        return true;
    } catch (err) {
        console.error('Error updating API key:', err);
        return false;
    }
};

// Main execution
console.log('🗺️  PURE FLOW Google Maps API Setup 🗺️');
console.log('---------------------------------------');
console.log('This script will set up your Google Maps API key in .env.local');
console.log('You need a Google Maps API key with the following APIs enabled:');
console.log('- Maps JavaScript API');
console.log('- Drawing Library');
console.log('- Places API');
console.log('- Geocoding API');
console.log('\nYou can get an API key from: https://console.cloud.google.com/google/maps-apis');
console.log('---------------------------------------\n');

const run = async () => {
    // Check and create .env.local if needed
    if (!checkEnvFile()) {
        rl.close();
        process.exit(1);
    }

    // Ask for Google Maps API key
    rl.question('Please enter your Google Maps API key: ', (apiKey) => {
        if (!apiKey || apiKey.trim() === '') {
            console.error('Error: API key cannot be empty.');
            rl.close();
            process.exit(1);
        }

        // Update .env.local with the API key
        if (updateApiKey(apiKey.trim())) {
            console.log('\n✅ Setup complete! You can now run the app with Google Maps integration.');
        } else {
            console.error('\n❌ Setup failed. Please check the error and try again.');
        }

        rl.close();
    });
};

run();