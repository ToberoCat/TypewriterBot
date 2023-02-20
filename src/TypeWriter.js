const puppeteer = require('puppeteer');
const {config} = require('./File');
const chalk = require("chalk");


class TypeWriter {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async openBrowser() {
        this.browser = await puppeteer.launch({headless: false});
        this.page = await this.browser.newPage();

        await this.page.goto(config["typewriter-url"]);
    }

    async closeBrowser() {
        await this.browser.close();
    }

    login() {
        return new Promise(async (resolve, reject) => {
            await this.page.type("#LoginForm_username", this.username);
            await this.page.type("#LoginForm_pw", this.password);
            await this.page.click(`input[name="yt0"]`);

            await this.page.waitForNavigation();

            const invalid = await this.page.evaluate(() => {
                return document.querySelector("#LoginForm_pw_em_");
            });

            if (invalid) reject("Invalid Username or Password");
            else resolve();
        });
    }

    async chooseNextLesson() {
        await this.page.waitForSelector("a[class='cockpitStartButton']");
        this.page.$$eval("a[class='cockpitStartButton']", elHandles => elHandles.forEach(el => el.click()))
    }

    async waitForUserLesson() {
        await this.page.evaluate(() => {
            alert("Please select a level that should be solved for you");
        });
    }

    async home() {
        await this.page.waitForNavigation();
        await this.page.click("div[class='navButtonText']");
        await this.page.waitForNavigation();
    }

    solveLevel() {
        return new Promise(async (resolve, reject) => {
            await this.page.waitForNavigation();
            const [button] = await this.page.$x("//button[contains(., 'Start')]");
            if (!button) return reject();

            await button.click();
            let text = await this.__getRemainingText();
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            await delay(1000);

            const max = config.typing["max-delay"];
            const min = config.typing["min-delay"];

            const errorQuote = config.typing["error-quote"]

            while (text.length > 0) {
                const chr = text.charAt(0);
                if (chr.charCodeAt(0) === 160)
                    await this.page.keyboard.press("Space");
                else
                    await this.__sendFakeKeyPress(chr, chr.charCodeAt(0));

                if (Math.random() <= errorQuote) {
                    await this.page.keyboard.press("Space");
                }

                await delay(Math.random() * (max - min) + min);
                text = await this.__getRemainingText();
            }

            resolve();
        })

    }

    async __sendFakeKeyPress(key, keyCode) {
        await this.page.evaluate((fakeData) => {
            const fakeEventPress = new KeyboardEvent("keypress", fakeData);

            const element = document.getElementById(textInputId);
            console.log("Sent fake key event");
            element.dispatchEvent(fakeEventPress);
        }, this.__createFakeEventData(key, keyCode));
    }

    __createFakeEventData(key, keyCode) {
        return {
            key: key,
            code: "Key" + key.toUpperCase(),
            composed: true,
            keyCode: keyCode,
            which: keyCode,
            ctrlKey: false,
            shiftKey: key === key.toUpperCase(),
            altKey: false,
            metaKey: false,
        };
    }

    async __getRemainingText() {
        const parentElement = await this.page.waitForSelector("#text_todo");
        return await parentElement.evaluate(el => el.children[0].textContent + el.children[1].textContent);
    }
}

function login(username, password) {
    console.log(chalk.blue("[Browser]: Starting browser"))
    return new Promise(async (resolve, reject) => {
        const typewriter = new TypeWriter(username, password);
        await typewriter.openBrowser();
        console.log(chalk.blue("[Browser]: Trying to login..."));
        await typewriter.login()
            .then(() => {
                console.log(chalk.blue("[Browser]: Logged in successfully"));
                resolve(typewriter);
            })
            .catch(async err => {
                console.log(chalk.blue("[Browser]:", chalk.red(`Error: ${err}. Stopping`)));
                await typewriter.closeBrowser();
                reject(err);
            });
    })
}


module.exports.login = login;