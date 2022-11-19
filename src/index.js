const puppeteer = require('puppeteer');
const chalk = require('chalk');
const {login} = require('./TypeWriter');
const fs = require('fs');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const LoginInfoPath = "../res/login.info";

if (!fs.existsSync("../res")) fs.mkdirSync("../res");

async function getCredentials() {
    if (!fs.existsSync(LoginInfoPath)) {
        const username = await getInput(chalk.blue("[Browser]: Enter your username: "));
        const password = await getInput(chalk.blue("[Browser]: Enter your password: "));
        readline.close();

        const json = {username: username, password: password};
        fs.writeFileSync(LoginInfoPath, JSON.stringify(json));
        return json;
    } else {
        return JSON.parse(fs.readFileSync(LoginInfoPath));
    }
}

function getInput(query) {
    return new Promise((resolve) => readline.question(query, resolve));
}

async function run() {
    const credentials = await getCredentials();
    const typewriter = await login(credentials.username, credentials.password)
        .catch(err => {
            fs.unlinkSync(LoginInfoPath);
            process.exit(err);
        });
    typewriter.solveLevel().then(() => {
        console.log("Done");
    })
        .catch(() => {
            console.log("Error");
        });
}

run();
