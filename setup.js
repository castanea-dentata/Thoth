#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const DB_NAME = 'lighterpack';
const DB_USER = 'lighterpack';
const ENV_PATH = path.join(__dirname, '.env');

function run(cmd, options = {}) {
    try {
        return execSync(cmd, { stdio: options.silent ? 'pipe' : 'inherit', encoding: 'utf8' });
    } catch (err) {
        if (options.ignoreError) return null;
        throw err;
    }
}

function checkPostgres() {
    console.log('\n🔍 Checking for PostgreSQL...');
    try {
        const version = run('psql --version', { silent: true });
        console.log(`✅ PostgreSQL found: ${version.trim()}`);
        return true;
    } catch {
        console.error('❌ PostgreSQL not found. Please install PostgreSQL first.');
        console.log('\nOn Mac: brew install postgresql@16 && brew services start postgresql@16');
        console.log('On Ubuntu/Debian: sudo apt install postgresql && sudo service postgresql start');
        console.log('On Windows: https://www.postgresql.org/download/windows/');
        return false;
    }
}

function checkPostgresRunning() {
    console.log('\n🔍 Checking if PostgreSQL is running...');
    try {
        run('pg_isready', { silent: true });
        console.log('✅ PostgreSQL is running.');
        return true;
    } catch {
        console.error('❌ PostgreSQL is not running.');
        console.log('\nOn Mac: brew services start postgresql@16');
        console.log('On Ubuntu/Debian: sudo service postgresql start');
        return false;
    }
}

function setupDatabase(dbPassword) {
    console.log('\n🗄️  Setting up database...');

    // Create database
    try {
        run(`createdb ${DB_NAME}`, { silent: true });
        console.log(`✅ Database '${DB_NAME}' created.`);
    } catch {
        console.log(`ℹ️  Database '${DB_NAME}' already exists, skipping.`);
    }

    // Create user
    run(`psql ${DB_NAME} -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN CREATE USER ${DB_USER} WITH PASSWORD '${dbPassword}'; END IF; END $$;"`, { ignoreError: true, silent: true });

    // Set password in case user already exists
    run(`psql ${DB_NAME} -c "ALTER USER ${DB_USER} WITH PASSWORD '${dbPassword}';"`, { ignoreError: true, silent: true });

    // Grant database privileges
    run(`psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"`, { ignoreError: true, silent: true });

    // Change database owner
    run(`psql postgres -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"`, { ignoreError: true, silent: true });

    // Grant schema permissions
    run(`psql ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"`, { ignoreError: true, silent: true });
    run(`psql ${DB_NAME} -c "ALTER SCHEMA public OWNER TO ${DB_USER};"`, { ignoreError: true, silent: true });

    console.log(`✅ Database user '${DB_USER}' configured.`);
}

function createEnvFile(dbPassword) {
    console.log('\n📝 Creating .env file...');

    if (fs.existsSync(ENV_PATH)) {
        console.log('ℹ️  .env file already exists, skipping.');
        return;
    }

    const envContent = `DATABASE_URL="postgresql://${DB_USER}:${dbPassword}@localhost:5432/${DB_NAME}?schema=public"\n`;
    fs.writeFileSync(ENV_PATH, envContent);
    console.log('✅ .env file created.');
}

function runPrismaMigrate() {
    console.log('\n🔄 Running Prisma migrations...');
    try {
        run('npx prisma migrate deploy');
        console.log('✅ Database tables created successfully.');
    } catch (err) {
        console.error('❌ Prisma migration failed:', err.message);
        throw err;
    }
}

function checkGitignore() {
    const gitignorePath = path.join(__dirname, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        if (!content.includes('.env')) {
            fs.appendFileSync(gitignorePath, '\n.env\n');
            console.log('✅ Added .env to .gitignore.');
        }
    }
}

async function main() {
    console.log('🚀 Thoth Setup Script');
    console.log('=====================');
    console.log('This script will set up your PostgreSQL database for Thoth.\n');

    // Check PostgreSQL is installed and running
    if (!checkPostgres()) {
        rl.close();
        process.exit(1);
    }

    if (!checkPostgresRunning()) {
        rl.close();
        process.exit(1);
    }

    // Ask for database password
    const dbPassword = await question('\n🔑 Enter a password for the database user (or press Enter for default "lighterpack"): ');
    const finalPassword = dbPassword.trim() || 'lighterpack';

    // Set up database
    setupDatabase(finalPassword);

    // Create .env file
    createEnvFile(finalPassword);

    // Check .gitignore
    checkGitignore();

    // Run Prisma migrations
    runPrismaMigrate();

    console.log('\n✅ Setup complete!');
    console.log('\nYou can now start Thoth with:');
    console.log('  npm start        (production build)');
    console.log('  node app.js      (start server only)');
    console.log('  npm run dev      (start webpack dev server with live reload)');

    rl.close();
}

main().catch((err) => {
    console.error('\n❌ Setup failed:', err.message);
    rl.close();
    process.exit(1);
});
