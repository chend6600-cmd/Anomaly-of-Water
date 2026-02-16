let imgs = {};
let mySlider;
let blobColors;

let surfaceFrames = [];
let heatFrames = [];
let creaturesFrames = [];
let oceanFrames = [];

let mainMaskBuffer;
let waterBuffer;
let hasCompletedLoop = false; 

// מחקתי מכאן את loadingInterval כי הוא נמצא עכשיו ב-HTML

let totalAssets = 0;
let loadedAssets = 0;
let isLoaded = false;

// --- הגדרות גלילה מרוכזות ---
const SCENE_CONFIG = {
    introEnd: 2000,
    textPageEnd: 4800,

    // שלב 1: הבלוב במרכז, הסליידר יורד (שינוי טמפרטורה)
    centralAnimationLength: 2000,

    // שלב 2: הבלוב זז מהמרכז לפינה
    moveToCornerLength: 1200,

    sceneLength: 1000,
    transitionLength: 100,

    // חזרה לאי
    returnToIslandLength: 2500,

    restingLength: 300 
};

let scrollPoints = {};

function preload() {

    // --- טעינת אסטים ---
    imgs['titleImage'] = loadImage('assets/the Anomaly of water.png');
    imgs['scrollIndicator'] = loadImage('assets/scroll.png');
    imgs['text1'] = loadImage('assets/While most things contract when they get cold.png');
    imgs['text2'] = loadImage('assets/water does the opposite.png');
    imgs['text3'] = loadImage('assets/A small anomaly with large consequences.png');
    imgs['waterMask'] = loadImage('assets/Vector 22.svg');

    // 1. Surface
    for (let i = 1; i <= 201; i++) {
        let filename = 'assets/surface-sprite2/frame_' + nf(i, 4) + '.webp';
        surfaceFrames.push(loadImage(filename));
    }

    // 2. Heat
    for (let i = 1; i <= 101; i++) {
        let filename = 'assets/temperature-sprite2/heat_frame_' + nf(i, 4) + '.webp';
        heatFrames.push(loadImage(filename));
    }

    // 3. Creatures
    for (let i = 1; i <= 400; i++) {
        if (i >= 163 && i <= 187) continue;
        let filename = 'assets/molecolot-sprite2/creatures_frame_' + nf(i, 4) + '.webp';
        creaturesFrames.push(loadImage(filename));
    }

    // 4. Ocean
    for (let i = 1; i <= 201; i++) {
        let filename = 'assets/Biot-sprite2/ocean_frame_' + nf(i, 4) + '.webp';
        oceanFrames.push(loadImage(filename));
    }

    // --- טעינת שכבות ---
    const path = 'assets/leyersss/';
    const entryAssets = ["theanomalysmallT", "Molecularhome", "Thermalhome", "fotter", "Surfacehome", "Biologicalhome"];
    for (let name of entryAssets) imgs[name] = loadImage(path + name + '.png');

    imgs['Environment'] = loadImage(path + 'Environment Temperature.png');
    for (let t = 20; t >= -20; t--) {
        let tempName = t + '°C';
        imgs[tempName] = loadImage(path + tempName + '.png');
    }

    const surfaceAssets = ["SurfaceTP", "maintextSurface", "ActiveSurface(20°C-4°C)", "AnomalousSurface(4°C-0°C)", "CrystallineSurface(0°C-(-10°C))", "InsulativeSurface((-10°C) - (-20°C))", "surfacelegend"];
    for (let name of surfaceAssets) imgs[name] = loadImage(path + name + '.png');

    const thermalAssets = ["trmplegend", "thermalTP", "maintexttherm", "hotesttextthem", "hottexttherm", "coldtexttherm", "coldesttexttherm"];
    for (let name of thermalAssets) imgs[name] = loadImage(path + name + '.png');

    const molecularAssets = ["MolecularTP", "maintextmoleco", "hotesttextmolco", "hottextmoleco", "coldtextmoleco", "coldesttextmolco", "molecolegnd"];
    for (let name of molecularAssets) imgs[name] = loadImage(path + name + '.png');

    const biologicalAssets = ["BiologicalTP", "maintextbiolo", "hotesttextbiolo", "hottextbiolo", "coldtextbiolo", "coldesttextbiolo", "biololegend"];
    for (let name of biologicalAssets) imgs[name] = loadImage(path + name + '.png');

    const otherAssets = ["background", "אבן", "הר יחיד", "הר ימין קדימה", "הר ירוק שמאל", "הר עור שמאל", "הר שמאל קטן", "ירוקת ימין", "ירוקת שמאל", "ירידה 1", "ירידה 2", "ירידה 3", "ירידה 4", "מים", "tree-1", "tree", "רכס מקדימה ימין"];
    for (let name of otherAssets) {
        if (!imgs[name]) imgs[name] = loadImage('assets/' + name + '.png');
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    setAttributes({ willReadFrequently: true });
    pixelDensity(displayDensity());

    mainMaskBuffer = createGraphics(width, height);
    waterBuffer = createGraphics(1000, 1000);

    mySlider = createSlider(0, 100, 0);
    mySlider.position(width / 2, height - 60);
    mySlider.size(width / 2);
    mySlider.hide();

    blobColors = [
        color(0, 0, 137),
        color('#1BA0D0'),
        color('#FF006A')
    ];

    // --- חישוב נקודות הגלילה ---
    let currentScroll = SCENE_CONFIG.textPageEnd;

    scrollPoints.endCentralAnim = currentScroll + SCENE_CONFIG.centralAnimationLength;
    scrollPoints.startSurfaceStatic = scrollPoints.endCentralAnim + SCENE_CONFIG.moveToCornerLength;
    currentScroll = scrollPoints.startSurfaceStatic;
    
    scrollPoints.startSurfaceScene = currentScroll;
    
    scrollPoints.endSurfaceScene = scrollPoints.startSurfaceScene + SCENE_CONFIG.sceneLength;
    scrollPoints.startHeatTrans = scrollPoints.endSurfaceScene;
    scrollPoints.endHeatTrans = scrollPoints.startHeatTrans + SCENE_CONFIG.transitionLength;
    scrollPoints.endHeatScene = scrollPoints.endHeatTrans + SCENE_CONFIG.sceneLength;
    scrollPoints.startMolecTrans = scrollPoints.endHeatScene;
    scrollPoints.endMolecTrans = scrollPoints.startMolecTrans + SCENE_CONFIG.transitionLength;
    scrollPoints.endMolecScene = scrollPoints.endMolecTrans + SCENE_CONFIG.sceneLength;
    scrollPoints.startOceanTrans = scrollPoints.endMolecScene;
    scrollPoints.endOceanTrans = scrollPoints.startOceanTrans + SCENE_CONFIG.transitionLength;
    scrollPoints.endOceanScene = scrollPoints.endOceanTrans + SCENE_CONFIG.sceneLength;
    
    scrollPoints.startReverseTrans = scrollPoints.endOceanScene;
    scrollPoints.endReverseTrans = scrollPoints.startReverseTrans + SCENE_CONFIG.moveToCornerLength;

    scrollPoints.startDissolve = scrollPoints.endReverseTrans;
    scrollPoints.endDissolve = scrollPoints.startDissolve + 800; 

    scrollPoints.startFooter = scrollPoints.endDissolve;
    scrollPoints.endFooter = scrollPoints.startFooter + 2000; 

    scrollPoints.backToIsland = scrollPoints.endFooter + SCENE_CONFIG.returnToIslandLength; 

    scrollPoints.finalEnd = scrollPoints.backToIsland + SCENE_CONFIG.restingLength;

    document.body.style.height = (scrollPoints.finalEnd + windowHeight) + "px";

    if (surfaceFrames.length > 0) {
        startSurfaceImg = surfaceFrames[0];
        endSurfaceImg = surfaceFrames[surfaceFrames.length - 1];
    }

    // --- מאזין לגלילה הפוכה ---
    window.addEventListener("wheel", (event) => {
        if (window.scrollY <= 0 && event.deltaY < 0 && hasCompletedLoop) {
            window.scrollTo(0, scrollPoints.finalEnd - 100);
        }
    });

    // === סיום ה-LOADING ===
    // כאן אנחנו קוראים לפונקציה מה-HTML שמסיימת את הבר ומעלימה את המסך
    if (typeof finishLoading === 'function') {
        finishLoading();
    }
}

function draw() {
    let scrollPos = window.scrollY;

    let endPoint = SCENE_CONFIG.introEnd;
    let secondPageEnd = SCENE_CONFIG.textPageEnd;
    let fadeStart = 1500;
    
    // ... מכאן ממשיך שאר הקוד שלך ב-Draw ...

    let amount = constrain(map(scrollPos, 0, 400, 0, 1), 0, 1);
    let breakoutAmount = constrain(map(scrollPos, 100, endPoint, 0, 1), 0, 1);

    background('#000023');

    // === בדיקת סוף הגלילה וביצוע ה-LOOP ===
    if (scrollPos >= scrollPoints.finalEnd - 5) {
        hasCompletedLoop = true;
        window.scrollTo(0, 0);
        return; 
    }

    if (scrollPos < endPoint) {
        // ... (Intro) ...
        mySlider.hide();
        let currentScale = 0.40 + (scrollPos * 0.002);
        if (scrollPos > fadeStart && imgs["background"]) {
            let bgAlpha = map(scrollPos, fadeStart, endPoint, 0, 255, true);
            let zoomEffect = map(scrollPos, fadeStart, endPoint, 1.0, 1.05, true);
            push();
            let img = imgs["background"];
            let baseScale = max(width / img.width, height / img.height);
            let finalScale = baseScale * zoomEffect;
            let w = img.width * finalScale;
            let h = img.height * finalScale;
            let x = (width - w) / 2;
            let y = (height - h) / 2;
            drawingContext.globalAlpha = bgAlpha / 255;
            image(img, x, y, w, h);
            drawingContext.globalAlpha = 1.0;
            pop();
        }
        let objectOpacity = map(scrollPos, fadeStart, endPoint, 255, 0, true);
        if (imgs['titleImage']) {
            push();
            scale(0.8);
            let titleAlpha = map(scrollPos, 350, 600, 255, 0, true);
            drawingContext.globalAlpha = titleAlpha / 255;
            imageMode(CORNER);
            image(imgs['titleImage'], 45, 45);
            drawingContext.globalAlpha = 1.0;
            pop();
        }
        drawMyObject(breakoutAmount, currentScale, objectOpacity);

    } else if (scrollPos >= endPoint && scrollPos < secondPageEnd) {
         // ... (Text page) ...
        mySlider.hide();
        drawSecondPage(scrollPos, endPoint);
        let overlayAlpha = 0;
        let fadeRange = 400;
        if (scrollPos > secondPageEnd - fadeRange) {
            overlayAlpha = map(scrollPos, secondPageEnd - fadeRange, secondPageEnd, 0, 255, true);
        }
        if (overlayAlpha > 0) {
            push(); fill(0, 0, 35, overlayAlpha); noStroke(); rect(0, 0, width, height); pop();
        }

    } else {
        // === SCENE 3-6: Interactive Journey ===
        mySlider.hide();

        if (scrollPos <= scrollPoints.endCentralAnim) {
            let sliderVal = map(scrollPos, secondPageEnd, scrollPoints.endCentralAnim, 0, 100, true);
            drawCentralAnimation(scrollPos, sliderVal);
            drawLayerLabels(scrollPos, sliderVal);
        }
        else if (scrollPos > scrollPoints.endCentralAnim && scrollPos <= scrollPoints.startSurfaceStatic) {
            drawBlobTransitionToCorner(scrollPos);
        }
        else if (scrollPos > scrollPoints.startSurfaceStatic && scrollPos < scrollPoints.startSurfaceScene) {
            drawFinalStaticScene(scrollPos);
        }
        else if (scrollPos >= scrollPoints.startSurfaceScene && scrollPos < scrollPoints.endSurfaceScene) {
            drawSurfaceScene(scrollPos, scrollPoints.startSurfaceScene, scrollPoints.endSurfaceScene);
        }
        else if (scrollPos >= scrollPoints.startHeatTrans && scrollPos < scrollPoints.endHeatTrans) {
            drawThermalTransition(scrollPos, scrollPoints.startHeatTrans);
        }
        else if (scrollPos >= scrollPoints.endHeatTrans && scrollPos < scrollPoints.endHeatScene) {
            drawHeatScene(scrollPos, scrollPoints.endHeatTrans, scrollPoints.endHeatScene);
        }
        else if (scrollPos >= scrollPoints.startMolecTrans && scrollPos < scrollPoints.endMolecTrans) {
            drawHeatToMolecTransition(scrollPos, scrollPoints.startMolecTrans);
        }
        else if (scrollPos >= scrollPoints.endMolecTrans && scrollPos < scrollPoints.endMolecScene) {
            drawMolecScene(scrollPos, scrollPoints.endMolecTrans, scrollPoints.endMolecScene);
        }
        else if (scrollPos >= scrollPoints.startOceanTrans && scrollPos < scrollPoints.endOceanTrans) {
            drawMolecToOceanTransition(scrollPos, scrollPoints.startOceanTrans);
        }
        else if (scrollPos >= scrollPoints.endOceanTrans && scrollPos < scrollPoints.startReverseTrans) {
            drawOceanScene(scrollPos, scrollPoints.endOceanTrans);
        }
        // שלב 1: חזרה למרכז
        else if (scrollPos >= scrollPoints.startReverseTrans && scrollPos < scrollPoints.endReverseTrans) {
            drawReverseTransition(scrollPos);
        }
        // === שלב 2: התמוססות (הבלוב והרקע מתחלפים יחד) ===
        else if (scrollPos >= scrollPoints.endReverseTrans && scrollPos < scrollPoints.endDissolve) {
            drawBlobDissolve(scrollPos);
        }
        // === שלב 3: פוטר ===
        else if (scrollPos >= scrollPoints.endDissolve && scrollPos < scrollPoints.endFooter) {
            drawFooter(scrollPos, scrollPoints.startFooter, scrollPoints.endFooter);
        }
        // === שלב 4: חזרה לאי (הלופ הסופי) ===
        else {
            let t = map(scrollPos, scrollPoints.endFooter, scrollPoints.backToIsland, 0, 1);
            t = constrain(t, 0, 1);
            let bgAlpha = map(t, 0, 0.6, 255, 0); 

            if (imgs["background"] && bgAlpha > 0) {
                push();
                drawingContext.globalAlpha = bgAlpha / 255; 
                let img = imgs["background"];
                let baseScale = max(width / img.width, height / img.height);
                let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
                let totalScale = baseScale * breath;
                let w = img.width * totalScale;
                let h = img.height * totalScale;
                image(img, (width - w) / 2, (height - h) / 2, w, h);
                pop();
            }

            if (t > 0) {
                push();
                let returnBreakout = map(t, 0, 1, 1, 0); 
                let returnScale = map(t, 0, 1, 2.0, 0.40);
                let returnOpacity = map(t, 0, 0.5, 0, 255, true); 
                drawMyObject(returnBreakout, returnScale, returnOpacity);
                if (imgs['titleImage']) {
                    push();
                    scale(0.8);
                    let titleAlpha = map(t, 0.7, 1.0, 0, 255, true);
                    drawingContext.globalAlpha = titleAlpha / 255;
                    imageMode(CORNER);
                    image(imgs['titleImage'], 45, 45);
                    pop();
                }
                pop();
            }
        }

        // --- הבלוב העליון הקטן ---
        if (scrollPos > scrollPoints.startSurfaceStatic && scrollPos < scrollPoints.endOceanTrans) {
            push();
            drawingContext.globalAlpha = 1.0;
            let lockedSliderVal = 0;
            let lockedTemp = map(lockedSliderVal, 0, 100, 20, -20);
            let lockedIntensity = map(lockedTemp, -20, 20, 0.1, 1.0, true);
            let cornerX = width;
            let cornerY = 0;
            let cornerScale = 0.6;
            
            let shouldHideOuter = (scrollPos > scrollPoints.endHeatTrans);

            let fakeScrollPosForBlob = min(scrollPos, scrollPoints.endOceanTrans - 1);
            
            drawBlobsScene(fakeScrollPosForBlob, lockedIntensity, lockedSliderVal, cornerX, cornerY, cornerScale, shouldHideOuter);
            pop();
        }

        // === TOP LAYER LABELS (WITH MASKED BACKGROUND) ===
        if (scrollPos > scrollPoints.startSurfaceStatic && scrollPos < scrollPoints.endOceanScene) {
            
            // --- הגדרת מיקומים מדורגים ---
            let surfaceX = width - 250;
            let surfaceY = 130;

            let thermalX = width - 200; // זז ימינה ב-50
            let thermalY = 110;         // זז למעלה ב-20

            let molecX = width - 150;   // זז עוד ימינה
            let molecY = 90;            // זז עוד למעלה

            let bioX = width - 100;     // הכי ימינה
            let bioY = 70;              // הכי למעלה

            // 1. Surface Static & Scene
            if (scrollPos < scrollPoints.startHeatTrans) {
                let sliderVal = 0;
                if (scrollPos >= scrollPoints.startSurfaceScene) {
                    sliderVal = map(scrollPos, scrollPoints.startSurfaceScene, scrollPoints.endSurfaceScene, 0, 100, true);
                }
                drawBreathingLabel("Surfacehome", surfaceX, surfaceY, 255, surfaceFrames, sliderVal);
            }
            // 2. Transition Surface -> Heat
            else if (scrollPos < scrollPoints.endHeatTrans) {
                let p = constrain(map(scrollPos, scrollPoints.startHeatTrans, scrollPoints.endHeatTrans, 0, 1), 0, 1);
                // Surface (יוצא)
                drawBreathingLabel("Surfacehome", surfaceX, surfaceY, map(p, 0, 1, 255, 0), surfaceFrames, 100);
                // Thermal (נכנס - במיקום החדש)
                drawBreathingLabel("Thermalhome", thermalX, thermalY, map(p, 0, 1, 0, 255), heatFrames, 0);
            }
            // 3. Heat Scene
            else if (scrollPos < scrollPoints.startMolecTrans) {
                let sliderVal = map(scrollPos, scrollPoints.endHeatTrans, scrollPoints.endHeatScene, 0, 100, true);
                drawBreathingLabel("Thermalhome", thermalX, thermalY, 255, heatFrames, sliderVal);
            }
            // 4. Transition Heat -> Molec
            else if (scrollPos < scrollPoints.endMolecTrans) {
                let p = constrain(map(scrollPos, scrollPoints.startMolecTrans, scrollPoints.endMolecTrans, 0, 1), 0, 1);
                drawBreathingLabel("Thermalhome", thermalX, thermalY, map(p, 0, 1, 255, 0), heatFrames, 100);
                drawBreathingLabel("Molecularhome", molecX, molecY, map(p, 0, 1, 0, 255), creaturesFrames, 0);
            }
            // 5. Molec Scene
            else if (scrollPos < scrollPoints.startOceanTrans) {
                let sliderVal = map(scrollPos, scrollPoints.endMolecTrans, scrollPoints.endMolecScene, 0, 100, true);
                drawBreathingLabel("Molecularhome", molecX, molecY, 255, creaturesFrames, sliderVal);
            }
            // 6. Transition Molec -> Ocean
            else if (scrollPos < scrollPoints.endOceanTrans) {
                let p = constrain(map(scrollPos, scrollPoints.startOceanTrans, scrollPoints.endOceanTrans, 0, 1), 0, 1);
                drawBreathingLabel("Molecularhome", molecX, molecY, map(p, 0, 1, 255, 0), creaturesFrames, 100);
                drawBreathingLabel("Biologicalhome", bioX, bioY, map(p, 0, 1, 0, 255), oceanFrames, 0);
            }
            // 7. Ocean Scene
            else {
                let sliderVal = map(scrollPos, scrollPoints.endOceanTrans, scrollPoints.endOceanScene, 0, 100, true);
                drawBreathingLabel("Biologicalhome", bioX, bioY, 255, oceanFrames, sliderVal);
            }
        }
    }

    // --- שאריות (Residue Blobs) ---
    let resX = width;
    let resY = height;

    if (scrollPos > scrollPoints.startOceanTrans && scrollPos < scrollPoints.startReverseTrans) {
        if (creaturesFrames.length > 0) {
            let lastMolecImg = creaturesFrames[creaturesFrames.length - 1];
            drawResidueBlob(resX, resY, 255, lastMolecImg, 2);
        }
    }
    if (scrollPos > scrollPoints.startMolecTrans && scrollPos < scrollPoints.startReverseTrans) {
        if (heatFrames.length > 0) {
            let lastHeatImg = heatFrames[heatFrames.length - 1];
            drawResidueBlob(resX, resY, 255, lastHeatImg, 1);
        }
    }
    if (scrollPos > scrollPoints.startHeatTrans && scrollPos < scrollPoints.startReverseTrans) {
        if (surfaceFrames.length > 0) {
            let lastSurfaceImg = surfaceFrames[surfaceFrames.length - 1];
            drawResidueBlob(resX, resY, 255, lastSurfaceImg, 0);
        }
    }

    // --- אינדיקטור גלילה ---
    if (imgs['scrollIndicator']) {
        let alphaStart = map(scrollPos, 0, 300, 255, 0, true);
        let startAppearance = scrollPoints.endFooter + 1500; 
        let endAppearance = scrollPoints.backToIsland;
        let alphaEnd = map(scrollPos, startAppearance, endAppearance, 0, 255, true);
        let finalAlpha = max(alphaStart, alphaEnd);

        if (finalAlpha > 0) {
            push();
            drawingContext.globalAlpha = finalAlpha / 255;
            imageMode(CENTER);
            let sImg = imgs['scrollIndicator'];
            let newW = sImg.width * 0.8;
            let newH = sImg.height * 0.8;
            let floatY = sin(millis() * 0.003) * 5; 
            let posY = height - 45 - (newH / 2) + floatY;
            image(sImg, width / 2, posY, newW, newH);
            drawingContext.globalAlpha = 1.0;
            pop();
        }
    }
}

// === פונקציות העזר המעודכנות ===

function drawBlobDissolve(scrollPos) {
    let start = scrollPoints.startDissolve;
    let end = scrollPoints.endDissolve;
    let p = constrain(map(scrollPos, start, end, 0, 1), 0, 1);

    push();

    // 1. צעד ראשון: ציור הרקע החדש (Intro) מאחור
    if (imgs["background"]) {
        let img = imgs["background"];
        let baseScale = max(width / img.width, height / img.height);
        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let totalScale = baseScale * breath;
        let w = img.width * totalScale;
        let h = img.height * totalScale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        image(img, x, y, w, h);
    }

    // 2. צעד שני: ציור רקע האוקיינוס מעל, הולך ונעלם (Fade Out)
    if (oceanFrames.length > 0) {
        let bgImg = oceanFrames[oceanFrames.length - 1];
        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let baseScale = max(width / bgImg.width, height / bgImg.height);
        let totalScale = baseScale * breath;
        let w = bgImg.width * totalScale;
        let h = bgImg.height * totalScale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        
        // כאן הקסם: השקיפות יורדת מ-1 ל-0
        drawingContext.globalAlpha = 1.0 - p;
        image(bgImg, x, y, w, h);
    }

    // 3. צעד שלישי: הבלוב המתמוסס (גם הוא נעלם)
    
    // פרמטרים להתמוססות הבלוב
    let blendAlpha = lerp(1.0, 0.0, p);
    let startIntensity = map(map(0, 0, 100, 20, -20), -20, 20, 0.1, 1.0);
    let blendIntensity = lerp(startIntensity, 0.05, p); 
    let blendScale = lerp(1.0, 1.15, p);
    let cx = width / 2;
    let cy = height / 2;

    // שינוי השקיפות לבלוב
    drawingContext.globalAlpha = blendAlpha;
    drawBlobsScene(0, blendIntensity, 0, cx, cy, blendScale, false);
    
    pop();
}

// ==========================================================
// פונקציות סצנות ומעברים
// ==========================================================

// פונקציה 1: רק המרכז (ללא תזוזה)
function drawCentralAnimation(scrollPos, sliderVal) {
    let startAnim = SCENE_CONFIG.textPageEnd;

    // חישוב אלפא לכניסה (Fade In)
    let sceneAlpha = map(scrollPos, startAnim, startAnim + 500, 0, 255, true);

    let effectiveVal = sliderVal;
    let tempValue = map(effectiveVal, 0, 100, 20, -20);
    let blobIntensity = map(tempValue, -20, 20, 0.1, 1.0, true);

    // מיקום קבוע במרכז
    let centerX = width / 2;
    let centerY = height / 2;
    let centerScale = 1.0;

    let breath = 1.05 + sin(millis() * 0.0015) * 0.02;

    push();
    drawingContext.globalAlpha = sceneAlpha / 255;

    if (sceneAlpha > 0) {
        if (surfaceFrames.length > 0) {
            let frameIndex = floor(map(effectiveVal, 0, 100, 0, surfaceFrames.length - 1));
            frameIndex = constrain(frameIndex, 0, surfaceFrames.length - 1);
            let currentImg = surfaceFrames[frameIndex];

            let baseScale = max(width / currentImg.width, height / currentImg.height);
            let totalScale = baseScale * breath;

            let newW = currentImg.width * totalScale;
            let newH = currentImg.height * totalScale;
            let drawX = (width - newW) / 2;
            let drawY = (height - newH) / 2;

            image(currentImg, drawX, drawY, newW, newH);
        }

        drawBlobsScene(scrollPos, blobIntensity, effectiveVal, centerX, centerY, centerScale);
    }
    pop();

    drawNewSlider(scrollPos);
}

function drawBlobTransitionToCorner(scrollPos) {
    let startTrans = scrollPoints.endCentralAnim;
    let endTrans = scrollPoints.startSurfaceStatic;

    let t = constrain(map(scrollPos, startTrans, endTrans, 0, 1), 0, 1);
    let smoothT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // === חישוב הרוורס ===
    // כשהתנועה מתחילה (smoothT=0), הערך הוא 100 (קפוא)
    // כשהתנועה מסתיימת (smoothT=1), הערך הוא 0 (פעיל/התחלה)
    let reverseSliderVal = map(smoothT, 0, 1, 100, 0);

    // תנועת הבלוב (מיקום)
    let startX = width / 2;
    let startY = height / 2;
    let endX = width;
    let endY = 0;

    let curX = lerp(startX, endX, smoothT);
    let curY = lerp(startY, endY, smoothT);
    let curScale = lerp(1.0, 0.6, smoothT);

    // תנועת התווית
    let sizeLarge = (600 + (2 * 720)) * 0.3;
    let labelStartX = width / 2 + (sizeLarge * 0.90) + 70; 
    let labelStartY = height / 2 + (sizeLarge * 0.45) + 20;
    let labelEndX = width - 250; 
    let labelEndY = 130;

    let curLabelX = lerp(labelStartX, labelEndX, smoothT);
    let curLabelY = lerp(labelStartY, labelEndY, smoothT);

    push();

    // 1. רקע (רץ ברוורס לפי reverseSliderVal)
    if (surfaceFrames.length > 0) {
        let frameIndex = floor(map(reverseSliderVal, 0, 100, 0, surfaceFrames.length - 1));
        frameIndex = constrain(frameIndex, 0, surfaceFrames.length - 1);
        let currentImg = surfaceFrames[frameIndex];

        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let baseScale = max(width / currentImg.width, height / currentImg.height);
        let totalScale = baseScale * breath;
        let w = currentImg.width * totalScale;
        let h = currentImg.height * totalScale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;

        drawingContext.globalAlpha = 1.0;
        image(currentImg, x, y, w, h);
    }

    // 2. ציור הבלוב (משתנה לפי reverseSliderVal)
    let tempValue = map(reverseSliderVal, 0, 100, 20, -20); // הטמפרטורה משתנה מ-20 למינוס 20
    let blobIntensity = map(tempValue, -20, 20, 0.1, 1.0, true);
    
    drawSingleBlobCluster(curX, curY, scrollPos, blobIntensity, reverseSliderVal, false, curScale);

    // 3. סליידר וטקסטים
    let rectW = width * 0.27;
    let slideX = map(smoothT, 0, 1, -rectW, 0);

    noStroke();
    fill(0, 0, 35, 140);
    rect(slideX, 0, rectW, height);

    let alphaOut = map(smoothT, 0, 1, 255, 0);
    let alphaIn = map(smoothT, 0, 1, 0, 255);

    // כאן אנחנו מציגים את הטקסטים לפי הערך המשתנה (reverseSliderVal)
    // זה יגרום למספרים ולטקסט לרוץ לאחור בזמן התנועה
    if (alphaOut > 0) {
        push();
        drawingContext.globalAlpha = alphaOut / 255;
        drawStaticSidebar(reverseSliderVal, slideX, false);
        drawSurfaceTexts(slideX, reverseSliderVal, false);
        pop();
    }

    if (alphaIn > 0) {
        push();
        drawingContext.globalAlpha = alphaIn / 255;
        let bracketVisibility = map(smoothT, 0.9, 1.0, 0, 255, true);
        drawStaticSidebar(reverseSliderVal, slideX, false); 
        drawSurfaceTexts(slideX, reverseSliderVal, true, bracketVisibility);
        pop();
    }

    // תווית נושמת
    drawBreathingLabel("Surfacehome", curLabelX, curLabelY, 255, surfaceFrames, reverseSliderVal);

    pop();
}

function drawFinalStaticScene(scrollPos) {
    push();
    let breath = 1.05 + sin(millis() * 0.0015) * 0.02;

    // קבענו את הערך ל-0 כי זה המצב בסוף הרוורס
    let staticVal = 0; 

    // 1. רקע (פריים ראשון)
    if (surfaceFrames.length > 0) {
        let firstImg = surfaceFrames[0];
        let baseScale = max(width / firstImg.width, height / firstImg.height);
        let totalScale = baseScale * breath;
        let newW = firstImg.width * totalScale;
        let newH = firstImg.height * totalScale;
        let startX = (width - newW) / 2;
        let startY = (height - newH) / 2;
        drawingContext.globalAlpha = 1.0;
        image(firstImg, startX, startY, newW, newH);
    }

    // 2. בלוב (פעיל/חם)
    let tempValue = 20; 
    let blobIntensity = map(tempValue, -20, 20, 0.1, 1.0, true);
    
    drawSmallSurfaceBlob(width, 0, scrollPos, blobIntensity, staticVal);

    // 3. טקסט צד
    drawStaticSidebar(staticVal, 0);
    drawSurfaceTexts(0, staticVal);

    drawBreathingLabel("Surfacehome", width - 250, 130, 255, surfaceFrames, staticVal);
    pop();
}

function drawSurfaceScene(scrollPos, startScroll, endScroll) {
    push();
    let progress = constrain(map(scrollPos, startScroll, endScroll, 0, 1), 0, 1);

    // 1. רקע
    if (surfaceFrames.length > 0) {
        let frameIndex = floor(map(progress, 0, 1, 0, surfaceFrames.length - 1));
        frameIndex = constrain(frameIndex, 0, surfaceFrames.length - 1);
        drawBgImage(surfaceFrames[frameIndex]);
    }

    // 2. טקסט צד
    drawStaticSidebar(progress * 100);
    drawSurfaceTexts(0, progress * 100);

    // === תיקון: התווית בסוף ===
    drawBreathingLabel("Surfacehome", width - 250, 130, 255);
    pop();
}

function drawThermalTransition(scrollPos, startTrans) {
    push();
    let transitionRange = SCENE_CONFIG.transitionLength;
    let progress = constrain(map(scrollPos, startTrans, startTrans + transitionRange, 0, 1), 0, 1);

    let alphaOut = map(progress, 0, 1, 255, 0);
    let alphaIn = map(progress, 0, 1, 0, 255);

    if (alphaOut > 0) {
        push();
        drawingContext.globalAlpha = alphaOut / 255;
        if (surfaceFrames.length > 0) drawBgImage(surfaceFrames[surfaceFrames.length - 1]);
        drawSurfaceTexts(0, 100);
        drawStaticSidebar(100, 0, false);
        pop();
    }

    if (alphaIn > 0) {
        push();
        drawingContext.globalAlpha = alphaIn / 255;
        if (heatFrames.length > 0) drawBgImage(heatFrames[0]);
        drawThermalTexts(0, 0);
        drawStaticSidebar(0, 0, false);
        pop();
    }

    // שיניתי את הקואורדינטות ב-Thermalhome
    drawBreathingLabel("Surfacehome", width - 250, 130, alphaOut);
    drawBreathingLabel("Thermalhome", width - 200, 110, alphaIn);

    pop();
}

function drawHeatScene(scrollPos, startScroll, endScroll) {
    push();
    let progress = constrain(map(scrollPos, startScroll, endScroll, 0, 1), 0, 1);

    if (heatFrames.length > 0) {
        let frameIndex = floor(map(progress, 0, 1, 0, heatFrames.length - 1));
        frameIndex = constrain(frameIndex, 0, heatFrames.length - 1);
        drawBgImage(heatFrames[frameIndex]);
    }
    
    // שיניתי את הקואורדינטות
    drawBreathingLabel("Thermalhome", width - 200, 110, 255);

    drawStaticSidebar(progress * 100);
    drawThermalTexts(0, progress * 100);
    pop();
}

function drawHeatToMolecTransition(scrollPos, startTrans) {
    push();
    let fadeDuration = SCENE_CONFIG.transitionLength * 0.5;
    let startFade = startTrans + (SCENE_CONFIG.transitionLength * 0.1);

    let alphaOut = map(scrollPos, startFade, startFade + fadeDuration, 1, 0, true); // פה זה מ-1 ל-0 (0-255 זה אחרת)
    let alphaIn = map(scrollPos, startFade, startFade + fadeDuration, 0, 1, true);

    if (alphaOut > 0) {
        push();
        drawingContext.globalAlpha = alphaOut;
        if (heatFrames.length > 0) drawBgImage(heatFrames[heatFrames.length - 1]);
        drawThermalTexts(0, 100);
        drawStaticSidebar(100, 0, false);
        pop();
    }

    if (alphaIn > 0) {
        push();
        drawingContext.globalAlpha = alphaIn;
        if (creaturesFrames.length > 0) drawBgImage(creaturesFrames[0]);
        drawMolecTexts(0, 0);
        drawStaticSidebar(0, 0, false);
        pop();
    }

    drawBreathingLabel("Thermalhome", width - 200, 110, alphaOut * 255);
    drawBreathingLabel("Molecularhome", width - 150, 90, alphaIn * 255);

    pop();
}

function drawMolecScene(scrollPos, startScroll, endScroll) {
    push();
    let progress = constrain(map(scrollPos, startScroll, endScroll, 0, 1), 0, 1);

    if (creaturesFrames.length > 0) {
        let frameIndex = floor(map(progress, 0, 1, 0, creaturesFrames.length - 1));
        frameIndex = constrain(frameIndex, 0, creaturesFrames.length - 1);
        drawBgImage(creaturesFrames[frameIndex]);
    }

    // === התווית בפינה ===
    drawBreathingLabel("Molecularhome", width - 150, 90, 255);
    drawMolecTexts(0, progress * 100);
    drawCustomSlider(progress);
    pop();
}

function drawMolecToOceanTransition(scrollPos, startTrans) {
    push();
    let fadeDuration = SCENE_CONFIG.transitionLength * 0.5;
    let startFade = startTrans + (SCENE_CONFIG.transitionLength * 0.1);

    let alphaOut = map(scrollPos, startFade, startFade + fadeDuration, 1, 0, true);
    let alphaIn = map(scrollPos, startFade, startFade + fadeDuration, 0, 1, true);

    if (alphaOut > 0) {
        push();
        drawingContext.globalAlpha = alphaOut;
        if (creaturesFrames.length > 0) drawBgImage(creaturesFrames[creaturesFrames.length - 1]);
        drawMolecTexts(0, 100);
        drawStaticSidebar(100, 0, false);
        pop();
    }

    if (alphaIn > 0) {
        push();
        drawingContext.globalAlpha = alphaIn;
        if (oceanFrames.length > 0) drawBgImage(oceanFrames[0]);
        drawOceanTexts(0, 0);
        drawStaticSidebar(0, 0, false);
        pop();
    }

    // שולחים null בפרמטר האחרון (במקום oceanFrames) כדי שלא יהיה רקע לכותרת החדשה
    drawBreathingLabel("Molecularhome", width - 150, 90, alphaOut * 255, creaturesFrames, 100);
    drawBreathingLabel("Biologicalhome", width - 100, 70, alphaIn * 255, null, 0);

    pop();
}

function drawOceanScene(scrollPos, startScroll) {
    push();
    let endScroll = scrollPoints.endOceanScene; 
    let progress = constrain(map(scrollPos, startScroll, endScroll, 0, 1), 0, 1);

    if (oceanFrames.length > 0) {
        let frameIndex = floor(map(progress, 0, 1, 0, oceanFrames.length - 1));
        frameIndex = constrain(frameIndex, 0, oceanFrames.length - 1);
        drawBgImage(oceanFrames[frameIndex]);
    }

    // === התווית בפינה (ללא רקע) ===
    // שלחנו null במקום oceanFrames
    drawBreathingLabel("Biologicalhome", width - 100, 70, 255, null, 0);
    
    drawOceanTexts(0, progress * 100);
    drawCustomSlider(progress);
    pop();
}

function drawOceanScene(scrollPos, startScroll) {
    push();
    let endScroll = scrollPoints.endOceanScene; 
    let progress = constrain(map(scrollPos, startScroll, endScroll, 0, 1), 0, 1);

    if (oceanFrames.length > 0) {
        let frameIndex = floor(map(progress, 0, 1, 0, oceanFrames.length - 1));
        frameIndex = constrain(frameIndex, 0, oceanFrames.length - 1);
        drawBgImage(oceanFrames[frameIndex]);
    }

    // === התווית בפינה ===
    drawBreathingLabel("Biologicalhome", width - 100, 70, 255);
    drawOceanTexts(0, progress * 100);
    drawCustomSlider(progress);
    pop();
}

// ==========================================================
// פונקציות עזר כלליות
// ==========================================================

function drawBgImage(img) {
    let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
    let baseScale = max(width / img.width, height / img.height);
    let totalScale = baseScale * breath;
    let w = img.width * totalScale;
    let h = img.height * totalScale;
    image(img, (width - w) / 2, (height - h) / 2, w, h);
}

function drawNewSlider(currentScroll) {
    // סליידר קווי פשוט שמופיע בזמן הכניסה
    push();
    let entryStart = SCENE_CONFIG.textPageEnd;
    let entryEnd = entryStart + 400; // זמן קצר לכניסה

    let entryProg = map(currentScroll, entryStart, entryEnd, 0, 1, true);
    let sliderW = 13;
    let margin = 16;
    let sliderH = height - (margin * 2);

    let targetX = margin;
    let startX = -300;

    // המיקום הנוכחי של הסליידר
    let currentX = lerp(startX, targetX, entryProg);
    let currentY = margin;

    noFill();
    strokeWeight(2);
    let cPink = color('#FF006A');
    let cLightBlue = color('#1BA0D0');
    let cDarkBlue = color(0, 0, 137);

    // --- לולאה שמציירת את הקווים (Loop) ---
    for (let i = 0; i < sliderH; i += 2) {
        let inter = map(i, 0, sliderH, 0, 1);
        let c;
        if (inter < 0.5) {
            let subInter = map(inter, 0, 0.5, 0, 1);
            c = lerpColor(cPink, cLightBlue, subInter);
        } else {
            let subInter = map(inter, 0.5, 1, 0, 1);
            c = lerpColor(cLightBlue, cDarkBlue, subInter);
        }
        stroke(c);
        line(currentX, currentY + i, currentX + sliderW, currentY + i);
    }
    // --- סוף הלולאה ---

    // === כאן התיקון: המספרים מצוירים פעם אחת בלבד, מחוץ ללולאה ===
    let scaleRatio = 0.5;

    // 3. הידית והתווית הנעה
    if (entryProg > 0.01) {
        let handleSize = 9;
        let sliderVal = map(currentScroll, entryEnd, scrollPoints.endCentralAnim, 0, 100, true);

        let topLimit = currentY + 2;
        let bottomLimit = (currentY + sliderH) - handleSize - 2;
        let handleY = map(sliderVal, 0, 100, topLimit, bottomLimit);
        let handleX = currentX + 2;

        noStroke();
        fill(255);
        rect(handleX, handleY, handleSize, handleSize);
        drawTempLabel(sliderVal, currentX, handleY);
    }
    pop();
}

function drawSecondPage(scrollPos, endPoint) {
    push();
    if (imgs["background"]) {
        let img = imgs["background"];
        let baseScale = max(width / img.width, height / img.height);
        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let totalScale = baseScale * breath;
        let w = img.width * totalScale;
        let h = img.height * totalScale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        image(img, x, y, w, h);
    }

    // חלוקת הזמן לטקסטים
    // נשתמש בטווח שבין endPoint ל-textPageEnd
    let sectionLength = (SCENE_CONFIG.textPageEnd - endPoint) / 3;
    let t1Start = endPoint + 100;
    let t2Start = t1Start + sectionLength;
    let t3Start = t2Start + sectionLength;

    imageMode(CORNER);
    let op1 = 0, op2 = 0, op3 = 0;

    // טקסט 1
    if (scrollPos > t1Start && scrollPos < t1Start + sectionLength) {
        let mid = t1Start + (sectionLength / 2);
        if (scrollPos < mid) op1 = map(scrollPos, t1Start, mid, 0, 255, true);
        else op1 = map(scrollPos, mid, t1Start + sectionLength, 255, 0, true);
    }

    // טקסט 2
    if (scrollPos > t2Start && scrollPos < t2Start + sectionLength) {
        let mid = t2Start + (sectionLength / 2);
        if (scrollPos < mid) op2 = map(scrollPos, t2Start, mid, 0, 255, true);
        else op2 = map(scrollPos, mid, t2Start + sectionLength, 255, 0, true);
    }

    // טקסט 3
    if (scrollPos > t3Start) {
        // משאירים אותו עד הסוף ואז הוא נעלם בפייד השחור ב-draw הראשי
        if (scrollPos < t3Start + (sectionLength / 2))
            op3 = map(scrollPos, t3Start, t3Start + (sectionLength / 2), 0, 255, true);
        else op3 = 255;
    }

    if (imgs['text1'] && op1 > 0) {
        push(); drawingContext.globalAlpha = op1 / 255;
        imageMode(CENTER); image(imgs['text1'], width / 2, height / 2, imgs['text1'].width / 2, imgs['text1'].height / 2); pop();
    }
    if (imgs['text2'] && op2 > 0) {
        push(); drawingContext.globalAlpha = op2 / 255;
        imageMode(CENTER); image(imgs['text2'], width / 2, height / 2, imgs['text2'].width / 2, imgs['text2'].height / 2); pop();
    }
    if (imgs['text3'] && op3 > 0) {
        push(); drawingContext.globalAlpha = op3 / 255;
        imageMode(CENTER); image(imgs['text3'], width / 2, height / 2, imgs['text3'].width / 2, imgs['text3'].height / 2); pop();
    }
    pop();
}

function drawBlobsScene(scrollPos, intensity, sliderVal, targetX, targetY, targetScale, hideOuter) {
    let cx = (targetX !== undefined) ? targetX : width / 2;
    let cy = (targetY !== undefined) ? targetY : height / 2;
    let s = (targetScale !== undefined) ? targetScale : 1.0;
    drawSingleBlobCluster(cx, cy, scrollPos, intensity, sliderVal, hideOuter, s);
}

function drawSingleBlobCluster(x, y, scrollPos, intensity, sliderVal, hideOuter, scaleFactor = 1.0) {
    push();
    translate(x, y);

    let time = millis() * 0.0008;
    let effectiveIntensity = map(intensity, 0, 1, 0.5, 1.2);
    let breath = 1.05 + sin(millis() * 0.0015) * 0.02;

    // === הגדרת נקודות העלמות לכל שכבה ===
    let hideHeat = (scrollPos >= scrollPoints.endHeatTrans);
    let hideMolec = (scrollPos >= scrollPoints.endMolecTrans);
    // תוספת: נקודת העלמות למרכז (כשהחיות עולות)
    let hideOcean = (scrollPos >= scrollPoints.endOceanTrans); 

    // הלולאה רצה מהשכבה החיצונית (2) לפנימית (0)
    for (let i = 2; i >= 0; i--) {
        
        // 1. הסתרת השכבה החיצונית (Heat)
        if (i === 2 && hideHeat) continue;
        
        // 2. הסתרת השכבה האמצעית (Molecules) - התיקון שביקשת
        if (i === 1 && hideMolec) continue;

        // 3. הסתרת המרכז (Ocean/Creatures) - רק בסוף
        if (i === 0 && hideOcean) continue;

        let baseSize = ((600 + (i * 720)) * 0.3) * scaleFactor;
        let noiseScale = (1.5 + (i * 0.2)) * (effectiveIntensity + 0.5);
        let distortionAmount = (baseSize / 3) * effectiveIntensity;

        if ((i === 2 && heatFrames.length > 0) || (i === 1 && creaturesFrames.length > 0) || (i === 0 && oceanFrames.length > 0)) {

            let currentFrames;
            if (i === 2) currentFrames = heatFrames;
            else if (i === 1) currentFrames = creaturesFrames;
            else currentFrames = oceanFrames;

            mainMaskBuffer.clear();
            mainMaskBuffer.push();
            mainMaskBuffer.translate(x, y);
            mainMaskBuffer.noStroke();
            mainMaskBuffer.fill(0);
            mainMaskBuffer.beginShape();
            for (let a = 0; a < TWO_PI; a += 0.05) {
                let xoff = map(cos(a), -1, 1, 0, noiseScale);
                let yoff = map(sin(a), -1, 1, 0, noiseScale);
                let n = noise(xoff, yoff, time + (i * 10));
                let r = baseSize + map(n, 0, 1, -distortionAmount, distortionAmount);
                mainMaskBuffer.vertex(r * cos(a), r * sin(a));
            }
            mainMaskBuffer.endShape(CLOSE);
            mainMaskBuffer.pop();

            mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-in';

            let safeVal = (typeof sliderVal !== 'undefined') ? sliderVal : 0;
            let frameIndex = floor(map(safeVal, 0, 100, 0, currentFrames.length - 1));
            frameIndex = constrain(frameIndex, 0, currentFrames.length - 1);
            let img = currentFrames[frameIndex];

            let baseImgScale = max(width / img.width, height / img.height);
            let totalImgScale = baseImgScale * breath;

            let w = img.width * totalImgScale;
            let h = img.height * totalImgScale;
            let imgX = (width - w) / 2;
            let imgY = (height - h) / 2;

            mainMaskBuffer.image(img, imgX, imgY, w, h);
            mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-over';

            image(mainMaskBuffer, -x, -y);

        } else {
            fill(blobColors[i]);
            noStroke();
            beginShape();
            for (let a = 0; a < TWO_PI; a += 0.05) {
                let xoff = map(cos(a), -1, 1, 0, noiseScale);
                let yoff = map(sin(a), -1, 1, 0, noiseScale);
                let n = noise(xoff, yoff, time + (i * 10));
                let r = baseSize + map(n, 0, 1, -distortionAmount, distortionAmount);
                vertex(r * cos(a), r * sin(a));
            }
            endShape(CLOSE);
        }
    }
    pop();
}

function drawMyObject(breakoutAmount, currentScale, objectOpacity) {
    push();
    drawingContext.globalAlpha = objectOpacity / 255;
    let floatY = sin(millis() * 0.0015) * 10;
    let groupX = width / 2;
    let groupY = height / 2 + 50 + floatY;
    let realScale = currentScale * 1.7;

    translate(groupX, groupY);
    scale(realScale);
    translate(-770, -550);

    if (imgs["הר ירוק שמאל"]) image(imgs["הר ירוק שמאל"], 116 - breakoutAmount * 1200, 125 - breakoutAmount * 300);
    if (imgs["הר יחיד"]) image(imgs["הר יחיד"], 574 - breakoutAmount * 350, 230 + breakoutAmount * 200);
    if (imgs["ירוקת ימין"]) image(imgs["ירוקת ימין"], 1098 + breakoutAmount * 100, 200);
    if (imgs["אבן"]) image(imgs["אבן"], 733 + breakoutAmount * 700, 203 - breakoutAmount * 400);
    if (imgs["ירידה 3"]) image(imgs["ירידה 3"], 640 - breakoutAmount * 200, 325 - breakoutAmount * 500);
    if (imgs["ירוקת שמאל"]) image(imgs["ירוקת שמאל"], 393 - breakoutAmount * 200, 124 - breakoutAmount * 500);
    if (imgs["ירידה 2"]) image(imgs["ירידה 2"], 464 - breakoutAmount * 400, 245 - breakoutAmount * 500);

    if (imgs['waterMask'] && imgs['background']) {
        let maskImg = imgs['waterMask'];
        let bgImg = imgs['background'];
        let waterX = 574 + breakoutAmount * 55;
        let waterY = 451 + breakoutAmount * 15;
        let globalWaterX = groupX + (waterX - 770) * realScale;
        let globalWaterY = groupY + (waterY - 550) * realScale;
        let growthProgress = constrain(map(currentScale, 0.4, 1.0, 0, 1), 0, 1);
        let sizeFactor = lerp(0.6, 1.0, growthProgress);
        let baseBgScale = max(width / bgImg.width, height / bgImg.height);
        let finalBgW = bgImg.width * baseBgScale * sizeFactor;
        let finalBgH = bgImg.height * baseBgScale * sizeFactor;
        let finalBgX = (width - finalBgW) / 2;
        let finalBgY = (height - finalBgH) / 2;

        waterBuffer.clear();
        waterBuffer.push();
        waterBuffer.image(maskImg, 0, 0, maskImg.width, maskImg.height);
        waterBuffer.drawingContext.globalCompositeOperation = 'source-in';
        let drawX = (finalBgX - globalWaterX) / realScale;
        let drawY = (finalBgY - globalWaterY) / realScale;
        let drawW = finalBgW / realScale;
        let drawH = finalBgH / realScale;
        waterBuffer.image(bgImg, drawX, drawY, drawW, drawH);
        waterBuffer.drawingContext.globalCompositeOperation = 'source-over';
        waterBuffer.pop();
        image(waterBuffer, waterX, waterY);
    }
    else if (imgs["מים"]) {
        image(imgs["מים"], 574 + breakoutAmount * 55, 451 + breakoutAmount * 15);
    }

    if (imgs["ירידה 4"]) image(imgs["ירידה 4"], 717 + breakoutAmount * 600, 310);
    if (imgs["ירידה 1"]) image(imgs["ירידה 1"], 376 - breakoutAmount * 600, 341);
    if (imgs["הר עור שמאל"]) image(imgs["הר עור שמאל"], 117 - breakoutAmount * 500, 429);
    if (imgs["רכס מקדימה ימין"]) image(imgs["רכס מקדימה ימין"], 697 + breakoutAmount * 500, 482 + breakoutAmount * 600);
    if (imgs["הר ימין קדימה"]) image(imgs["הר ימין קדימה"], 1098 + breakoutAmount * 900, 616);
    if (imgs["tree-1"]) image(imgs["tree-1"], 120 - breakoutAmount * 1200, 240);
    if (imgs["tree"]) image(imgs["tree"], 1310 + breakoutAmount * 500, 610);
    if (imgs["הר שמאל קטן"]) image(imgs["הר שמאל קטן"], 122 + breakoutAmount * 700, 582 + breakoutAmount * 100);

    drawingContext.globalAlpha = 1.0;
    pop();
}

function drawCustomSlider(progress, customX) {
    push();
    let sliderW = 13;
    let margin = 16;
    let sliderH = height - (margin * 2);
    let rectW = width * 0.27;

    let currentX;
    if (typeof customX !== 'undefined') currentX = customX;
    else currentX = rectW + margin;

    let currentY = margin;

    noFill();
    strokeWeight(2);

    let cPink = color('#FF006A');
    let cLightBlue = color('#1BA0D0');
    let cDarkBlue = color(0, 0, 137);

    for (let i = 0; i < sliderH; i += 2) {
        let inter = map(i, 0, sliderH, 0, 1);
        let c;
        if (inter < 0.5) {
            let subInter = map(inter, 0, 0.5, 0, 1);
            c = lerpColor(cPink, cLightBlue, subInter);
        } else {
            let subInter = map(inter, 0.5, 1, 0, 1);
            c = lerpColor(cLightBlue, cDarkBlue, subInter);
        }
        stroke(c);
        line(currentX, currentY + i, currentX + sliderW, currentY + i);
    }

    let handleSize = 9;
    let topLimit = currentY + 2;
    let bottomLimit = (currentY + sliderH) - handleSize - 2;
    let handleY = map(progress, 0, 1, topLimit, bottomLimit);
    let calculatedSliderVal = map(handleY, topLimit, bottomLimit, 0, 100);
    let handleX = currentX + 2;
    noStroke();
    fill(255);
    rect(handleX, handleY, handleSize, handleSize);
    drawTempLabel(calculatedSliderVal, currentX, handleY);
    pop();
}

function drawResidueBlob(x, y, alpha, textureImg, layerIndex = 0, targetScale = 0.6) {
    push();
    let time = millis() * 0.0008;
    let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
    
    // שימוש ב-targetScale במקום המספר הקבוע 0.6 שהיה כאן
    let baseSize = ((600 + (layerIndex * 720)) * 0.3) * targetScale;
    
    let intensity = 1.0;
    let effectiveIntensity = map(intensity, 0, 1, 0.5, 1.2);
    let noiseScale = 1.5 * (effectiveIntensity + 0.5);
    let distortionAmount = (baseSize / 3) * effectiveIntensity;

    mainMaskBuffer.clear();
    mainMaskBuffer.push();
    mainMaskBuffer.translate(x, y);
    mainMaskBuffer.noStroke();
    mainMaskBuffer.fill(0);
    mainMaskBuffer.beginShape();
    for (let a = 0; a < TWO_PI; a += 0.05) {
        let xoff = map(cos(a), -1, 1, 0, noiseScale);
        let yoff = map(sin(a), -1, 1, 0, noiseScale);
        let n = noise(xoff, yoff, time + 1000 + (layerIndex * 10));
        let r = baseSize + map(n, 0, 1, -distortionAmount, distortionAmount);
        mainMaskBuffer.vertex(r * cos(a), r * sin(a));
    }
    mainMaskBuffer.endShape(CLOSE);

    mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-in';
    if (textureImg) {
        let baseScale = max(width / textureImg.width, height / textureImg.height);
        let totalScale = baseScale * breath;
        let imgW = textureImg.width * totalScale;
        let imgH = textureImg.height * totalScale;
        let globalImgX = (width - imgW) / 2;
        let globalImgY = (height - imgH) / 2;
        mainMaskBuffer.image(textureImg, globalImgX - x, globalImgY - y, imgW, imgH);
    }
    mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-over';
    mainMaskBuffer.pop();

    drawingContext.globalAlpha = alpha / 255;
    image(mainMaskBuffer, 0, 0);
    drawingContext.globalAlpha = 1.0;
    pop();
}

function drawLayerLabels(scrollPos, sliderVal) {
    let alpha = 255;
    let startLabels = SCENE_CONFIG.textPageEnd; // התחלה
    let endLabels = startLabels + 500; // כמה זמן רואים אותם
    let fadeOutStart = scrollPoints.startSurfaceStatic - 500;

    // כניסה (Fade In)
    if (scrollPos < endLabels) {
        alpha = map(scrollPos, startLabels, endLabels, 0, 255, true);
    }
    // יציאה (Fade Out)
    else if (scrollPos > fadeOutStart) {
        alpha = map(scrollPos, fadeOutStart, scrollPoints.startSurfaceStatic, 255, 0, true);
    }

    if (alpha > 0) {
        push();
        let centerX = width / 2;
        let centerY = height / 2;
        let sizeLarge = (600 + (2 * 720)) * 0.3;
        let sizeMedium = (600 + (1 * 720)) * 0.3;

        let x1 = centerX - (sizeLarge * 0.90);
        let y1 = centerY - (sizeLarge * 0.5);
        drawLabelAt("Thermalhome", x1, y1, alpha, heatFrames, sliderVal);

        let x2 = centerX - (sizeLarge * 0.3);
        let y2 = centerY + (sizeLarge * 0.2);
        drawLabelAt("Biologicalhome", x2, y2, alpha, oceanFrames, sliderVal);

        let x3 = centerX + (sizeMedium * 0.5);
        let y3 = centerY - (sizeMedium * 0.6);
        drawLabelAt("Molecularhome", x3, y3, alpha, creaturesFrames, sliderVal);

        let x4 = centerX + (sizeLarge * 0.90);
        let y4 = centerY + (sizeLarge * 0.45);
        drawLabelAt("Surfacehome", x4, y4, alpha, surfaceFrames, sliderVal);
        pop();
    }
}

function drawLabelAt(name, x, y, alpha, textureFrames, sliderVal) {
    let img = imgs[name];
    if (img) {
        let scaleRatio = 0.5;
        let w = img.width * scaleRatio;
        let h = img.height * scaleRatio;
        
        // ציפה שונה מעט לכל תווית
        let floatY = sin(millis() * 0.002 + x) * 5;
        
        // מיקום התווית בפועל (בפונקציה זו, x,y הם הפינה השמאלית עליונה כי משתמשים ב-Translate)
        let drawX = x;
        let drawY = y + floatY;

        push();
        // במקום translate, נחשב מיקומים אבסולוטיים כדי למנוע בלבול עם המסיכה

        if (textureFrames && textureFrames.length > 0) {
            mainMaskBuffer.clear();
            mainMaskBuffer.push();
            mainMaskBuffer.noStroke();
            mainMaskBuffer.fill(0);
            mainMaskBuffer.rect(0, 0, w, h);
            mainMaskBuffer.pop();

            let frameIndex = floor(map(sliderVal, 0, 100, 0, textureFrames.length - 1));
            frameIndex = constrain(frameIndex, 0, textureFrames.length - 1);
            let texImg = textureFrames[frameIndex];

            // === אותו תיקון "חלון" ===
            
            // 1. חישוב נשימה לרקע (חייב להיות זהה לזה של ה-Background הראשי)
            let breath = 1.05 + sin(millis() * 0.0015) * 0.02;

            let baseScale = max(width / texImg.width, height / texImg.height);
            let totalScale = baseScale * breath; 
            
            let bigW = texImg.width * totalScale;
            let bigH = texImg.height * totalScale;
            
            let globalTexX = (width - bigW) / 2;
            let globalTexY = (height - bigH) / 2;

            // בפונקציה הזו המיקום הוא הפינה השמאלית (לא מרכז)
            let localTexX = globalTexX - drawX;
            let localTexY = globalTexY - drawY;

            mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-in';
            mainMaskBuffer.image(texImg, localTexX, localTexY, bigW, bigH);
            mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-over';

            // ציור הבאפר
            drawingContext.globalAlpha = alpha / 255;
            // כאן אנחנו מציירים במיקום drawX, drawY ישירות
            imageMode(CORNER);
            image(mainMaskBuffer, drawX, drawY, w, h, 0, 0, w, h);

        } else {
            noStroke();
            fill(255, 115, 174, alpha);
            rectMode(CORNER);
            rect(drawX, drawY, w, h);
        }

        // ציור הכותרת
        drawingContext.globalAlpha = alpha / 255;
        imageMode(CORNER);
        image(img, drawX, drawY, w, h);
        
        drawingContext.globalAlpha = 1.0;
        pop();
    }
}

function drawTempLabel(sliderVal, sliderX, handleY) {
    let currentTemp = map(sliderVal, 0, 100, 20, -20);
    let tempInt = round(currentTemp);
    tempInt = constrain(tempInt, -20, 20);
    let imgKey = tempInt + '°C';
    let tempImg = imgs[imgKey];
    let scaleRatio = 0.5;
    let boxW = 88;
    let boxH = 29;
    let boxX = sliderX + 13 + 25;
    let boxY = handleY - (boxH / 2) + 4;
    let cPink = color('#FF006A');
    let cLightBlue = color('#1BA0D0');
    let cDarkBlue = color(0, 0, 137);
    let boxColor;
    if (currentTemp >= 0) {
        let amt = map(currentTemp, 0, 20, 0, 1);
        boxColor = lerpColor(cLightBlue, cPink, amt);
    } else {
        let amt = map(currentTemp, -20, 0, 0, 1);
        boxColor = lerpColor(cDarkBlue, cLightBlue, amt);
    }
    push();
    noStroke();
    fill(boxColor);
    rectMode(CORNER);
    rect(boxX, boxY, boxW, boxH);
    pop();
    if (tempImg) {
        let tw = tempImg.width * scaleRatio;
        let th = tempImg.height * scaleRatio;
        let numX = boxX + (boxW - tw) / 2;
        let numY = boxY + (boxH - th) / 2;
        drawingContext.globalAlpha = 1.0;
        imageMode(CORNER);
        image(tempImg, numX, numY, tw, th);
    }
}

function drawStaticSidebar(sliderVal, customX, drawBg = true) {
    push();
    let startX = (typeof customX !== 'undefined') ? customX : 0;
    let rectW = width * 0.27;

    if (drawBg) {
        noStroke();
        fill(0, 0, 35, 140);
        rect(startX, 0, rectW, height);
    }
    let margin = 16;
    let sliderX = startX + rectW + margin;
    let sliderY = margin;
    let sliderH = height - (margin * 2);
    let sliderW = 13;
    noFill();
    strokeWeight(2);
    let cPink = color('#FF006A');
    let cLightBlue = color('#1BA0D0');
    let cDarkBlue = color(0, 0, 137);
    for (let i = 0; i < sliderH; i += 2) {
        let inter = map(i, 0, sliderH, 0, 1);
        let c;
        if (inter < 0.5) {
            let subInter = map(inter, 0, 0.5, 0, 1);
            c = lerpColor(cPink, cLightBlue, subInter);
        } else {
            let subInter = map(inter, 0.5, 1, 0, 1);
            c = lerpColor(cLightBlue, cDarkBlue, subInter);
        }
        stroke(c);
        line(sliderX, sliderY + i, sliderX + sliderW, sliderY + i);
    }
    let handleSize = 9;
    let topLimit = sliderY + 2;
    let bottomLimit = (sliderY + sliderH) - handleSize - 2;
    let safeVal = (typeof sliderVal !== 'undefined') ? sliderVal : 0;
    let handleY = map(safeVal, 0, 100, topLimit, bottomLimit);
    let handleX = sliderX + 2;
    noStroke();
    fill(255);
    rect(handleX, handleY, handleSize, handleSize);
    drawTempLabel(safeVal, sliderX, handleY);
    pop();
}

function drawSurfaceTexts(xPos, sliderVal = 0, drawBracket = true, bracketAlpha = 255) {
    let rectW = width * 0.27;
    let scaleRatio = 0.5;
    
    // מיקומים קבועים
    let fixedTitleY = 20;
    let fixedVarTextY = 180; 

    // === תיקון: החזרת המסיכה הכהה מאחורי הטקסט ===
    push(); 
    noStroke(); 
    fill(0, 0, 35, 10); 
    rect(xPos, 0, rectW, height); 
    pop();

    imageMode(CORNER);

   if (drawBracket) {
        drawRangeBracket(xPos, rectW, sliderVal, bracketAlpha);
    }

    // 1. ציור הכותרת
    if (imgs['SurfaceTP']) {
        let img = imgs['SurfaceTP'];
        let h = img.height * scaleRatio;
        image(img, xPos, fixedTitleY, img.width * scaleRatio, h);
    }
    
    // 2. ציור הטקסט המשתנה
    let currentTemp = map(sliderVal, 0, 100, 20, -20);
    let statusImgName = (currentTemp > 4) ? "ActiveSurface(20°C-4°C)" : 
                        (currentTemp > 0) ? "AnomalousSurface(4°C-0°C)" : 
                        (currentTemp > -10) ? "CrystallineSurface(0°C-(-10°C))" : "InsulativeSurface((-10°C) - (-20°C))";
    
    let statusImg = imgs[statusImgName];
    if (statusImg) {
        image(statusImg, xPos, fixedVarTextY, statusImg.width * scaleRatio, statusImg.height * scaleRatio);
    }

    // 3. מקרא (Legend)
    if (imgs['surfacelegend']) {
        let img = imgs['surfacelegend'];
        let h = img.height * scaleRatio;
        let legendY = height - h - 20; 
        image(img, xPos, legendY, img.width * scaleRatio, h);
    }
}

function drawThermalTexts(xPos, sliderVal = 0, drawBracket = true) {
    let rectW = width * 0.27;
    
    // רקע כהה
    push(); noStroke(); fill(0, 0, 35, 10); rect(xPos, 0, rectW, height); pop();

    if (drawBracket) drawRangeBracket(xPos, rectW, sliderVal);

    let scaleRatio = 0.5;
    let fixedTitleY = 20;
    let fixedVarTextY = 180;

    imageMode(CORNER);

    // 1. כותרת
    if (imgs['thermalTP']) {
        let h = imgs['thermalTP'].height * scaleRatio;
        image(imgs['thermalTP'], xPos, fixedTitleY, imgs['thermalTP'].width * scaleRatio, h);
    }

    // 2. טקסט משתנה
    let currentTemp = map(sliderVal, 0, 100, 20, -20);
    let statusName = (currentTemp > 4) ? "hotesttextthem" : (currentTemp > 0) ? "hottexttherm" : (currentTemp > -10) ? "coldtexttherm" : "coldesttexttherm";
    if (imgs[statusName]) {
        image(imgs[statusName], xPos, fixedVarTextY, imgs[statusName].width * scaleRatio, imgs[statusName].height * scaleRatio);
    }

    // 3. מקרא - ללא ThermalL
    if (imgs['trmplegend']) {
        let h = imgs['trmplegend'].height * scaleRatio;
        let legendY = height - h - 20; 
        image(imgs['trmplegend'], xPos, legendY, imgs['trmplegend'].width * scaleRatio, h);
    }
}

function drawMolecTexts(xPos, sliderVal = 0) {
    let rectW = width * 0.27;
    push(); noStroke(); fill(0, 0, 35, 110); rect(xPos, 0, rectW, height); pop();
    drawRangeBracket(xPos, rectW, sliderVal);

    let scaleRatio = 0.5;
    let fixedTitleY = 20;
    let fixedVarTextY = 180;

    imageMode(CORNER);

    // 1. כותרת
    if (imgs['MolecularTP']) {
        let h = imgs['MolecularTP'].height * scaleRatio;
        image(imgs['MolecularTP'], xPos, fixedTitleY, imgs['MolecularTP'].width * scaleRatio, h);
    }

    // 2. טקסט משתנה
    let currentTemp = map(sliderVal, 0, 100, 20, -20);
    let statusName = (currentTemp > 4) ? "hotesttextmolco" : (currentTemp > 0) ? "hottextmoleco" : (currentTemp > -10) ? "coldtextmoleco" : "coldesttextmolco";
    if (imgs[statusName]) {
        image(imgs[statusName], xPos, fixedVarTextY, imgs[statusName].width * scaleRatio, imgs[statusName].height * scaleRatio);
    }

    // 3. מקרא - ללא MolecularL
    if (imgs['molecolegnd']) {
        let h = imgs['molecolegnd'].height * scaleRatio;
        let legendY = height - h - 20;
        image(imgs['molecolegnd'], xPos, legendY, imgs['molecolegnd'].width * scaleRatio, h);
    }
}

function drawOceanTexts(xPos, sliderVal = 0, drawBracket = true) {
    let rectW = width * 0.27;
    push(); noStroke(); fill(0, 0, 0, 80); rect(xPos, 0, rectW, height); pop();
    if (drawBracket) drawRangeBracket(xPos, rectW, sliderVal);

    let scaleRatio = 0.5;
    let fixedTitleY = 20;
    let fixedVarTextY = 180;

    imageMode(CORNER);

    // 1. כותרת
    if (imgs['BiologicalTP']) {
        let h = imgs['BiologicalTP'].height * scaleRatio;
        image(imgs['BiologicalTP'], xPos, fixedTitleY, imgs['BiologicalTP'].width * scaleRatio, h);
    }

    // 2. טקסט משתנה
    let currentTemp = map(sliderVal, 0, 100, 20, -20);
    let statusName = (currentTemp > 4) ? "hotesttextbiolo" : (currentTemp > 0) ? "hottextbiolo" : (currentTemp > -10) ? "coldtextbiolo" : "coldesttextbiolo";
    if (imgs[statusName]) {
        image(imgs[statusName], xPos, fixedVarTextY, imgs[statusName].width * scaleRatio, imgs[statusName].height * scaleRatio);
    }

    // 3. מקרא - ללא BiologicalL
    if (imgs['biololegend']) {
        let h = imgs['biololegend'].height * scaleRatio;
        let legendY = height - h - 20;
        image(imgs['biololegend'], xPos, legendY, imgs['biololegend'].width * scaleRatio, h);
    }
}

function drawSmallSurfaceBlob(x, y, scrollPos, intensity, sliderVal, scaleFactor) {
    push();
    translate(x, y);

    let time = millis() * 0.0008;
    let breath = 1.05 + sin(millis() * 0.0015) * 0.02;

    let effectiveIntensity = map(intensity, 0, 1, 0.5, 1.2);

    // אם לא קיבלנו scaleFactor, נשתמש בערך ברירת המחדל הקודם (0.6)
    let s = (typeof scaleFactor !== 'undefined') ? scaleFactor : 0.6;
    let baseSize = (600 * 0.3) * s;

    let noiseScale = 1.5 * (effectiveIntensity + 0.5);
    let distortionAmount = (baseSize / 3) * effectiveIntensity;

    if (surfaceFrames.length > 0) {
        mainMaskBuffer.clear();
        mainMaskBuffer.push();
        mainMaskBuffer.translate(x, y);
        mainMaskBuffer.noStroke();
        mainMaskBuffer.fill(0);
        mainMaskBuffer.beginShape();
        for (let a = 0; a < TWO_PI; a += 0.05) {
            let xoff = map(cos(a), -1, 1, 0, noiseScale);
            let yoff = map(sin(a), -1, 1, 0, noiseScale);
            let n = noise(xoff, yoff, time);
            let r = baseSize + map(n, 0, 1, -distortionAmount, distortionAmount);
            mainMaskBuffer.vertex(r * cos(a), r * sin(a));
        }
        mainMaskBuffer.endShape(CLOSE);
        mainMaskBuffer.pop();

        mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-in';

        let safeVal = (typeof sliderVal !== 'undefined') ? sliderVal : 0;
        let frameIndex = floor(map(safeVal, 0, 100, 0, surfaceFrames.length - 1));
        frameIndex = constrain(frameIndex, 0, surfaceFrames.length - 1);
        let img = surfaceFrames[frameIndex];

        let baseImgScale = max(width / img.width, height / img.height);
        let totalImgScale = baseImgScale * breath;

        let w = img.width * totalImgScale;
        let h = img.height * totalImgScale;
        let imgX = (width - w) / 2;
        let imgY = (height - h) / 2;

        mainMaskBuffer.image(img, imgX, imgY, w, h);
        mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-over';

        image(mainMaskBuffer, -x, -y);
    }
    pop();
}

function drawRangeBracket(xPos, sectionWidth, sliderVal, alpha = 255) {
    // אם השקיפות היא 0, אין טעם לצייר
    if (alpha <= 0) return;

    // 1. זיהוי הטווח הנוכחי לפי הטמפרטורה
    let t = map(sliderVal, 0, 100, 20, -20);
    let topT, bottomT;

    if (t > 4) {
        topT = 20; bottomT = 4;
    } else if (t <= 4 && t > 0) {
        topT = 4; bottomT = 0;
    } else if (t <= 0 && t > -10) {
        topT = 0; bottomT = -10;
    } else {
        topT = -10; bottomT = -20;
    }

    // 2. המרה לפיקסלים עבור הסוגריים
    let margin = 20; 
    let sliderH = height - (margin * 2);
    let yTop = map(topT, 20, -20, margin, margin + sliderH);
    let yBottom = map(bottomT, 20, -20, margin, margin + sliderH);
    let bracketMidY = (yTop + yBottom) / 2;

    // === עדכון גובה הקו המחבר ===
    let textStartY = 195; 
    
    let bracketX = xPos + sectionWidth - 15;
    let connectorX = xPos + sectionWidth - 45; 

    push();
    // === השינוי כאן: השימוש באלפא עבור הצבע ===
    stroke(255, alpha); 
    strokeWeight(1);
    noFill();

    // --- ציור הסוגריים [ ---
    let legLen = 15;
    beginShape();
    vertex(bracketX + legLen, yTop);       
    vertex(bracketX, yTop);                
    vertex(bracketX, yBottom);             
    vertex(bracketX + legLen, yBottom);    
    endShape();

    // --- ציור הקו המחבר ---
    beginShape();
    vertex(connectorX - 40, textStartY); // נקודת התחלה
    vertex(connectorX, textStartY);       
    vertex(connectorX, bracketMidY);      
    vertex(bracketX, bracketMidY);        
    endShape();

    pop();
}

function drawReverseTransition(scrollPos) {
    let startTrans = scrollPoints.startReverseTrans;
    let endTrans = scrollPoints.endReverseTrans;

    let t = constrain(map(scrollPos, startTrans, endTrans, 0, 1), 0, 1);
    let smoothT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // תנועה מהפינה התחתונה למרכז
    let startX = width;
    let startY = height;
    
    // מתחילים בגודל 0.6 (גודל השאריות) וגדלים ל-1.0 (גודל מלא)
    let startScale = 0.6; 
    let endX = width / 2;
    let endY = height / 2;
    let endScale = 1.0; 

    let curX = lerp(startX, endX, smoothT);
    let curY = lerp(startY, endY, smoothT);
    let curScale = lerp(startScale, endScale, smoothT);

    push();

    // 1. רקע נשאר (אוקיינוס) - ללא שינוי
    if (oceanFrames.length > 0) {
        let bgImg = oceanFrames[oceanFrames.length - 1];
        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let baseScale = max(width / bgImg.width, height / bgImg.height);
        let totalScale = baseScale * breath;
        let w = bgImg.width * totalScale;
        let h = bgImg.height * totalScale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        
        drawingContext.globalAlpha = 1.0;
        image(bgImg, x, y, w, h);
    }

    // 2. התיקון: בניית הבלוב מאותן שכבות של ה"שאריות" בדיוק
    // אנחנו משתמשים בפריימים האחרונים של כל מערך, כמו בשאריות
    
    // שכבה חיצונית: מולקולות (Layer 2)
    if (creaturesFrames.length > 0) {
        let lastMolecImg = creaturesFrames[creaturesFrames.length - 1];
        drawResidueBlob(curX, curY, 255, lastMolecImg, 2, curScale);
    }

    // שכבה אמצעית: חום (Layer 1)
    if (heatFrames.length > 0) {
        let lastHeatImg = heatFrames[heatFrames.length - 1];
        drawResidueBlob(curX, curY, 255, lastHeatImg, 1, curScale);
    }

    // שכבה פנימית: סרפס (Layer 0) - מה שרצית שיהיה במרכז
    if (surfaceFrames.length > 0) {
        let lastSurfaceImg = surfaceFrames[surfaceFrames.length - 1];
        drawResidueBlob(curX, curY, 255, lastSurfaceImg, 0, curScale);
    }

    // 3. העלמת הטקסטים והסרגל - ללא שינוי
    let rectW = width * 0.27;
    let slideX = map(smoothT, 0, 1, 0, -rectW);
    let alphaOut = map(smoothT, 0, 1, 255, 0);

    if (alphaOut > 0) {
        push();
        drawingContext.globalAlpha = alphaOut / 255;
        drawStaticSidebar(100, slideX);
        drawOceanTexts(slideX, 100);
        pop();
    }

    pop();
}

function drawFooter(scrollPos, startScroll, endScroll) {
    // 1. ציור הרקע הנושם (תמיד)
    if (imgs["background"]) {
        push();
        let img = imgs["background"];
        let baseScale = max(width / img.width, height / img.height);
        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let totalScale = baseScale * breath;
        let w = img.width * totalScale;
        let h = img.height * totalScale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        image(img, x, y, w, h);
        pop();
    }

    // 2. טיפול ב-Footer (כניסה - השהייה - יציאה)
    let showStart = startScroll + 500;   
    let stayStart = showStart + 500;     
    let hideStart = endScroll - 500;     

    let fotterAlpha = 0;

    if (scrollPos > showStart && scrollPos < stayStart) {
        fotterAlpha = map(scrollPos, showStart, stayStart, 0, 255, true);
    }
    else if (scrollPos >= stayStart && scrollPos < hideStart) {
        fotterAlpha = 255;
    }
    else if (scrollPos >= hideStart) {
        fotterAlpha = map(scrollPos, hideStart, endScroll, 255, 0, true);
    }

    if (imgs['fotter'] && fotterAlpha > 0) {
        push();
        drawingContext.globalAlpha = fotterAlpha / 255;
        let fotterImg = imgs['fotter'];
        let scaleRatio = 0.5;
        imageMode(CENTER);
        image(fotterImg, width / 2, height / 2, fotterImg.width * scaleRatio, fotterImg.height * scaleRatio);
        pop();
    }
}

function drawBlobDissolve(scrollPos) {
    let start = scrollPoints.startDissolve;
    let end = scrollPoints.endDissolve;
    
    // חישוב ההתקדמות מ-0 ל-1
    let p = constrain(map(scrollPos, start, end, 0, 1), 0, 1);

    push();

    // === שלב 1: הרקע החדש (Dash Background) נכנס ===
    let bgDashAlpha = map(p, 0, 1, 0, 255);
    if (imgs["background"]) {
        push();
        let img = imgs["background"];
        let baseScale = max(width / img.width, height / img.height);
        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let totalScale = baseScale * breath;
        let w = img.width * totalScale;
        let h = img.height * totalScale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        
        drawingContext.globalAlpha = bgDashAlpha / 255;
        image(img, x, y, w, h);
        pop();
    }

    // === שלב 2: רקע האוקיינוס נעלם ===
    let oceanAlpha = map(p, 0, 1, 255, 0);
    if (oceanFrames.length > 0) {
        push();
        let bgImg = oceanFrames[oceanFrames.length - 1];
        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let baseScale = max(width / bgImg.width, height / bgImg.height);
        let totalScale = baseScale * breath;
        let w = bgImg.width * totalScale;
        let h = bgImg.height * totalScale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        
        drawingContext.globalAlpha = oceanAlpha / 255;
        image(bgImg, x, y, w, h);
        pop();
    }

    // === שלב 3: הבלוב מתפייד (מבלי לשנות צורה) ===
    
    // שקיפות יורדת מ-255 ל-0
    let blobAlpha = map(p, 0, 1, 255, 0);
    
    // סקייל גדל מעט מ-1.0 (סוף הרוורס) ל-1.15 (אפקט התנדפות)
    let dissolveScale = lerp(1.0, 1.15, p);
    
    let cx = width / 2;
    let cy = height / 2;

    // כאן אנחנו משתמשים ב-drawResidueBlob כדי לשמור על אותו המראה בדיוק!
    // מציירים את 3 השכבות כמו בפונקציית הרוורס:

    // שכבה חיצונית (מולקולות)
    if (creaturesFrames.length > 0) {
        let lastImg = creaturesFrames[creaturesFrames.length - 1];
        drawResidueBlob(cx, cy, blobAlpha, lastImg, 2, dissolveScale);
    }

    // שכבה אמצעית (חום)
    if (heatFrames.length > 0) {
        let lastImg = heatFrames[heatFrames.length - 1];
        drawResidueBlob(cx, cy, blobAlpha, lastImg, 1, dissolveScale);
    }

    // שכבה פנימית (סרפס)
    if (surfaceFrames.length > 0) {
        let lastImg = surfaceFrames[surfaceFrames.length - 1];
        drawResidueBlob(cx, cy, blobAlpha, lastImg, 0, dissolveScale);
    }
    
    pop();
}

function drawBreathingLabel(imgName, x, y, alpha = 255, textureFrames = [], sliderVal = 0) {
    if (imgs[imgName] && alpha > 0) {
        let img = imgs[imgName];

        let breath = 1.05 + sin(millis() * 0.0015) * 0.02;
        let scaleRatio = 0.5 * breath;
        let w = img.width * scaleRatio;
        let h = img.height * scaleRatio;

        let floatY = sin(millis() * 0.002) * 3;
        let drawX = x;
        let drawY = y + floatY;

        push();

        // --- שלב המסיכה ---
        // השינוי כאן: מציירים רקע רק אם יש פריימים. אחרת - כלום (שקוף).
        if (textureFrames && textureFrames.length > 0) {
            
            mainMaskBuffer.clear();
            mainMaskBuffer.push();
            mainMaskBuffer.noStroke();
            mainMaskBuffer.fill(0);
            mainMaskBuffer.rect(0, 0, w, h);
            mainMaskBuffer.pop();

            let frameIndex = floor(map(sliderVal, 0, 100, 0, textureFrames.length - 1));
            frameIndex = constrain(frameIndex, 0, textureFrames.length - 1);
            let texImg = textureFrames[frameIndex];

            // חישוב ה-"חלון" (אותו תיקון ממקודם)
            let baseScale = max(width / texImg.width, height / texImg.height);
            let totalScale = baseScale * breath;
            
            let bigW = texImg.width * totalScale;
            let bigH = texImg.height * totalScale;

            let globalTexX = (width - bigW) / 2;
            let globalTexY = (height - bigH) / 2;

            let maskLeftX = drawX - (w / 2);
            let maskTopY = drawY - (h / 2);

            let localTexX = globalTexX - maskLeftX;
            let localTexY = globalTexY - maskTopY;

            mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-in';
            mainMaskBuffer.image(texImg, localTexX, localTexY, bigW, bigH);
            mainMaskBuffer.drawingContext.globalCompositeOperation = 'source-over';

            drawingContext.globalAlpha = alpha / 255;
            imageMode(CENTER);
            image(mainMaskBuffer, drawX, drawY, w, h, 0, 0, w, h);
        }
        // מחקתי את ה-else שצייר כאן ריבוע ורוד. עכשיו אם אין פריימים, אין רקע.

        // --- ציור הטקסט (הכותרת) ---
        drawingContext.globalAlpha = alpha / 255;
        imageMode(CENTER);
        image(img, drawX, drawY, w, h);

        drawingContext.globalAlpha = 1.0;
        pop();
    }
}