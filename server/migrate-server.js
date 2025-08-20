#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logStep = (step, description) => {
  log(`\n📋 Step ${step}: ${description}`, 'cyan');
};

const logSuccess = (message) => {
  log(`✅ ${message}`, 'green');
};

const logWarning = (message) => {
  log(`⚠️  ${message}`, 'yellow');
};

const logError = (message) => {
  log(`❌ ${message}`, 'red');
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, 'blue');
};

async function main() {
  log('\n🚀 Agriculture App - Server Enhancement Migration', 'bright');
  log('=' .repeat(60), 'dim');

  try {
    // Step 1: Backup current server
    logStep(1, 'Backup current server.js');
    const backupPath = `server-backup-${Date.now()}.js`;
    if (fs.existsSync('server.js')) {
      fs.copyFileSync('server.js', backupPath);
      logSuccess(`Current server.js backed up to ${backupPath}`);
    } else {
      logWarning('No existing server.js found to backup');
    }

    // Step 2: Check if enhanced files exist
    logStep(2, 'Verify enhanced server files');
    const requiredFiles = [
      'server-enhanced.js',
      'utils/logger.js',
      'middleware/errorHandler.js',
      'middleware/security.js',
      'middleware/validation.js',
      'validation/schemas.js',
      'config/swagger.js'
    ];

    let allFilesExist = true;
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        logSuccess(`Found: ${file}`);
      } else {
        logError(`Missing: ${file}`);
        allFilesExist = false;
      }
    });

    if (!allFilesExist) {
      logError('Some required files are missing. Please ensure all files are created first.');
      process.exit(1);
    }

    // Step 3: Check package.json dependencies
    logStep(3, 'Check package.json dependencies');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      'express-rate-limit',
      'express-validator', 
      'helmet',
      'joi',
      'swagger-jsdoc',
      'swagger-ui-express',
      'uuid',
      'winston'
    ];

    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length > 0) {
      logWarning(`Missing dependencies: ${missingDeps.join(', ')}`);
      logInfo('Installing missing dependencies...');
      
      try {
        execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
        logSuccess('Dependencies installed successfully');
      } catch (error) {
        logError('Failed to install dependencies');
        throw error;
      }
    } else {
      logSuccess('All required dependencies are installed');
    }

    // Step 4: Update package.json scripts
    logStep(4, 'Update package.json scripts');
    
    const newScripts = {
      ...packageJson.scripts,
      'start:enhanced': 'node server-enhanced.js',
      'dev:enhanced': 'nodemon server-enhanced.js',
      'migrate': 'node migrate-server.js',
      'logs': 'tail -f logs/combined.log',
      'logs:error': 'tail -f logs/error.log'
    };

    const updatedPackageJson = {
      ...packageJson,
      scripts: newScripts
    };

    fs.writeFileSync('package.json', JSON.stringify(updatedPackageJson, null, 2));
    logSuccess('Updated package.json with new scripts');

    // Step 5: Create logs directory
    logStep(5, 'Create logs directory');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
      logSuccess('Created logs directory');
    } else {
      logSuccess('Logs directory already exists');
    }

    // Step 6: Update environment variables
    logStep(6, 'Check environment configuration');
    
    const envPath = '.env';
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = [
        'LOG_LEVEL=info',
        'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006',
        'API_URL=http://localhost:3000'
      ];

      let updatedEnv = envContent;
      let addedVars = [];

      envVars.forEach(envVar => {
        const [key] = envVar.split('=');
        if (!envContent.includes(key)) {
          updatedEnv += `\n${envVar}`;
          addedVars.push(key);
        }
      });

      if (addedVars.length > 0) {
        fs.writeFileSync(envPath, updatedEnv);
        logSuccess(`Added environment variables: ${addedVars.join(', ')}`);
      } else {
        logSuccess('All environment variables are already configured');
      }
    } else {
      logWarning('No .env file found. Creating one with default values...');
      
      const defaultEnv = `# MongoDB Configuration
MONGODB_URI=mongodb+srv://shahikrish666:9823452251a@cluster0.mfqvyws.mongodb.net/myreactnativeapp?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000

# Environment
NODE_ENV=development

# Logging
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# API URL
API_URL=http://localhost:3000
`;

      fs.writeFileSync(envPath, defaultEnv);
      logSuccess('Created .env file with default configuration');
    }

    // Step 7: Test enhanced server
    logStep(7, 'Test enhanced server startup');
    
    try {
      execSync('node -c server-enhanced.js', { stdio: 'pipe' });
      logSuccess('Enhanced server syntax is valid');
    } catch (error) {
      logError('Enhanced server has syntax errors');
      throw error;
    }

    // Step 8: Provide migration instructions
    logStep(8, 'Migration complete! Next steps:');
    
    log('\n📋 To start using the enhanced server:', 'bright');
    log('  1. Test the enhanced server: npm run start:enhanced', 'cyan');
    log('  2. Access API documentation: http://localhost:3000/api/docs', 'cyan');
    log('  3. Monitor logs: npm run logs', 'cyan');
    log('  4. When satisfied, replace server.js with server-enhanced.js', 'cyan');

    log('\n🔧 New Features Added:', 'bright');
    log('  • Structured logging with Winston', 'green');
    log('  • Global error handling', 'green');  
    log('  • Request validation with Joi', 'green');
    log('  • Rate limiting', 'green');
    log('  • Security headers with Helmet', 'green');
    log('  • API documentation with Swagger', 'green');
    log('  • Enhanced authentication', 'green');
    log('  • Database indexing', 'green');
    log('  • Graceful shutdown', 'green');

    log('\n📁 New Files Created:', 'bright');
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        log(`  • ${file}`, 'blue');
      }
    });

    log('\n🚨 Important Notes:', 'bright');
    log('  • Your original server.js is backed up', 'yellow');
    log('  • Test thoroughly before deploying to production', 'yellow');
    log('  • Update your frontend to handle new error formats', 'yellow');
    log('  • Consider setting up monitoring for the new logs', 'yellow');

    logSuccess('\n🎉 Server enhancement migration completed successfully!');

  } catch (error) {
    logError(`\n💥 Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the migration
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

module.exports = { main };
