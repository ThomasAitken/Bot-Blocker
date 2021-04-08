
  
  
function testPhantom(fingerprint, BROWSER_REF) {
    return [
        /PhantomJS/.test(fingerprint.userAgent), 
        fingerprint.phantomJS.some((val) => { return val;}), 
        !/Firefox/.test(fingerprint.userAgent) && !/Safari/.test(BROWSER_REF) && fingerprint.etsl === 37, 
        !/Trident|MSIE|Edge/.test(fingerprint.userAgent) && fingerprint.languages === undefined, 
        /SyntaxError: DOM Exception 12/.test(fingerprint.errorsGenerated[7])
    ]
}

function testOverriddenPermissions(fingerprint) {
    const navigatorPermissions = fingerprint.permissions.permissions;
    return [
        navigatorPermissions.query.toString() !== 'function query() { [native code] }',
        navigatorPermissions.query.toString.toString() !== 'function toString() { [native code] }',
        navigatorPermissions.query.toString.hasOwnProperty('[[Handler]]') && navigatorPermissions.query.toString.hasOwnProperty('[[Target]]') && navigatorPermissions.query.toString.hasOwnProperty('[[IsRevoked]]'),
        navigatorPermissions.hasOwnProperty('query')
    ]
}

function testOverriddenLanguagesAndPlugins() {
    // evaluateOnNewDocument scripts don't apply within [srcdoc] (or [sandbox]) iframes
    // https://github.com/GoogleChrome/puppeteer/issues/1106#issuecomment-359313898
    const iframe = document.createElement('iframe');
    iframe.srcdoc = 'page intentionally left blank';
    document.body.appendChild(iframe);

    const descriptors = Object.getOwnPropertyDescriptors(HTMLIFrameElement.prototype);
    return [
        // Verify iframe prototype isn't touched
        descriptors.contentWindow.get.toString() !== 'function get contentWindow() { [native code] }',
        // Verify iframe isn't remapped to main window
        iframe.contentWindow === window,
        iframe.contentWindow.navigator.plugins.length === 0,
        iframe.contentWindow.navigator.languages === ''
    ]
}

function checkUAOS(fingerprint, OS_REF, DEVICE_TYPE_REF) {
  var navigatorOscpu = fingerprint.oscpu.toLowerCase();
  var navigatorPlatform = fingerprint.platform.toLowerCase();
  var navigatorUA = fingerprint.userAgent.toLowerCase();
  return [
      // should be touch screen but not.. hopefully this doesnt screw over
      // mobile users. need to test
      // reliable to guess that isBot = true if there is touchscreen but device
      // = empty?
      !fingerprint.touchScreen.some((val) => { return val; }) && ["mobile", "tablet", "wearable"].includes(DEVICE_TYPE_REF),
      
      (navigatorOscpu !== "unknown") && ((navigatorOscpu.indexOf("win") >= 0 && !OS_REF.includes("Windows")) || (navigatorOscpu.indexOf("linux") >= 0 && navigatorUA.indexOf("linux") < 0) || (navigatorOscpu.indexOf("mac") >= 0 && !(["Mac OS", "iOS"].includes(OS_REF)))),
      
      (navigatorPlatform !== "unknown") && ((navigatorPlatform.indexOf("win") >= 0 && !OS_REF.includes("Windows")) ||  ((navigatorPlatform.indexOf("linux") >= 0 || navigatorPlatform.indexOf("android") >= 0 || navigatorPlatform.indexOf("pike") >= 0) && navigatorUA.indexOf("linux") < 0) || ((navigatorPlatform.indexOf("mac") >= 0 || navigatorPlatform.indexOf("ipad") >= 0 || navigatorPlatform.indexOf("ipod") >= 0 || navigatorPlatform.indexOf("iphone") >= 0) && !(["Mac OS", "iOS"].includes(OS_REF))))
  ]
}


function checkUABrowser(fingerprint, BROWSER_REF) {
  var specialNum = eval.toString().length;
  const browserRef = {37: ["Safari", "Firefox"],39:["IE"],33:["Chrome", "Opera"]}
  const allBrowsers = ["Safari", "Firefox", "IE", "Chrome", "Opera"]
  return [
      (BROWSER_REF.includes("Chrome") || BROWSER_REF.includes("Opera") || BROWSER_REF.includes("Android") || BROWSER_REF.includes("Edge") || BROWSER_REF.includes("Safari")) && fingerprint.productSub !== "20030107",

      37 === specialNum && (!browserRef[37].some((val) => BROWSER_REF.includes(val)) && allBrowsers.some((val) => BROWSER_REF.includes(val))),
      39 === specialNum && (!browserRef[39].some((val) => BROWSER_REF.includes(val)) && allBrowsers.some((val) => BROWSER_REF.includes(val))),
      33 === specialNum && (!browserRef[33].some((val) => BROWSER_REF.includes(val)) && allBrowsers.some((val) => BROWSER_REF.includes(val)))
  ]
}

function modaliseOutput(mode, testName) {
  var output = true;
  if (mode === "verbose") {
      output = [true, testName];
  }
  return output;
}


function isBot(fingerprint, mode="") {
    var parser = new UAParser();
    parser.setUA(fingerprint.userAgent);
    var uaParsed = parser.getResult();

    const BROWSER_REF = uaParsed.browser.name;
    const OS_REF = uaParsed.os.name;
    const BROWSER_VERSION = parseFloat(uaParsed.browser.version);
    const DEVICE_TYPE_REF = uaParsed.device.type;
    const BROWSERS = {
      CHROME: 'Chrome',
      CHROMIUM: 'Chromium',
      OPERA: 'Opera'
    };
    if (testPhantom(fingerprint).some((val) => { return val; })) {
        return modaliseOutput(mode, "testPhantom");
    }
    if (!fingerprint.screenMediaQuery) {
        return modaliseOutput(mode, "watchMediaSize");
    }
    if (fingerprint.resOverflow.errorName === 'RangeError' && fingerprint.resOverflow.errorMessage === 'Maximum call stack size exceeded.' && fingerprint.resOverflow.errorStacklength > 20 * fingerprint.resOverflow.depth) {
        return modaliseOutput(mode, "longNameTest");
    }
    if (fingerprint.screen.sAvailWidth > fingerprint.screen.sWidth ||
        fingerprint.screen.sAvailHeight > fingerprint.screen.sHeight) {
        return modaliseOutput(mode, "screenSize");
    }
    if (/HeadlessChrome/.test(fingerprint.userAgent)) {
        return modaliseOutput(mode, "puppeteer1");
    }
    if (/Chrome/.test(fingerprint.userAgent) && BROWSER_VERSION < 80) {
        if (fingerprint.webDriver) {
            return modaliseOutput(mode, "puppeteer2");
        }
    }
    else {
        if (fingerprint.webDriver && fingerprint.webDriverValue) {
            return modaliseOutput(mode, "altHeadless");
        }
    }
    if (!fingerprint.hasChrome && /Chrome|Chromium/.test(BROWSER_REF)) {
        return modaliseOutput(mode, "windowChromeLiar");
    }

    if (fingerprint.permissions.permissionNotification === 'denied' && fingerprint.permissions.state === 'prompt') {
        return modaliseOutput(mode, "permissionsMatch");
    }
    if (/Chrome/.test(fingerprint.userAgent) && fingerprint.iframeChrome === 'undefined') {
        return modaliseOutput(mode, "chromeIFrameCheck");
    }
    // following 2 from here: https://github.com/paulirish/headless-cat-n-mouse
    if (/Chrome/.test(fingerprint.userAgent)) {
      if (testOverriddenLanguagesAndPlugins().some((val) => { return val; })) {
          return modaliseOutput(mode, "overridenLangsPlugins");
      }
      if (testOverriddenPermissions(fingerprint).some((val) => { return val; })) {
        return modaliseOutput(mode, "overridenPermissions");
      }
    }
    if (fingerprint.selenium.some((val) => { return val; })) {
        return modaliseOutput(mode, "selenium");
    }
    // If deviceMemory != 0 and not recent Chrome or Opera
    if (fingerprint.deviceMemory !== 0 && !(BROWSER_REF === BROWSERS.CHROME && BROWSER_VERSION >= 63) && !(/Opera/.test(BROWSER_REF) && BROWSER_VERSION >= 50)) {
        return modaliseOutput(mode, "deviceMemory1");
    }
    // If deviceMemory = 0 and recent Chrome or Opera
    if (fingerprint.deviceMemory === 0 && ((BROWSER_REF === BROWSERS.CHROME && BROWSER_VERSION >= 63) || (/Opera/.test(BROWSER_REF) && BROWSER_VERSION >= 50))) {
        return modaliseOutput(mode, "deviceMemory2");
    }
    if (fingerprint.sequentum) {
        return modaliseOutput(mode, "sequentumTest");
    }
    if (checkUAOS(fingerprint, OS_REF, DEVICE_TYPE_REF).some((val) => { return val; })) {
      return modaliseOutput(mode, "naughtyOS");
    }
    if (checkUABrowser(fingerprint, BROWSER_REF).some((val) => { return val; })) {
      return modaliseOutput(mode, "naughtyBrowser");
    }

    return false;
}
