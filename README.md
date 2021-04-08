# Bot-Blocker
A browser fingerprinting tool for blocking bot activity that builds on existing open-source tools and projects. In early stages of testing. Defeats the latest version of this: https://www.npmjs.com/package/puppeteer-extra-plugin-stealth (caveat: haven't tested all scenarios).

### Overview & Acknowledgments
I decided to start this project upon noticing that most of the open-source projects similar to this have been discontinued or made proprietary. The main purpose of this tool is for web developers to instantly identify non-human clients of all stripes, from elementary bots to clients running Selenium or Puppeteer with the stealth plugin. Used in tandem, the two files in this repo can be used while rendering a given webpage to distinguish a client using a standard browser from a client either making requests outside of a browser context or using tools like Selenium, PhantomJS or Puppeteer. The fpCollect.js program, like the one on which it is based (https://github.com/antoinevastel/fp-collect), can also be used for general user fingerprinting. The properties acquired may be useful for sending specific alerts or checking for a consistent user profile over time.

This project is most influenced by the following two repos, by the same author: https://github.com/antoinevastel/fp-collect and https://github.com/antoinevastel/fpscanner. My fpCollect.js file has only minor modifications from the homonymous file in the first of these, although my fpEvaluate.js file is significantly different from Vastel's fpScanner. I have dramatically simplified the overall structure (with an eye for creating a fast and efficient practical tool), removed some browser tests which seem outdated or are otherwise less solid, and added several large browser tests based on insights from here (https://github.com/LukasDrgon/fingerprintjs2/blob/master/fingerprint2.js) and here (https://github.com/paulirish/headless-cat-n-mouse). 

I am early in the testing phase. I need to do more rigorous testing to eliminate false positives (i.e. identifying clients as bots who are using their browser legitimately), but the good news is that I have determined that my evaluation procedure **can identify Puppeteer clients using the latest version of this (https://www.npmjs.com/package/puppeteer-extra-plugin-stealth), with all evasions enabled**. The bad news is that I know how to improve the Stealth plugin to get around my evaluation... At the same time, there are subtler statistical clues that could be used in fingerprinting which would be much harder to get around through the kinds of techniques used by that plugin. That will be a future direction for development.

### Basic Usage
#### Download Files
 See `example.html` for basic usage with files downloaded.

#### NPM & CDN
On NPM here: https://www.npmjs.com/package/bot-blocker. Access files statically here (https://unpkg.com/bot-blocker@1.1.1/fpEvaluate.js) & here (https://unpkg.com/bot-blocker@1.1.1/fpCollect.js). 

#### Strategic Advice
In the project I'm currently working on, I'm using this tool in the context of the following strategy:

````
upon first request made by unexamined or expired client:
     set client_examined = True somehow (via session or whatever)
     interrupt request & instead serve response similar to example.html ['request_str' parameter stores the intended url, encoded in a hash which uses dynamic info]
     if not bot, then retrieve intended url while processing request to GEN_SESSION_ROUTE and redirect to the destination of the initial request
````
     
There are other ways to do similar. This is perhaps the simplest, or close to it.
