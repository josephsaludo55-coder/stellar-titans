import type { MissionEvaluationRecord, MissionSimulationState } from '../../state/gameTypes';

function ascii(value: string): string {
  return value.normalize('NFKD')
    .replace(/[°º]/g, ' deg ').replace(/µ/g, 'micro').replace(/[–—]/g, '-')
    .replace(/[·•]/g, '-').replace(/[→]/g, '->').replace(/[^\x20-\x7E]/g, '?');
}

function escapePdf(value: string): string {
  return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(value: string, limit = 96): string[] {
  const words = ascii(value).split(/\s+/);
  const result: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > limit && line) { result.push(line); line = word; }
    else line = next;
  }
  if (line) result.push(line);
  return result;
}

interface PdfLogoImage { width: number; height: number; rgb: Uint8Array; alpha: Uint8Array; }

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function compressBytes(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function loadLogoImage(): Promise<PdfLogoImage | null> {
  try {
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}beyond-earth-logo.png`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const rgb = new Uint8Array((canvas.width * 3 + 1) * canvas.height);
    const alpha = new Uint8Array((canvas.width + 1) * canvas.height);
    for (let y = 0; y < canvas.height; y += 1) {
      const rgbRow = y * (canvas.width * 3 + 1);
      const alphaRow = y * (canvas.width + 1);
      rgb[rgbRow] = 0;
      alpha[alphaRow] = 0;
      for (let x = 0; x < canvas.width; x += 1) {
        const source = (y * canvas.width + x) * 4;
        const targetRgb = rgbRow + 1 + x * 3;
        rgb[targetRgb] = pixels[source];
        rgb[targetRgb + 1] = pixels[source + 1];
        rgb[targetRgb + 2] = pixels[source + 2];
        alpha[alphaRow + 1 + x] = pixels[source + 3];
      }
    }
    return { width: canvas.width, height: canvas.height, rgb: await compressBytes(rgb), alpha: await compressBytes(alpha) };
  } catch {
    return null;
  }
}

function makeStreamObject(dictionary: string, stream: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const header = encoder.encode(`<< ${dictionary} /Length ${stream.byteLength} >>\nstream\n`);
  const footer = encoder.encode('\nendstream');
  const result = new Uint8Array(header.byteLength + stream.byteLength + footer.byteLength);
  result.set(header, 0);
  result.set(stream, header.byteLength);
  result.set(footer, header.byteLength + stream.byteLength);
  return result;
}

function makePdf(lines: string[], logo: PdfLogoImage | null, missionName: string, destinationName: string, reportDate: string): Uint8Array {
  const pageLines = 43;
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / pageLines)) }, (_, index) => lines.slice(index * pageLines, (index + 1) * pageLines));
  const logoImageId = logo ? 5 : null;
  const logoMaskId = logo ? 6 : null;
  const firstPageId = logo ? 7 : 5;
  const pageIds = pages.map((_, index) => firstPageId + index * 2);
  const objects: Uint8Array[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ].map((object) => new TextEncoder().encode(object));
  if (logo && logoImageId && logoMaskId) {
    objects.push(makeStreamObject(`/Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns ${logo.width} >> /SMask ${logoMaskId} 0 R`, logo.rgb));
    objects.push(makeStreamObject(`/Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 1 /BitsPerComponent 8 /Columns ${logo.width} >>`, logo.alpha));
  }
  const sectionTitles = new Set([
    'MISSION OVERVIEW', 'MISSION OBJECTIVES', 'MISSION DESIGN & RESOURCES', 'SCIENCE OPERATIONS',
    'INSTRUMENT COVERAGE', 'DATA RETURN', 'LANDING RECORD', 'SCIENCE READINGS',
    'SURFACE IMAGE PRODUCTS', 'ENVIRONMENTAL ANALYSIS', 'SCIENTIFIC INTERPRETATIONS',
    'MISSION SCORECARD', 'EVENT LOG', 'MISSION DEBRIEF', 'RECOMMENDATIONS', 'MODEL NOTES',
  ]);
  const encoder = new TextEncoder();
  const text = (value: string, font: 'F1' | 'F2', size: number, x: number, y: number, color: string) =>
    `q ${color} rg BT /${font} ${size} Tf ${x} ${y} Td (${escapePdf(value)}) Tj ET Q`;
  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const isFirstPage = index === 0;
    const commands = [
      'q 1 1 1 rg 0 0 612 792 re f Q',
      'q 0.055 0.10 0.20 rg 0 690 612 102 re f Q',
      'q 0.27 0.74 0.84 rg 0 686 612 4 re f Q',
      text(isFirstPage ? 'SCIENCE MISSION REPORT' : 'BEYOND EARTH  /  MISSION REPORT', 'F2', isFirstPage ? 20 : 12, 44, isFirstPage ? 752 : 753, '1 1 1'),
      text(`${missionName}  |  ${destinationName}`, 'F1', 9, 45, 731, '0.78 0.87 0.94'),
      ...(isFirstPage ? [text('EDUCATIONAL MISSION RESULTS', 'F2', 8, 45, 713, '0.42 0.83 0.89')] : []),
      ...(logo && logoImageId ? ['q', '48 0 0 48 536 715 cm', '/Logo Do', 'Q'] : []),
      'q 0.85 0.89 0.93 RG 0.6 w 44 48 m 568 48 l S Q',
      text('BEYOND EARTH  |  EDUCATIONAL SIMULATION', 'F2', 7, 45, 33, '0.30 0.39 0.49'),
      text(`GENERATED ${reportDate}  |  PAGE ${index + 1} OF ${pages.length}`, 'F1', 7, 372, 33, '0.30 0.39 0.49'),
    ];
    let y = 666;
    for (const line of page) {
      if (!line) { y -= 7; continue; }
      if (sectionTitles.has(line)) {
        commands.push(`q 0.92 0.96 0.98 rg 44 ${y - 5} 524 17 re f Q`);
        commands.push(text(line, 'F2', 8, 51, y, '0.08 0.28 0.40'));
        y -= 19;
      } else {
        commands.push(text(line, 'F1', 8.5, 50, y, '0.14 0.19 0.25'));
        y -= 13;
      }
    }
    const resources = `/Font << /F1 3 0 R /F2 4 0 R >>${logo ? ` /XObject << /Logo ${logoImageId} 0 R >>` : ''}`;
    objects[pageId - 1] = encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << ${resources} >> /Contents ${contentId} 0 R >>`);
    objects[contentId - 1] = makeStreamObject('', encoder.encode(commands.join('\n')));
  });
  const chunks: Uint8Array[] = [encoder.encode('%PDF-1.4\n% science report\n')];
  const offsets = [0];
  let byteLength = chunks[0].byteLength;
  objects.forEach((object, index) => {
    const header = encoder.encode(`${index + 1} 0 obj\n`);
    const footer = encoder.encode('\nendobj\n');
    offsets.push(byteLength);
    chunks.push(header, object, footer);
    byteLength += header.byteLength + object.byteLength + footer.byteLength;
  });
  const xrefOffset = byteLength;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(encoder.encode(xref));
  const pdf = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.byteLength, 0));
  let position = 0;
  chunks.forEach((chunk) => { pdf.set(chunk, position); position += chunk.byteLength; });
  return pdf;
}

export async function downloadMissionReportPdf(simulation: MissionSimulationState, evaluation?: MissionEvaluationRecord): Promise<void> {
  const { snapshot, landingRecord, scienceReport } = simulation;
  const money = (amount: number) => `$${Math.round(amount).toLocaleString('en-US')}`;
  const number = (value: number, digits = 1) => value.toLocaleString('en-US', { maximumFractionDigits: digits });
  const dateLabel = (value?: string | null) => {
    if (!value) return 'Not recorded';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  };
  const instrumentNames = (ids: string[]) => ids.map((id) => snapshot.instruments.find((instrument) => instrument.id === id)?.name ?? id).join(', ');
  const supportedObjectives = simulation.objectiveResults.filter((item) => item.status === 'supported').length;
  const massMargin = snapshot.launchVehicleCapacityKg - snapshot.totalMassKg;
  const powerMargin = snapshot.powerGenerationW - snapshot.powerDemandW;
  const dataReturnPercent = simulation.scienceDataCollectedGb > 0
    ? Math.min(100, simulation.dataTransmittedGb / simulation.scienceDataCollectedGb * 100)
    : 0;
  const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const deployedIds = new Set(scienceReport?.deployedInstrumentIds ?? []);
  const lines = [
    'MISSION OVERVIEW',
    `Mission: ${snapshot.missionName}`,
    `Destination: ${snapshot.destinationName} | Environment: ${snapshot.destinationEnvironment}`,
    `Mission outcome: ${(simulation.missionOutcome ?? 'in progress').toUpperCase()}${evaluation ? ` | Rating: ${evaluation.rating}` : ''}`,
    `Performance index: ${evaluation?.overallScore ?? simulation.performanceScore ?? 'Not calculated'} / 100${simulation.resultSummary ? ` | ${simulation.resultSummary}` : ''}`,
    `Architecture: ${snapshot.architectureName} | Duration: ${snapshot.durationDays} modeled days (configured: ${snapshot.configuredDurationDays})`,
    `Started: ${dateLabel(simulation.startedAt)} | Completed: ${dateLabel(simulation.completedAt)}`,
    '', 'MISSION OBJECTIVES',
    `Objective coverage: ${supportedObjectives} of ${simulation.objectiveResults.length} objectives supported`,
    ...simulation.objectiveResults.flatMap((item) => wrapLine(`${item.status === 'supported' ? 'SUPPORTED' : 'NOT SUPPORTED'} - ${item.objectiveName}. Instruments: ${item.supportingInstruments.join(', ') || 'None recorded'}. ${item.finding}`)),
    '', 'MISSION DESIGN & RESOURCES',
    `Launch: ${snapshot.launchVehicleName} (${number(snapshot.totalMassKg)} kg of ${number(snapshot.launchVehicleCapacityKg)} kg capacity; ${number(massMargin)} kg margin)`,
    `Trajectory: ${snapshot.trajectoryName} | Phase: ${snapshot.trajectoryPhase}`,
    `Spacecraft mass: ${number(snapshot.totalMassKg)} kg | Components: ${snapshot.components.map((item) => item.name).join(', ') || 'None recorded'}`,
    `Budget: ${money(snapshot.totalMissionSpendUsd)} spent of ${money(snapshot.initialFundingUsd)} | ${money(snapshot.remainingBudgetUsd)} remaining`,
    `Power: ${number(snapshot.powerGenerationW)} W generated / ${number(snapshot.powerDemandW)} W modeled demand | ${number(powerMargin)} W margin`,
    `Storage: ${number(snapshot.storageCapacityGb)} GB capacity | ${number(snapshot.estimatedMissionDataGb)} GB estimated mission data`,
    `Communications: ${number(snapshot.downlinkMbps, 2)} Mbps downlink | ${number(snapshot.dailyDownlinkCapacityGb, 2)} GB/day modeled capacity | ${snapshot.communicationRequirement}`,
    '', 'SCIENCE OPERATIONS',
    `Selected instruments: ${snapshot.instruments.map((item) => item.name).join(', ') || 'None'}`,
    `Deployed instruments: ${instrumentNames([...deployedIds]) || 'None recorded'}`,
    ...snapshot.instruments.map((instrument) => {
      const readings = scienceReport?.readings.filter((reading) => reading.instrumentId === instrument.id) ?? [];
      const state = deployedIds.has(instrument.id) ? 'DEPLOYED' : 'NOT RECORDED AS DEPLOYED';
      return `${instrument.name} - ${state}; ${readings.length} recorded reading(s). Purpose: ${instrument.scientificPurpose}`;
    }).flatMap((line) => wrapLine(line)),
    '', 'DATA RETURN',
    `Science data collected: ${number(simulation.scienceDataCollectedGb, 2)} GB | Transmitted to Earth: ${number(simulation.dataTransmittedGb, 2)} GB (${number(dataReturnPercent, 1)}%) | Retained onboard: ${number(simulation.dataRetainedGb, 2)} GB`,
    `Science report volume: ${number(scienceReport?.dataVolumeGb ?? simulation.scienceDataCollectedGb, 2)} GB | Modeled instrument energy: ${number(scienceReport?.instrumentPowerWh ?? 0)} Wh`,
    '', 'LANDING RECORD',
    `Touchdown: ${landingRecord ? 'Successful' : 'No successful touchdown recorded'} | Attempts: ${simulation.landingAttempts ?? 'Not recorded'}`,
    ...(landingRecord ? [`Virtual grid position: X ${number(landingRecord.gridX)}, Y ${number(landingRecord.gridY)} | Reference: ${landingRecord.coordinateReference}`, `Landing timestamp: ${dateLabel(landingRecord.landedAt)} | Mission elapsed: T+${number(landingRecord.modeledElapsedDays)} days`] : []),
    '', 'SCIENCE READINGS',
    ...(scienceReport?.readings.length ? scienceReport.readings.flatMap((reading) => wrapLine(`${reading.metric}: ${number(reading.value, 3)} ${reading.unit} | ${reading.instrumentName} | ${reading.interpretation}`)) : ['No instrument readings were collected.']),
    '', 'SURFACE IMAGE PRODUCTS',
    ...(scienceReport?.surfaceImages.length ? scienceReport.surfaceImages.flatMap((image) => wrapLine(`${image.title} - ${image.caption} (simulation illustration; instrument: ${image.instrumentName})`)) : ['No surface image products were recorded.']),
    '', 'ENVIRONMENTAL ANALYSIS',
    ...(scienceReport?.environmentalAnalysis.length ? scienceReport.environmentalAnalysis.flatMap((line) => wrapLine(line)) : ['No environmental analysis was recorded.']),
    '', 'SCIENTIFIC INTERPRETATIONS',
    ...(scienceReport?.discoveries.length ? scienceReport.discoveries.flatMap((item) => wrapLine(`${item.title} - ${item.confidence.toUpperCase()} confidence. Evidence: ${item.evidence}. Interpretation: ${item.interpretation}`)) : ['No supported interpretations were recorded from the selected instruments.']),
    '', 'MISSION SCORECARD',
    ...(evaluation ? [
      `Overall rating: ${evaluation.rating} | Engineering performance: ${evaluation.engineeringPerformance.score} / ${evaluation.engineeringPerformance.maximum}`,
      ...evaluation.categories.flatMap((category) => wrapLine(`${category.label}: ${category.score} / ${category.maximum}. ${category.calculation}. Evidence: ${category.evidence}`)),
      ...evaluation.scientificAchievements.map((item) => `Science achievement: ${item}`),
      ...evaluation.resourceEfficiency.map((item) => `Resource efficiency: ${item}`),
      ...evaluation.engineeringProblems.map((item) => `Engineering issue: ${item}`),
    ] : ['Detailed score breakdown was not available when this report was generated.']),
    '', 'EVENT LOG',
    ...(simulation.events.length ? simulation.events.slice(-12).flatMap((event) => wrapLine(`${dateLabel(event.occurredAt)} - ${event.severity.toUpperCase()} - ${event.title}: ${event.detail}`)) : ['No mission events were recorded.']),
    '', 'MISSION DEBRIEF',
    ...(evaluation?.debrief ? wrapLine(evaluation.debrief) : simulation.resultSummary ? wrapLine(simulation.resultSummary) : ['No mission debrief was recorded.']),
    '', 'RECOMMENDATIONS',
    ...(evaluation?.recommendations.length ? evaluation.recommendations.flatMap((item) => wrapLine(`- ${item}`)) : ['Review instrument coverage, power margin, data storage, and communications before the next mission.']),
    '', 'MODEL NOTES',
    `Report generated: ${generatedAt}`,
    'This is an educational simulation. Readings are modeled examples based on the selected instruments and mission choices, not live telemetry or actual planetary measurements.',
    'Scientific discoveries are interpretations of simulated evidence. They do not confirm water, ice, or life.',
  ];
  const logo = await loadLogoImage();
  const bytes = makePdf(lines.flatMap((line) => line ? wrapLine(line, 112) : ['']), logo, snapshot.missionName, snapshot.destinationName, generatedAt);
  const blob = new Blob([toArrayBuffer(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const filename = ascii(snapshot.missionName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'space-mission';
  anchor.href = url;
  anchor.download = `${filename}-science-report.pdf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
