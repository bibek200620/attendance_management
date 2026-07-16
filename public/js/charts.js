window.Charts = {

  line(containerId, data, options = {}) {
    const { showGrid = true, showDots = true, showArea = true, animated = true } = options;
    const { canvas, ctx, width, height } = this._createCanvas(containerId);
    if (!canvas) return;

    const padding = { top: 40, right: 30, bottom: 50, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Compute max value
    let maxVal = 0;
    data.datasets.forEach(ds => {
      ds.data.forEach(v => { if (v > maxVal) maxVal = v; });
    });
    maxVal = Math.ceil(maxVal * 1.15) || 10;
    const steps = 5;

    // Draw grid
    if (showGrid) {
      this._drawGrid(ctx, width, height, padding, maxVal, steps);
    }

    // Draw X-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.ceil(data.labels.length / Math.min(data.labels.length, 10));
    data.labels.forEach((label, i) => {
      if (i % labelStep === 0) {
        const x = padding.left + (i / (data.labels.length - 1 || 1)) * chartW;
        ctx.fillText(label, x, height - padding.bottom + 22);
      }
    });

    // Draw datasets
    data.datasets.forEach(ds => {
      const points = ds.data.map((v, i) => ({
        x: padding.left + (i / (ds.data.length - 1 || 1)) * chartW,
        y: padding.top + chartH - (v / maxVal) * chartH
      }));

      // Area fill
      if (showArea && points.length > 1) {
        ctx.save();
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, this._hexToRgba(ds.color, 0.25));
        gradient.addColorStop(1, this._hexToRgba(ds.color, 0.0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartH);
        ctx.lineTo(points[0].x, points[0].y);
        this._drawSmoothCurve(ctx, points);
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Line
      if (points.length > 1) {
        ctx.strokeStyle = ds.color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        this._drawSmoothCurve(ctx, points);
        ctx.stroke();
      }

      // Dots
      if (showDots) {
        points.forEach(p => {
          // Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = this._hexToRgba(ds.color, 0.2);
          ctx.fill();

          // Dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = ds.color;
          ctx.fill();

          // Inner highlight
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        });
      }
    });

    // Legend
    this._drawLegend(ctx, data.datasets, width, padding);
  },

  bar(containerId, data, options = {}) {
    const { canvas, ctx, width, height } = this._createCanvas(containerId);
    if (!canvas) return;

    const padding = { top: 40, right: 30, bottom: 50, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Compute max value
    let maxVal = 0;
    data.datasets.forEach(ds => {
      ds.data.forEach(v => { if (v > maxVal) maxVal = v; });
    });
    maxVal = Math.ceil(maxVal * 1.15) || 10;
    const steps = 5;

    // Draw grid
    this._drawGrid(ctx, width, height, padding, maxVal, steps);

    // Draw X-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    const numLabels = data.labels.length;
    const groupWidth = chartW / numLabels;
    const numDatasets = data.datasets.length;
    const barPadding = groupWidth * 0.2;
    const totalBarWidth = groupWidth - barPadding;
    const singleBarWidth = totalBarWidth / numDatasets;
    const barRadius = Math.min(4, singleBarWidth / 2);

    data.labels.forEach((label, i) => {
      const groupX = padding.left + i * groupWidth;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText(label, groupX + groupWidth / 2, height - padding.bottom + 22);

      // Draw bars
      data.datasets.forEach((ds, di) => {
        const barX = groupX + barPadding / 2 + di * singleBarWidth;
        const barH = (ds.data[i] / maxVal) * chartH;
        const barY = padding.top + chartH - barH;

        // Bar with rounded top corners
        ctx.fillStyle = ds.color;
        ctx.beginPath();
        ctx.moveTo(barX, padding.top + chartH);
        ctx.lineTo(barX, barY + barRadius);
        ctx.quadraticCurveTo(barX, barY, barX + barRadius, barY);
        ctx.lineTo(barX + singleBarWidth - barRadius, barY);
        ctx.quadraticCurveTo(barX + singleBarWidth, barY, barX + singleBarWidth, barY + barRadius);
        ctx.lineTo(barX + singleBarWidth, padding.top + chartH);
        ctx.closePath();
        ctx.fill();

        // Subtle gradient overlay for depth
        const barGrad = ctx.createLinearGradient(barX, barY, barX + singleBarWidth, barY);
        barGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        barGrad.addColorStop(1, 'rgba(0,0,0,0.05)');
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.moveTo(barX, padding.top + chartH);
        ctx.lineTo(barX, barY + barRadius);
        ctx.quadraticCurveTo(barX, barY, barX + barRadius, barY);
        ctx.lineTo(barX + singleBarWidth - barRadius, barY);
        ctx.quadraticCurveTo(barX + singleBarWidth, barY, barX + singleBarWidth, barY + barRadius);
        ctx.lineTo(barX + singleBarWidth, padding.top + chartH);
        ctx.closePath();
        ctx.fill();
      });
    });

    // Legend
    this._drawLegend(ctx, data.datasets, width, padding);
  },

  doughnut(containerId, data, options = {}) {
    const { canvas, ctx, width, height } = this._createCanvas(containerId);
    if (!canvas) return;

    const centerX = width / 2;
    const legendHeight = 60;
    const centerY = (height - legendHeight) / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.62;
    const total = data.values.reduce((a, b) => a + b, 0);
    const gap = 0.03; // gap between segments in radians

    let startAngle = -Math.PI / 2;

    data.values.forEach((val, i) => {
      const sliceAngle = (val / total) * (Math.PI * 2) - gap;
      if (sliceAngle <= 0) return;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = data.colors[i];
      ctx.fill();

      // Subtle shadow/glow
      ctx.shadowColor = data.colors[i];
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      startAngle += sliceAngle + gap;
    });

    // Center text
    const centerText = options.centerText || total.toString();
    const centerLabel = options.centerLabel || 'Total';

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(20, radius * 0.28)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerText, centerX, centerY - 6);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${Math.max(11, radius * 0.12)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillText(centerLabel, centerX, centerY + 16);

    // Legend below
    const legendY = height - legendHeight + 10;
    const legendItemWidth = width / data.labels.length;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';

    data.labels.forEach((label, i) => {
      const lx = legendItemWidth * i + legendItemWidth / 2;

      // Color dot
      ctx.beginPath();
      ctx.arc(lx - 20, legendY + 6, 5, 0, Math.PI * 2);
      ctx.fillStyle = data.colors[i];
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(`${label} (${data.values[i]})`, lx - 12, legendY + 10);
    });
  },

  _createCanvas(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};

    container.innerHTML = '';
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 250;

    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    container.appendChild(canvas);
    return { canvas, ctx, width, height };
  },

  _drawGrid(ctx, width, height, padding, maxVal, steps) {
    const chartH = height - padding.top - padding.bottom;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (i / steps) * chartH;
      const val = Math.round(maxVal - (i / steps) * maxVal);

      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y label
      ctx.fillText(val, padding.left - 10, y);
    }
  },

  _drawSmoothCurve(ctx, points) {
    // Catmull-Rom to cubic bezier conversion for smooth curves
    if (points.length < 2) return;
    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
      return;
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const tension = 0.35;

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  },

  _drawLegend(ctx, datasets, width, padding) {
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';

    let legendX = width - padding.right;
    // Measure total legend width for right-alignment
    const items = datasets.map(ds => ({
      label: ds.label,
      color: ds.color,
      width: ctx.measureText(ds.label).width + 24
    }));
    const totalWidth = items.reduce((a, b) => a + b.width + 12, 0);
    legendX = width - padding.right - totalWidth;

    items.forEach(item => {
      // Color dot
      ctx.beginPath();
      ctx.arc(legendX + 6, padding.top / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(item.label, legendX + 16, padding.top / 2 + 4);

      legendX += item.width + 12;
    });
  },

  _hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
};
