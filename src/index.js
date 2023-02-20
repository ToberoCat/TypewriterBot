const puppeteer = require('puppeteer');
const chalk = require('chalk');
const {login} = require('./TypeWriter');
const fs = require('fs');
const {config} = require("./File");
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

async function autoChooseLesson(typewriter) {
    await typewriter.chooseNextLesson();
}

async function runLesson(typewriter, lesson) {
    if (lesson >= config.lesson["max-lesson"] && config.lesson["max-lesson"] !== -1) {
        console.log(chalk.blue(`[Browser]: ${chalk.yellow("Finished with lesson " + lesson)}`));
        process.exit(1);
        return;
    }
    console.log(chalk.blue(`[Browser]: Typing ${chalk.yellow(lesson)} lesson`));
    await (config["auto-lesson"] ? typewriter.chooseNextLesson() : typewriter.waitForUserLesson());

    typewriter.solveLevel().then(async () => {
        await typewriter.home();
        await runLesson(typewriter, lesson + 1);
    }).catch(err => {
        console.log(chalk.blue("[Browser]:", chalk.red(`Error: ${err}. Stopping`)));
        process.exit(1);
    });
}

async function run() {
    const credentials = await getCredentials();
    const typewriter = await login(credentials.username, credentials.password)
        .catch(err => {
            fs.unlinkSync(LoginInfoPath);
            process.exit(err);
        });
    await runLesson(typewriter, 0);
}

run();
