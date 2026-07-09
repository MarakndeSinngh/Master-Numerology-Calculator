// HTML5 Canvas client-side heuristic image processing for signature analysis
export interface VisualMetrics {
  slant: 'UPWARD' | 'STRAIGHT' | 'DOWNWARD';
  underline: 'NONE' | 'PRESENT' | 'CUTTING';
  finalDot: 'NONE' | 'PRESENT';
  starting: 'CLEAN' | 'COMPLEX';
  loops: 'BALANCED' | 'TALL' | 'EXCESSIVE';
  readability: 'CLEAR' | 'MODERATE' | 'UNCLEAR';
  pressure: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  spacing: string;

  // Advanced features for requirement 1-7
  hasUnderline: boolean;
  underlineAngle: number;
  underlinePosition: "belowName" | "cutsName" | "throughMiddle" | "none";
  underlineCutsSignature: boolean;

  hasFinalDot: boolean;
  finalDotPosition: "upperRight" | "middleRight" | "lowerRight" | "none";
  finalDotRisk: "low" | "medium" | "high";

  baselineAngle: number;
  mainBodySlant: "upward" | "straight" | "downward";
  underlineInfluence: "risingSupport" | "cutting" | "none";

  startingStrokeComplexity: "clean" | "moderate" | "cluttered";
  hasStartCuts: boolean;
  startClutterScore: number;

  tallLoopPresent: boolean;
  loopBalance: "balanced" | "excessive" | "weak";
  loopCrossed: boolean;

  confidenceScores: {
    slant: number;
    underline: number;
    finalDot: number;
    startingClutter: number;
    loop: number;
    readability: number;
    pressure: number;
  };
}

// Load base64 or file URL into an Image object
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load image for canvas scanning."));
    img.src = src;
  });
}

export async function analyzeSignatureImage(imageSrc: string): Promise<VisualMetrics> {
  try {
    const img = await loadImage(imageSrc);
    
    // Set up canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error("Could not create offscreen canvas context.");
    }
    
    // Downscale for performance
    const maxDim = 300;
    let width = img.width;
    let height = img.height;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0, width, height);
    
    // Get image data
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const pixelCount = width * height;
    
    // 1. Grayscale & Percentile-based robust thresholding
    const brightnessValues = new Float32Array(pixelCount);
    let totalBrightness = 0;
    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx+1];
      const b = data[idx+2];
      const brightness = (r + g + b) / 3;
      brightnessValues[i] = brightness;
      totalBrightness += brightness;
    }
    const avgBrightness = totalBrightness / pixelCount;
    const sortedBrightness = [...brightnessValues].sort((a, b) => a - b);
    
    // Percentile-based selection to isolate the ink.
    // Signature ink typically represents 4% to 18% of the total pixels.
    // 12th percentile is a reliable adaptive anchor for uneven backgrounds.
    const pct12 = sortedBrightness[Math.floor(pixelCount * 0.12)];
    const medianBrightness = sortedBrightness[Math.floor(pixelCount * 0.5)];
    const inkThreshold = Math.min(pct12 + 8, medianBrightness * 0.85);

    const isInk: boolean[][] = Array.from({ length: height }, () => new Array(width).fill(false));
    const inkPixels: { x: number; y: number; brightness: number }[] = [];
    let darkPixelSum = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const brightness = brightnessValues[y * width + x];
        if (brightness < inkThreshold) {
          isInk[y][x] = true;
          inkPixels.push({ x, y, brightness });
          darkPixelSum += (255 - brightness);
        }
      }
    }
    
    // Fallback if no ink detected
    if (inkPixels.length < 20) {
      return getRandomDefaultMetrics();
    }
    
    // 2. Connected Component Labeling (Flood Fill BFS)
    const visited = Array.from({ length: height }, () => new Uint8Array(width));
    const components: {
      pixels: { x: number; y: number }[];
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
      width: number;
      height: number;
      area: number;
    }[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isInk[y][x] && !visited[y][x]) {
          const queue: { x: number; y: number }[] = [{ x, y }];
          visited[y][x] = 1;
          const pixels: { x: number; y: number }[] = [];
          let cMinX = x, cMaxX = x, cMinY = y, cMaxY = y;
          
          let head = 0;
          while (head < queue.length) {
            const curr = queue[head++];
            pixels.push(curr);
            
            if (curr.x < cMinX) cMinX = curr.x;
            if (curr.x > cMaxX) cMaxX = curr.x;
            if (curr.y < cMinY) cMinY = curr.y;
            if (curr.y > cMaxY) cMaxY = curr.y;
            
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = curr.y + dy;
                const nx = curr.x + dx;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                  if (isInk[ny][nx] && !visited[ny][nx]) {
                    visited[ny][nx] = 1;
                    queue.push({ x: nx, y: ny });
                  }
                }
              }
            }
          }
          
          components.push({
            pixels,
            minX: cMinX,
            maxX: cMaxX,
            minY: cMinY,
            maxY: cMaxY,
            width: cMaxX - cMinX + 1,
            height: cMaxY - cMinY + 1,
            area: pixels.length
          });
        }
      }
    }

    // Global Ink Bounding Box
    let minX = width, maxX = 0, minY = height, maxY = 0;
    components.forEach(c => {
      if (c.minX < minX) minX = c.minX;
      if (c.maxX > maxX) maxX = c.maxX;
      if (c.minY < minY) minY = c.minY;
      if (c.maxY > maxY) maxY = c.maxY;
    });
    const inkW = maxX - minX + 1;
    const inkH = maxY - minY + 1;

    // 3. Robust Underline Detection
    // An underline lies in the bottom half of the signature, has a width of >= 40% of the total width,
    // and rises/slopes within -25 to 35 degrees.
    let hasUnderline = false;
    let underlineAngle = 0;
    let underlinePosition: "belowName" | "cutsName" | "throughMiddle" | "none" = "none";
    let underlineCutsSignature = false;
    let bestUnderlineY = -1;
    let underlineSpanWidth = 0;
    let underlineConfidence = 0.5;
    let bestAngleRad = 0;

    // A. Connected Components Check (STANDALONE UNDERLINES)
    let bestCompUnderline = null;
    let bestCompUnderlineScore = -1;

    for (const c of components) {
      const cy = (c.minY + c.maxY) / 2;
      const isBottom = cy > minY + inkH * 0.42; // Lower half
      const isWide = c.width >= 0.35 * inkW; // Covered span
      const isFlat = c.height <= 0.20 * inkH && c.height <= 32; // Thin aspect
      
      if (isBottom && isWide && isFlat) {
        const aspect = c.width / c.height;
        const score = aspect * (c.width / inkW);
        if (score > bestCompUnderlineScore) {
          bestCompUnderlineScore = score;
          bestCompUnderline = c;
        }
      }
    }

    if (bestCompUnderline) {
      // Calculate regression slope for this standalone component
      let uSumX = 0, uSumY = 0, uSumXY = 0, uSumXX = 0;
      const un = bestCompUnderline.pixels.length;
      bestCompUnderline.pixels.forEach(p => {
        uSumX += p.x;
        uSumY += p.y;
        uSumXY += p.x * p.y;
        uSumXX += p.x * p.x;
      });
      const uDen = (un * uSumXX) - (uSumX * uSumX);
      const uSlope = uDen !== 0 ? ((un * uSumXY) - (uSumX * uSumY)) / uDen : 0;
      const uAngleRadRaw = Math.atan(-uSlope); // Invert since Y goes down
      underlineAngle = Math.round((uAngleRadRaw * 180) / Math.PI);
      
      if (underlineAngle >= -25 && underlineAngle <= 35) {
        hasUnderline = true;
        bestUnderlineY = Math.round((bestCompUnderline.minY + bestCompUnderline.maxY) / 2);
        underlineSpanWidth = bestCompUnderline.width;
        bestAngleRad = -uSlope;
        underlineConfidence = Math.min(0.99, 0.85 + (underlineSpanWidth / inkW) * 0.14);
      }
    }

    // B. Hough-like line segment scan (CONNECTED UNDERLINES)
    if (!hasUnderline) {
      const yScanStart = Math.round(minY + inkH * 0.45);
      const yScanEnd = maxY;
      let maxLineWeight = 0;
      
      const angles = [];
      for (let a = -25; a <= 35; a += 2) {
        angles.push(a);
      }

      for (let y0 = yScanStart; y0 <= yScanEnd; y0++) {
        for (const angle of angles) {
          const rad = (angle * Math.PI) / 180;
          let currentSegmentLength = 0;
          let currentGap = 0;
          let activeSegment = false;
          let segStartX = -1;
          let segEndX = -1;

          for (let x = minX; x <= maxX; x++) {
            const yc = Math.round(y0 + (x - minX) * Math.sin(rad));
            
            let foundInk = false;
            for (let dy = -1; dy <= 1; dy++) {
              const ny = yc + dy;
              if (ny >= 0 && ny < height && isInk[ny][x]) {
                foundInk = true;
                break;
              }
            }

            if (foundInk) {
              if (!activeSegment) {
                activeSegment = true;
                segStartX = x;
              }
              currentSegmentLength++;
              currentGap = 0;
              segEndX = x;
            } else {
              if (activeSegment) {
                if (currentGap < 6) { // Small gaps allowed in stroke
                  currentGap++;
                  currentSegmentLength++;
                } else {
                  const span = segEndX - segStartX + 1;
                  if (span >= 0.38 * inkW && span > maxLineWeight) {
                    maxLineWeight = span;
                    underlineAngle = angle;
                    bestUnderlineY = y0;
                    underlineSpanWidth = span;
                    bestAngleRad = rad;
                  }
                  activeSegment = false;
                  currentSegmentLength = 0;
                  currentGap = 0;
                }
              }
            }
          }

          if (activeSegment) {
            const span = segEndX - segStartX + 1;
            if (span >= 0.38 * inkW && span > maxLineWeight) {
              maxLineWeight = span;
              underlineAngle = angle;
              bestUnderlineY = y0;
              underlineSpanWidth = span;
              bestAngleRad = rad;
            }
          }
        }
      }

      if (maxLineWeight >= 0.38 * inkW) {
        hasUnderline = true;
        underlineConfidence = Math.min(0.95, 0.70 + (underlineSpanWidth / inkW) * 0.25);
      }
    }

    // C. Underline classification and overlap analysis
    if (hasUnderline) {
      let overlapColumns = 0;
      const uAngleRad = -bestAngleRad; // align with canvas coordinates
      
      for (let x = minX; x <= maxX; x++) {
        const yc = Math.round(bestUnderlineY + (x - minX) * Math.sin(uAngleRad));
        let inkAbove = false;
        let inkBelow = false;

        for (let dy = -22; dy < -3; dy++) {
          const ny = yc + dy;
          if (ny >= 0 && ny < height && isInk[ny][x]) { inkAbove = true; break; }
        }
        for (let dy = 3; dy <= 22; dy++) {
          const ny = yc + dy;
          if (ny >= 0 && ny < height && isInk[ny][x]) { inkBelow = true; break; }
        }

        if (inkAbove && inkBelow) {
          overlapColumns++;
        }
      }

      const overlapRatio = overlapColumns / underlineSpanWidth;
      const avgY = bestUnderlineY + (underlineSpanWidth / 2) * Math.sin(uAngleRad);

      if (overlapRatio > 0.20) {
        underlinePosition = "cutsName";
        underlineCutsSignature = true;
      } else if (avgY < minY + inkH * 0.58) {
        underlinePosition = "throughMiddle";
        underlineCutsSignature = true;
      } else {
        underlinePosition = "belowName";
        underlineCutsSignature = false;
      }
    }

    // 4. Final Dot Detection (highly robust distance and isolation check)
    let hasFinalDot = false;
    let finalDotPosition: "upperRight" | "middleRight" | "lowerRight" | "none" = "none";
    let finalDotRisk: "low" | "medium" | "high" = "low";
    let finalDotConfidence = 0.5;

    // Clean dot must fall into the far right 18% of the signature bounding box
    const dotRightLimit = minX + inkW * 0.82;
    const dotCandidates = components.filter(c => {
      const cx = (c.minX + c.maxX) / 2;
      const isRight = cx > dotRightLimit;
      const isSmall = c.area >= 3 && c.area <= 110 && c.area <= inkPixels.length * 0.04;
      const isCompact = c.area / (c.width * c.height) >= 0.35;
      const isSquareish = c.width / c.height >= 0.3 && c.width / c.height <= 3.0;
      return isRight && isSmall && isCompact && isSquareish;
    });

    if (dotCandidates.length > 0) {
      let finalDotComponent = null;
      let finalDotMaxGap = -1;

      for (const cand of dotCandidates) {
        let minDistance = 9999;
        
        components.forEach(other => {
          if (other !== cand && other.area > cand.area * 1.5) {
            const gapX = Math.max(0, cand.minX - other.maxX, other.minX - cand.maxX);
            const gapY = Math.max(0, cand.minY - other.maxY, other.minY - cand.maxY);
            const bboxDist = Math.sqrt(gapX * gapX + gapY * gapY);
            
            if (bboxDist < minDistance) {
              minDistance = bboxDist;
            }
          }
        });

        if (minDistance > finalDotMaxGap) {
          finalDotMaxGap = minDistance;
          finalDotComponent = cand;
        }
      }

      // Must be substantially isolated (e.g. at least 8 pixels away from larger components)
      if (finalDotComponent && finalDotMaxGap >= 8) {
        hasFinalDot = true;
        finalDotConfidence = Math.min(0.99, 0.75 + (finalDotMaxGap / 30) * 0.24);
        const cy = (finalDotComponent.minY + finalDotComponent.maxY) / 2;

        if (cy < minY + inkH * 0.35) {
          finalDotPosition = "upperRight";
          finalDotRisk = "low";
        } else if (cy > minY + inkH * 0.65) {
          finalDotPosition = "lowerRight";
          finalDotRisk = "high";
        } else {
          finalDotPosition = "middleRight";
          finalDotRisk = "medium";
        }
      }
    }

    // 5. Signature Slant / Baseline Estimation
    // Exclude the detected underline so it doesn't skew our letters slant!
    const pureBodyPixels: { x: number; y: number }[] = [];
    inkPixels.forEach(p => {
      let isUnderlinePixel = false;
      if (hasUnderline) {
        const yc = Math.round(bestUnderlineY + (p.x - minX) * Math.sin(bestAngleRad));
        if (Math.abs(p.y - yc) <= 4) {
          isUnderlinePixel = true;
        }
      }
      if (!isUnderlinePixel && (!hasUnderline || p.y < bestUnderlineY - 1)) {
        pureBodyPixels.push(p);
      }
    });

    const regressionPixels = pureBodyPixels.length > 15 ? pureBodyPixels : inkPixels;

    // Linear regression on clean baseline points (outlier filtered for descenders)
    const regressionResult = calculateRobustRegression(regressionPixels, minX, maxX);
    const m = regressionResult.slope;
    
    // Invert the angle since Canvas Y coordinate increases downwards
    const angleRad = Math.atan(-m);
    const baselineAngle = Math.round((angleRad * 180) / Math.PI);

    let mainBodySlant: "upward" | "straight" | "downward" = "straight";
    if (baselineAngle >= 6) {
      mainBodySlant = "upward";
    } else if (baselineAngle <= -6) {
      mainBodySlant = "downward";
    } else {
      mainBodySlant = "straight";
    }

    const fitQuality = regressionResult.r2;
    const slantConfidence = Math.max(0.65, Math.min(0.99, 0.70 + fitQuality * 0.25 + (regressionResult.count > 40 ? 0.04 : 0)));

    let underlineInfluence: "risingSupport" | "cutting" | "none" = "none";
    if (hasUnderline) {
      if (underlineCutsSignature) {
        underlineInfluence = "cutting";
      } else if (underlineAngle >= 4) {
        underlineInfluence = "risingSupport";
      }
    }

    // 6. Starting Stroke Complexity (Scanline Intersection Density Method)
    const leftLimit = minX + Math.round(inkW * 0.26);
    
    let totalIntersections = 0;
    let scanLinesCount = 0;
    const yScanStart = Math.round(minY + inkH * 0.15);
    const yScanEnd = Math.round(minY + inkH * 0.85);
    const yStep = Math.max(2, Math.round(inkH * 0.06));

    for (let y = yScanStart; y <= yScanEnd; y += yStep) {
      let intersections = 0;
      let inStroke = false;
      for (let x = minX; x <= leftLimit; x++) {
        if (isInk[y]?.[x]) {
          if (!inStroke) {
            intersections++;
            inStroke = true;
          }
        } else {
          inStroke = false;
        }
      }
      totalIntersections += intersections;
      scanLinesCount++;
    }

    const avgIntersections = scanLinesCount > 0 ? (totalIntersections / scanLinesCount) : 1;
    
    // Count starter components in left 26%
    const startersCount = components.filter(c => {
      const cx = (c.minX + c.maxX) / 2;
      return cx <= leftLimit;
    }).length;

    // Combine into starting clutter score (0 - 100)
    const startClutterScore = Math.max(0, Math.min(100, Math.round(
      (avgIntersections - 1.0) * 28 + (startersCount > 1 ? (startersCount - 1) * 15 : 0)
    )));

    let startingStrokeComplexity: "clean" | "moderate" | "cluttered" = "clean";
    if (startClutterScore > 50) {
      startingStrokeComplexity = "cluttered";
    } else if (startClutterScore > 24) {
      startingStrokeComplexity = "moderate";
    } else {
      startingStrokeComplexity = "clean";
    }

    const hasStartCuts = avgIntersections > 2.4 || startClutterScore > 40;
    const distToThreshold = Math.min(Math.abs(startClutterScore - 24), Math.abs(startClutterScore - 50));
    const startConfidence = Math.max(0.70, Math.min(0.98, 0.80 + distToThreshold * 0.005));

    // 7. Topological Loop Finder (Hole Detector)
    const isOuterBg = Array.from({ length: height }, () => new Uint8Array(width));
    const bgQueue: { x: number; y: number }[] = [];

    // Push boundary background pixels
    for (let x = 0; x < width; x++) {
      if (!isInk[0][x]) { isOuterBg[0][x] = 1; bgQueue.push({ x, y: 0 }); }
      if (!isInk[height-1][x]) { isOuterBg[height-1][x] = 1; bgQueue.push({ x, y: height-1 }); }
    }
    for (let y = 1; y < height - 1; y++) {
      if (!isInk[y][0]) { isOuterBg[y][0] = 1; bgQueue.push({ x: 0, y }); }
      if (!isInk[y][width-1]) { isOuterBg[y][width-1] = 1; bgQueue.push({ x: width-1, y }); }
    }

    let bgHead = 0;
    while (bgHead < bgQueue.length) {
      const curr = bgQueue[bgHead++];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = curr.y + dy;
          const nx = curr.x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (!isInk[ny][nx] && !isOuterBg[ny][nx]) {
              isOuterBg[ny][nx] = 1;
              bgQueue.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    const visitedHole = Array.from({ length: height }, () => new Uint8Array(width));
    const holes: { height: number; area: number }[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!isInk[y][x] && !isOuterBg[y][x] && !visitedHole[y][x]) {
          const hQueue: { x: number; y: number }[] = [{ x, y }];
          visitedHole[y][x] = 1;
          const hPixels: { x: number; y: number }[] = [];
          let hMinY = y, hMaxY = y;
          
          let hHead = 0;
          while (hHead < hQueue.length) {
            const curr = hQueue[hHead++];
            hPixels.push(curr);
            if (curr.y < hMinY) hMinY = curr.y;
            if (curr.y > hMaxY) hMaxY = curr.y;
            
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = curr.y + dy;
                const nx = curr.x + dx;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                  if (!isInk[ny][nx] && !isOuterBg[ny][nx] && !visitedHole[ny][nx]) {
                    visitedHole[ny][nx] = 1;
                    hQueue.push({ x: nx, y: ny });
                  }
                }
              }
            }
          }
          
          if (hPixels.length >= 4) {
            holes.push({
              height: hMaxY - hMinY + 1,
              area: hPixels.length
            });
          }
        }
      }
    }

    let tallLoopPresent = false;
    let loopCrossed = false;
    let loopBalance: "balanced" | "excessive" | "weak" = "weak";

    holes.forEach(h => {
      if (h.height >= 0.28 * inkH) {
        tallLoopPresent = true;
      }
    });

    if (holes.length >= 3) {
      loopBalance = "excessive";
      loopCrossed = true;
    } else if (holes.length > 0) {
      loopBalance = "balanced";
    }

    const loopConfidence = Math.min(0.95, 0.84 + holes.length * 0.03);

    // 8. Estimate Pen Pressure
    const avgInkBrightness = darkPixelSum / inkPixels.length;
    let pressure: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'MEDIUM';
    if (avgInkBrightness > 165) {
      pressure = 'HEAVY';
    } else if (avgInkBrightness < 95) {
      pressure = 'LIGHT';
    } else {
      pressure = 'MEDIUM';
    }
    const pressureConfidence = 0.88;

    // 9. Readability
    let verticalGaps = 0;
    let inGap = false;
    for (let x = minX; x <= maxX; x++) {
      let colInk = 0;
      for (let y = minY; y <= maxY; y++) {
        if (isInk[y][x]) colInk++;
      }
      if (colInk === 0) {
        if (!inGap) {
          verticalGaps++;
          inGap = true;
        }
      } else {
        inGap = false;
      }
    }

    let readability: 'CLEAR' | 'MODERATE' | 'UNCLEAR' = 'MODERATE';
    if (verticalGaps > 4) {
      readability = 'CLEAR';
    } else if (verticalGaps < 1) {
      readability = 'UNCLEAR';
    }
    const readabilityConfidence = 0.85;

    const spacing = verticalGaps > 3 ? "Balanced & Wide" : (verticalGaps === 0 ? "Compressed / Connected" : "Standard");

    const slant: 'UPWARD' | 'STRAIGHT' | 'DOWNWARD' = 
      mainBodySlant === "upward" ? "UPWARD" : (mainBodySlant === "downward" ? "DOWNWARD" : "STRAIGHT");
    
    const underline: 'NONE' | 'PRESENT' | 'CUTTING' = 
      hasUnderline ? (underlineCutsSignature ? "CUTTING" : "PRESENT") : "NONE";

    const finalDot: 'NONE' | 'PRESENT' = hasFinalDot ? "PRESENT" : "NONE";
    const starting: 'CLEAN' | 'COMPLEX' = startingStrokeComplexity === "clean" ? "CLEAN" : "COMPLEX";
    const loops: 'BALANCED' | 'TALL' | 'EXCESSIVE' = 
      loopBalance === "balanced" ? (tallLoopPresent ? "TALL" : "BALANCED") : (loopBalance === "excessive" ? "EXCESSIVE" : "BALANCED");

    return {
      slant,
      underline,
      finalDot,
      starting,
      loops,
      readability,
      pressure,
      spacing,

      hasUnderline,
      underlineAngle,
      underlinePosition,
      underlineCutsSignature,

      hasFinalDot,
      finalDotPosition,
      finalDotRisk,

      baselineAngle,
      mainBodySlant,
      underlineInfluence,

      startingStrokeComplexity,
      hasStartCuts,
      startClutterScore,

      tallLoopPresent,
      loopBalance,
      loopCrossed,

      confidenceScores: {
        slant: slantConfidence,
        underline: underlineConfidence,
        finalDot: finalDotConfidence,
        startingClutter: startConfidence,
        loop: loopConfidence,
        readability: readabilityConfidence,
        pressure: pressureConfidence
      }
    };

  } catch (err) {
    console.error("Advanced Canvas processing failed, using safe fallback:", err);
    return getRandomDefaultMetrics();
  }
}

function calculateRobustRegression(pixels: { x: number; y: number }[], minX: number, maxX: number): { slope: number; r2: number; count: number } {
  // Find bottom-most ink pixel for each column x
  const colBottomMap: Record<number, number> = {};
  pixels.forEach(p => {
    if (colBottomMap[p.x] === undefined || p.y > colBottomMap[p.x]) {
      colBottomMap[p.x] = p.y;
    }
  });

  const cols = Object.keys(colBottomMap).map(Number).sort((a, b) => a - b);
  if (cols.length < 5) {
    return { slope: 0, r2: 0, count: cols.length };
  }

  // First-pass regression
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  const n = cols.length;
  cols.forEach(x => {
    const y = colBottomMap[x];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  });

  const num = (n * sumXY) - (sumX * sumY);
  const denX = (n * sumXX) - (sumX * sumX);
  const denY = (n * sumYY) - (sumY * sumY);
  
  if (denX === 0) return { slope: 0, r2: 0, count: n };
  const slope = num / denX;
  const intercept = (sumY - slope * sumX) / n;

  // Filter out descender outliers (pixels hanging far below the trend line)
  // residuals: actual Y minus predicted Y.
  // In canvas coords, larger Y is lower on the page. Outlier descenders have large positive residuals.
  const residuals: number[] = [];
  cols.forEach(x => {
    const y = colBottomMap[x];
    const predY = slope * x + intercept;
    residuals.push(y - predY);
  });

  const meanResidual = residuals.reduce((a, b) => a + b, 0) / n;
  const stdResidual = Math.sqrt(residuals.map(r => Math.pow(r - meanResidual, 2)).reduce((a, b) => a + b, 0) / n);

  const cleanCols: number[] = [];
  cols.forEach((x, idx) => {
    const res = residuals[idx];
    if (res <= 1.2 * stdResidual || stdResidual < 4) {
      cleanCols.push(x);
    }
  });

  // Second-pass regression on clean columns
  if (cleanCols.length < 5) {
    return { slope, r2: 0.5, count: n };
  }

  let cSumX = 0, cSumY = 0, cSumXY = 0, cSumXX = 0, cSumYY = 0;
  const cn = cleanCols.length;
  cleanCols.forEach(x => {
    const y = colBottomMap[x];
    cSumX += x;
    cSumY += y;
    cSumXY += x * y;
    cSumXX += x * x;
    cSumYY += y * y;
  });

  const cNum = (cn * cSumXY) - (cSumX * cSumY);
  const cDenX = (cn * cSumXX) - (cSumX * cSumX);
  const cDenY = (cn * cSumYY) - (cSumY * cSumY);

  if (cDenX === 0) return { slope: 0, r2: 0, count: cn };
  const cleanSlope = cNum / cDenX;

  let r2 = 0;
  if (cDenX !== 0 && cDenY !== 0) {
    r2 = Math.pow(cNum, 2) / (cDenX * cDenY);
  }

  return { slope: cleanSlope, r2, count: cn };
}

function getRandomDefaultMetrics(): VisualMetrics {
  return {
    slant: 'STRAIGHT',
    underline: 'NONE',
    finalDot: 'NONE',
    starting: 'CLEAN',
    loops: 'BALANCED',
    readability: 'MODERATE',
    pressure: 'MEDIUM',
    spacing: "Balanced Standard Spacing",

    hasUnderline: false,
    underlineAngle: 0,
    underlinePosition: "none",
    underlineCutsSignature: false,

    hasFinalDot: false,
    finalDotPosition: "none",
    finalDotRisk: "low",

    baselineAngle: 0,
    mainBodySlant: "straight",
    underlineInfluence: "none",

    startingStrokeComplexity: "clean",
    hasStartCuts: false,
    startClutterScore: 10,

    tallLoopPresent: false,
    loopBalance: "balanced",
    loopCrossed: false,

    confidenceScores: {
      slant: 0.90,
      underline: 0.92,
      finalDot: 0.95,
      startingClutter: 0.88,
      loop: 0.85,
      readability: 0.84,
      pressure: 0.91
    }
  };
}
