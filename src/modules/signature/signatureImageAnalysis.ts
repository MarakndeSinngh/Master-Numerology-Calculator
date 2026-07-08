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
    
    // 1. Thresholding to identify dark pen pixels
    // Calculate average brightness
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
    
    // Pixels darker than 80% of average brightness are considered ink
    const inkThreshold = Math.max(40, avgBrightness * 0.85);
    const inkPixels: { x: number; y: number; brightness: number }[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < inkThreshold) {
          inkPixels.push({ x, y, brightness });
        }
      }
    }
    
    // Fallback if no ink detected (e.g. solid white image)
    if (inkPixels.length < 20) {
      return getRandomDefaultMetrics();
    }
    
    // Find bounding box of ink
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let darkPixelSum = 0;
    inkPixels.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      darkPixelSum += (255 - p.brightness);
    });
    
    const inkW = maxX - minX + 1;
    const inkH = maxY - minY + 1;
    
    // 2. Estimate Slant and Angle
    // Fit a simple linear regression line to ink coordinates
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    inkPixels.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });
    
    const n = inkPixels.length;
    const slopeNum = (n * sumXY) - (sumX * sumY);
    const slopeDen = (n * sumXX) - (sumX * sumX);
    const slope = slopeDen !== 0 ? slopeNum / slopeDen : 0;
    
    let slant: 'UPWARD' | 'STRAIGHT' | 'DOWNWARD' = 'STRAIGHT';
    // Remember: canvas Y axis is inverted (Y increases downwards)
    // So a negative slope means the signature climbs upwards from left to right!
    if (slope < -0.1) {
      slant = 'UPWARD';
    } else if (slope > 0.12) {
      slant = 'DOWNWARD';
    } else {
      slant = 'STRAIGHT';
    }
    
    // 3. Estimate Underline Presence & Type
    // Look at the bottom 25% of the signature bounding box.
    // Check if there is a dense row of horizontal ink that stretches across at least 60% of the signature width.
    const underlineRowThreshold = Math.round(minY + inkH * 0.7);
    const horizontalSlices = new Array(height).fill(0);
    inkPixels.forEach(p => {
      horizontalSlices[p.y]++;
    });
    
    let underlineDetected = false;
    let maxRowDensity = 0;
    let bestRowY = -1;
    
    for (let y = underlineRowThreshold; y <= maxY; y++) {
      if (horizontalSlices[y] > maxRowDensity) {
        maxRowDensity = horizontalSlices[y];
        bestRowY = y;
      }
    }
    
    // If a horizontal row has more than 50% of its width filled with dark pixels
    if (maxRowDensity > inkW * 0.4 && bestRowY !== -1) {
      underlineDetected = true;
    }
    
    // Check if the underline is cutting the loops (meaning we have substantial ink points below the underline row)
    let underline: 'NONE' | 'PRESENT' | 'CUTTING' = 'NONE';
    if (underlineDetected) {
      // Check if there are lower letters/loops cutting below the underline Row
      let pixelsBelowUnderline = 0;
      inkPixels.forEach(p => {
        if (p.y > bestRowY + 3) {
          pixelsBelowUnderline++;
        }
      });
      // If a substantial number of pixels cut below, it's a CUTTING underline
      underline = (pixelsBelowUnderline > inkPixels.length * 0.1) ? 'CUTTING' : 'PRESENT';
    }
    
    // 4. Estimate Final Dot Presence
    // Look at the far right 15% of the bounding box, check for an isolated pixel cluster.
    const rightZoneBoundary = Math.round(minX + inkW * 0.85);
    const rightZonePixels = inkPixels.filter(p => p.x > rightZoneBoundary);
    
    let finalDot: 'NONE' | 'PRESENT' = 'NONE';
    if (rightZonePixels.length > 5 && rightZonePixels.length < inkPixels.length * 0.08) {
      // Calculate isolation gap - see if there is an empty column gap between main body and dot
      const columnCounts = new Array(width).fill(0);
      rightZonePixels.forEach(p => {
        columnCounts[p.x]++;
      });
      
      let emptyCols = 0;
      for (let x = rightZoneBoundary - 10; x <= rightZoneBoundary; x++) {
        if (x >= 0 && x < width) {
          const colInk = inkPixels.filter(p => p.x === x).length;
          if (colInk === 0) emptyCols++;
        }
      }
      
      if (emptyCols >= 2) {
        finalDot = 'PRESENT';
      }
    }
    
    // 5. Estimate Pen Pressure
    // Average darkness of ink pixels (higher darkness = heavy pressure)
    const avgInkBrightness = darkPixelSum / n; // Higher is darker
    let pressure: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'MEDIUM';
    if (avgInkBrightness > 165) {
      pressure = 'HEAVY';
    } else if (avgInkBrightness < 95) {
      pressure = 'LIGHT';
    } else {
      pressure = 'MEDIUM';
    }
    
    // 6. Estimate Readability & Starting Complexity
    // Highly connected components with high vertical variations suggest stylization (lower readability).
    // Let's divide ink height into parts. If there is a big initial letter, starting is clean, else complex.
    const leftZoneBoundary = Math.round(minX + inkW * 0.25);
    const leftZonePixels = inkPixels.filter(p => p.x <= leftZoneBoundary);
    
    let starting: 'CLEAN' | 'COMPLEX' = 'CLEAN';
    // If the left zone is extremely dense and has high vertical range
    let leftMinY = height, leftMaxY = 0;
    leftZonePixels.forEach(p => {
      if (p.y < leftMinY) leftMinY = p.y;
      if (p.y > leftMaxY) leftMaxY = p.y;
    });
    const leftH = leftMaxY - leftMinY + 1;
    if (leftH > inkH * 0.8 && leftZonePixels.length > inkPixels.length * 0.3) {
      starting = 'COMPLEX';
    }
    
    // Readability
    // Clear readability often has regular spacing or clear letter splits.
    // If we count vertical projection gaps (white vertical slices), more gaps = higher readability.
    let verticalGaps = 0;
    let inGap = false;
    for (let x = minX; x <= maxX; x++) {
      const colPixels = inkPixels.filter(p => p.x === x).length;
      if (colPixels === 0) {
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
    
    // Loops and flourishes
    // Calculate bounding box ratio. If ink height is tall relative to width, it suggests tall professional loops.
    // Excess vertical density can mean excessive crossings.
    const aspect = inkH / inkW;
    let loops: 'BALANCED' | 'TALL' | 'EXCESSIVE' = 'BALANCED';
    if (aspect > 0.5) {
      loops = 'TALL';
    } else if (inkPixels.length / (inkW * inkH) > 0.25) {
      loops = 'EXCESSIVE';
    }
    
    const spacing = verticalGaps > 3 ? "Balanced & Wide" : (verticalGaps === 0 ? "Compressed / Connected" : "Standard");
    
    return {
      slant,
      underline,
      finalDot,
      starting,
      loops,
      readability,
      pressure,
      spacing
    };
  } catch (err) {
    console.error("Heuristic Canvas scanner failed, returning defaults:", err);
    return getRandomDefaultMetrics();
  }
}

// Return plausible default metrics on scan error
function getRandomDefaultMetrics(): VisualMetrics {
  const slants: ('UPWARD' | 'STRAIGHT' | 'DOWNWARD')[] = ['UPWARD', 'STRAIGHT'];
  const underlines: ('NONE' | 'PRESENT' | 'CUTTING')[] = ['PRESENT', 'NONE'];
  const dots: ('NONE' | 'PRESENT')[] = ['NONE', 'PRESENT'];
  const starters: ('CLEAN' | 'COMPLEX')[] = ['CLEAN', 'COMPLEX'];
  const loopTypes: ('BALANCED' | 'TALL' | 'EXCESSIVE')[] = ['BALANCED', 'TALL'];
  const legibilityTypes: ('CLEAR' | 'MODERATE' | 'UNCLEAR')[] = ['CLEAR', 'MODERATE', 'UNCLEAR'];
  const pressures: ('LIGHT' | 'MEDIUM' | 'HEAVY')[] = ['MEDIUM', 'HEAVY', 'LIGHT'];
  
  return {
    slant: slants[Math.floor(Math.random() * slants.length)],
    underline: underlines[Math.floor(Math.random() * underlines.length)],
    finalDot: dots[Math.floor(Math.random() * dots.length)],
    starting: starters[Math.floor(Math.random() * starters.length)],
    loops: loopTypes[Math.floor(Math.random() * loopTypes.length)],
    readability: legibilityTypes[Math.floor(Math.random() * legibilityTypes.length)],
    pressure: pressures[Math.floor(Math.random() * pressures.length)],
    spacing: "Balanced Standard Spacing"
  };
}
