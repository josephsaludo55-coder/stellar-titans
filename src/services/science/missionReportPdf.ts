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

function makePdf(lines: string[]): Uint8Array {
  const pageLines = 49;
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / pageLines)) }, (_, index) => lines.slice(index * pageLines, (index + 1) * pageLines));
  const pageIds = pages.map((_, index) => 4 + index * 2);
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const commands = ['BT', '/F1 9 Tf', '48 754 Td', '13 TL', ...page.map((line) => `(${escapePdf(line)}) Tj T*`), 'ET'].join('\n');
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });
  let pdf = '%PDF-1.4\n% science report\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function downloadMissionReportPdf(simulation: MissionSimulationState, evaluation?: MissionEvaluationRecord): void {
  const { snapshot, landingRecord, scienceReport } = simulation;
  const lines = [
    'BEYOND EARTH - PLANETARY SCIENCE MISSION REPORT',
    'EDUCATIONAL SIMULATION DATA - NOT ACTUAL PLANETARY OR NASA FINDINGS',
    '', 'MISSION OVERVIEW',
    `Mission: ${snapshot.missionName}`,
    `Destination: ${snapshot.destinationName}`,
    `Architecture: ${snapshot.architectureName}`,
    `Objectives: ${snapshot.objectives.map((item) => item.name).join('; ') || 'None configured'}`,
    `Mission duration: ${snapshot.durationDays} modeled days`,
    `Launch vehicle: ${snapshot.launchVehicleName} | Trajectory: ${snapshot.trajectoryName}`,
    `Spacecraft mass: ${snapshot.totalMassKg.toLocaleString()} kg | Estimated mission spend: $${snapshot.totalMissionSpendUsd.toLocaleString()}`,
    '', 'LANDING INFORMATION',
    `Status: ${landingRecord ? 'Successful touchdown' : 'No successful touchdown recorded'}`,
    ...(landingRecord ? [`Virtual landing grid: X ${landingRecord.gridX.toFixed(1)}, Y ${landingRecord.gridY.toFixed(1)}`, `Coordinate reference: ${landingRecord.coordinateReference}`, `Landing time: ${landingRecord.landedAt}`, `Mission elapsed: T+${landingRecord.modeledElapsedDays} modeled days`] : []),
    '', 'SPACECRAFT AND INSTRUMENTS',
    `Spacecraft systems: ${snapshot.components.map((item) => item.name).join(', ') || 'None recorded'}`,
    `Selected instruments: ${snapshot.instruments.map((item) => item.name).join(', ') || 'None'}`,
    `Successfully deployed: ${scienceReport?.deployedInstrumentIds.map((id) => snapshot.instruments.find((item) => item.id === id)?.name ?? id).join(', ') || 'None'}`,
    '', 'COLLECTED SCIENTIFIC DATA',
    `Data volume: ${(scienceReport?.dataVolumeGb ?? simulation.scienceDataCollectedGb).toFixed(2)} GB | Modeled instrument energy: ${scienceReport?.instrumentPowerWh.toLocaleString() ?? '0'} Wh`,
    ...(scienceReport?.readings.length ? scienceReport.readings.flatMap((reading) => wrapLine(`${reading.metric}: ${reading.value} ${reading.unit} | Instrument: ${reading.instrumentName} | Measurement: ${reading.interpretation}`)) : ['No instrument readings were collected.']),
    '', 'SURFACE IMAGE PRODUCTS',
    ...(scienceReport?.surfaceImages.length ? scienceReport.surfaceImages.map((image) => `${image.title} - ${image.caption} [generated simulation illustration]`) : ['No camera images: a Scientific Camera was not deployed.']),
    '', 'ENVIRONMENTAL ANALYSIS',
    ...(scienceReport?.environmentalAnalysis.flatMap(wrapLine) ?? ['No environmental report available.']),
    '', 'SCIENTIFIC DISCOVERIES - INTERPRETATIONS, NOT CONFIRMED FACTS',
    ...(scienceReport?.discoveries.length ? scienceReport.discoveries.flatMap((item) => wrapLine(`${item.title} (${item.confidence} confidence). Evidence: ${item.evidence}. Interpretation: ${item.interpretation}`)) : ['No supported interpretations from the selected instruments.']),
    '', 'MISSION PERFORMANCE',
    `Outcome: ${simulation.missionOutcome ?? 'in progress'} | Performance score: ${evaluation?.overallScore ?? simulation.performanceScore ?? 'not calculated'}/100`,
    `Objectives supported: ${simulation.objectiveResults.filter((item) => item.status === 'supported').length}/${simulation.objectiveResults.length}`,
    `Data collected / transmitted / retained: ${simulation.scienceDataCollectedGb.toFixed(2)} / ${simulation.dataTransmittedGb.toFixed(2)} / ${simulation.dataRetainedGb.toFixed(2)} GB`,
    `Power available / modeled load: ${snapshot.powerGenerationW} / ${snapshot.powerDemandW} W | Communication: ${snapshot.downlinkMbps.toFixed(2)} Mbps`,
    ...(simulation.objectiveResults.map((item) => `${item.status.toUpperCase()} - ${item.objectiveName}: ${item.finding}`)),
    '', 'RECOMMENDATIONS',
    ...(evaluation?.recommendations.length ? evaluation.recommendations.flatMap((item) => wrapLine(`- ${item}`)) : ['Review instrument coverage, power margin, data storage, and communications before the next flight.']),
    '', 'MODEL NOTE',
    'Readings are deterministic educational examples based on the chosen instruments. They are not measurements from an actual landing, and do not confirm water, ice, or life.',
  ];
  const bytes = makePdf(lines.flatMap((line) => line ? wrapLine(line) : ['']));
  const blob = new Blob([bytes], { type: 'application/pdf' });
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
