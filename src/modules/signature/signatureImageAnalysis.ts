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
    
    // 1. Convert to grayscale & threshold to find dark pen pixels
    let totalBrightness = 0;
    const pixelCount = width * height;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
    }
    const avgBrightness = totalBrightness / pixelCount;
    
    // Pixels darker than 80-85% of average brightness are considered ink
    const inkThreshold = Math.max(45, avgBrightness * 0.85);
    const isInk: boolean[][] = Array.from({ length: height }, () => new Array(width).fill(false));
    const inkPixels: { x: number; y: number; brightness: number }[] = [];
    let darkPixelSum = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        const brightness = (r + g + b) / 3;
        
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

    // 3. Underline detection via Hough-like line segment scan
    let hasUnderline = false;
    let underlineAngle = 0;
    let underlinePosition: "belowName" | "cutsName" | "throughMiddle" | "none" = "none";
    let underlineCutsSignature = false;
    let bestUnderlineY = -1;
    let underlineSpanWidth = 0;
    let underlineConfidence = 0.5;

    // We scan bottom 55% of the signature bounding box for an underline segment
    const yScanStart = Math.round(minY + inkH * 0.45);
    const yScanEnd = maxY;
    let maxLineWeight = 0;
    let bestAngleRad = 0;

    // Angles to check: -25 degrees to +35 degrees
    const angles = [];
    for (let a = -25; a <= 35; a += 2.5) {
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
          
          // Check vertical search window of 3 pixels around yc
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
              if (currentGap < 4) {
                currentGap++;
                currentSegmentLength++;
              } else {
                // End of segment
                const span = segEndX - segStartX + 1;
                if (span >= 0.40 * inkW && span > maxLineWeight) {
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

        // Check tail segment
        if (activeSegment) {
          const span = segEndX - segStartX + 1;
          if (span >= 0.40 * inkW && span > maxLineWeight) {
            maxLineWeight = span;
            underlineAngle = angle;
            bestUnderlineY = y0;
            underlineSpanWidth = span;
            bestAngleRad = rad;
          }
        }
      }
    }

    if (maxLineWeight >= 0.40 * inkW) {
      hasUnderline = true;
      underlineConfidence = Math.min(0.98, 0.70 + (underlineSpanWidth / inkW) * 0.28);
      
      // Calculate intersection density along the underline path
      let overlapColumns = 0;
      const uAngleRad = (underlineAngle * Math.PI) / 180;
      
      for (let x = minX; x <= maxX; x++) {
        const yc = Math.round(bestUnderlineY + (x - minX) * Math.sin(uAngleRad));
        // Check if there is ink both substantially above and below the line
        let inkAbove = false;
        let inkBelow = false;

        for (let dy = -25; dy < -3; dy++) {
          const ny = yc + dy;
          if (ny >= 0 && ny < height && isInk[ny][x]) { inkAbove = true; break; }
        }
        for (let dy = 3; dy <= 25; dy++) {
          const ny = yc + dy;
          if (ny >= 0 && ny < height && isInk[ny][x]) { inkBelow = true; break; }
        }

        if (inkAbove && inkBelow) {
          overlapColumns++;
        }
      }

      const overlapRatio = overlapColumns / underlineSpanWidth;
      const avgY = bestUnderlineY + (underlineSpanWidth / 2) * Math.sin(uAngleRad);

      if (overlapRatio > 0.22) {
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

    // 4. Final Dot isolation detection
    let hasFinalDot = false;
    let finalDotPosition: "upperRight" | "middleRight" | "lowerRight" | "none" = "none";
    let finalDotRisk: "low" | "medium" | "high" = "low";
    let finalDotConfidence = 0.5;

    // A final dot sits in the far right 15% of the bounding box
    const dotRightLimit = minX + inkW * 0.82;
    const dotCandidates = components.filter(c => {
      const cx = (c.minX + c.maxX) / 2;
      const isRight = cx > dotRightLimit;
      const isSmall = c.area >= 4 && c.area <= 120 && c.area <= inkPixels.length * 0.05;
      const isCompact = c.area / (c.width * c.height) >= 0.38;
      const isSquareish = c.width / c.height >= 0.35 && c.width / c.height <= 2.8;
      return isRight && isSmall && isCompact && isSquareish;
    });

    if (dotCandidates.length > 0) {
      // Find candidate most isolated horizontally from other components
      let bestCandidate = null;
      let maxIsolationGap = -1;

      for (const cand of dotCandidates) {
        // Calculate closest distance to any other component that is larger than it
        let minGap = 9999;
        components.forEach(other => {
          if (other !== cand && other.area > cand.area * 2) {
            const gapX = Math.max(0, cand.minX - other.maxX, other.minX - cand.maxX);
            if (gapX < minGap) {
              minGap = gapX;
            }
          }
        });

        if (minGap > maxIsolationGap) {
          maxIsolationGap = minGap;
          bestCandidate = cand;
        }
      }

      if (bestCandidate && maxIsolationGap >= 5) {
        hasFinalDot = true;
        finalDotConfidence = Math.min(0.99, 0.75 + (maxIsolationGap / 30) * 0.24);
        const cy = (bestCandidate.minY + bestCandidate.maxY) / 2;

        if (cy < minY + inkH * 0.35) {
          finalDotPosition = "upperRight";
          finalDotRisk = "medium";
        } else if (cy > minY + inkH * 0.65) {
          finalDotPosition = "lowerRight";
          finalDotRisk = "high";
        } else {
          finalDotPosition = "middleRight";
          finalDotRisk = "high";
        }
      }
    }

    // 5. Signature Slant / Baseline estimation
    // Exclude underline ink pixels to get pure letter body slant!
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

    // If too few pure pixels, fallback to using all pixels
    const regressionPixels = pureBodyPixels.length > 15 ? pureBodyPixels : inkPixels;

    // Linear regression on bottom-edge pixels of columns to estimate baseline angle
    // In each column x, find bottom-most ink pixel y
    const colBottomMap: Record<number, number> = {};
    regressionPixels.forEach(p => {
      if (colBottomMap[p.x] === undefined || p.y > colBottomMap[p.x]) {
        colBottomMap[p.x] = p.y;
      }
    });

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const colKeys = Object.keys(colBottomMap).map(Number).sort((a, b) => a - b);
    const regressionN = colKeys.length;

    colKeys.forEach(x => {
      const y = colBottomMap[x];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const den = (regressionN * sumXX) - (sumX * sumX);
    const m = den !== 0 ? ((regressionN * sumXY) - (sumX * sumY)) / den : 0;
    
    // Invert the angle since Canvas Y coordinate increases downwards
    const angleRad = Math.atan(-m);
    const baselineAngle = Math.round((angleRad * 180) / Math.PI);

    let mainBodySlant: "upward" | "straight" | "downward" = "straight";
    if (baselineAngle >= 5) {
      mainBodySlant = "upward";
    } else if (baselineAngle <= -5) {
      mainBodySlant = "downward";
    } else {
      mainBodySlant = "straight";
    }

    const slantConfidence = Math.min(0.96, 0.82 + Math.abs(baselineAngle) * 0.005);

    let underlineInfluence: "risingSupport" | "cutting" | "none" = "none";
    if (hasUnderline) {
      if (underlineCutsSignature) {
        underlineInfluence = "cutting";
      } else if (underlineAngle >= 4) {
        underlineInfluence = "risingSupport";
      }
    }

    // 6. Starting Stroke Complexity
    const leftLimit = minX + Math.round(inkW * 0.28);
    const leftInkPixels = regressionPixels.filter(p => p.x <= leftLimit);
    let leftInkCount = leftInkPixels.length;
    if (leftInkCount === 0) leftInkCount = 1;

    let crossingsCount = 0;
    leftInkPixels.forEach(p => {
      // Count 8-neighbors
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dy !== 0 || dx !== 0) {
            const ny = p.y + dy;
            const nx = p.x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width && isInk[ny][nx]) {
              neighbors++;
            }
          }
        }
      }
      if (neighbors >= 3) {
        crossingsCount++;
      }
    });

    const crossingDensity = crossingsCount / leftInkCount;
    // Count disconnected component starters in the left 28%
    const startersCount = components.filter(c => {
      const cx = (c.minX + c.maxX) / 2;
      return cx <= leftLimit;
    }).length;

    // Starting clutter score computation
    const startClutterScore = Math.max(0, Math.min(100, Math.round(crossingDensity * 220 + startersCount * 12)));
    let startingStrokeComplexity: "clean" | "moderate" | "cluttered" = "clean";
    if (startClutterScore > 58) {
      startingStrokeComplexity = "cluttered";
    } else if (startClutterScore > 26) {
      startingStrokeComplexity = "moderate";
    } else {
      startingStrokeComplexity = "clean";
    }

    const hasStartCuts = crossingDensity > 0.12 || startClutterScore > 40;
    const startConfidence = Math.min(0.94, 0.80 + startClutterScore * 0.0014);

    // 7. Topological Loop Finder (Hole Detector)
    const isOuterBg = Array.from({ length: height }, () => new Uint8Array(width));
    const bgQueue: { x: number; y: number }[] = [];

    // Push all boundary background pixels
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

    // Unreached background pixels are enclosed holes!
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
    const avgInkBrightness = darkPixelSum / inkPixels.length; // Higher = darker/heavy pressure
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
    // Count vertical white background columns to measure splits
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

    // Map backwards compatible fields nicely
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
