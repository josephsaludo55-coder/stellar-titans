export interface SpacecraftProfile {
  id: string;
  name: string;
  className: string;
  description: string;
  massTonnes: number;
  deltaV: number;
  crewCapacity: number;
}

export const spacecraftProfiles: SpacecraftProfile[] = [
  {
    id: 'orion',
    name: 'Orion-class Crew Vehicle',
    className: 'Deep-space crew transport',
    description: 'Human-rated exploration vehicle designed for lunar and deep-space missions.',
    massTonnes: 25,
    deltaV: 4200,
    crewCapacity: 6,
  },
  {
    id: 'starling',
    name: 'Starling Cargo Lander',
    className: 'Cargo logistics',
    description: 'Autonomous transport platform built for payload delivery and surface support.',
    massTonnes: 18,
    deltaV: 3800,
    crewCapacity: 2,
  },
  {
    id: 'atlas-ii',
    name: 'Atlas II Observatory',
    className: 'Scientific platform',
    description: 'High-precision research vessel optimized for orbital astronomy and remote sensing.',
    massTonnes: 12,
    deltaV: 3600,
    crewCapacity: 1,
  },
];

export type SpacecraftSystem =
  | 'power'
  | 'communication'
  | 'propulsion'
  | 'computing'
  | 'science'
  | 'thermal'
  | 'structure'
  | 'data';

export interface DiagramPoint {
  x: number;
  y: number;
}

export interface SpacecraftComponent {
  id: string;
  name: string;
  category: SpacecraftSystem;
  description: string;
  purpose: string;
  howItWorks: string;
  importance: string;
  engineeringConsiderations: string;
  relationships: string[];
  exteriorPoint?: DiagramPoint;
  systemPoint: DiagramPoint;
}

export const spacecraftSystems: Array<{ id: SpacecraftSystem; name: string; color: string }> = [
  { id: 'power', name: 'Power', color: '#f0be65' },
  { id: 'communication', name: 'Communication', color: '#71dce5' },
  { id: 'propulsion', name: 'Propulsion', color: '#ff967b' },
  { id: 'computing', name: 'Computing', color: '#a5b5ff' },
  { id: 'science', name: 'Science', color: '#8cdb9f' },
  { id: 'thermal', name: 'Thermal', color: '#ffb478' },
  { id: 'structure', name: 'Structure', color: '#c4d2dc' },
  { id: 'data', name: 'Data', color: '#d3a7f2' },
];

export const spacecraftComponents: SpacecraftComponent[] = [
  {
    id: 'solar-panels',
    name: 'Solar Panels',
    category: 'power',
    description: 'Deployable arrays of photovoltaic cells mounted on the spacecraft bus.',
    purpose: 'Convert sunlight into electrical power for spacecraft systems and battery charging.',
    howItWorks: 'Photovoltaic cells convert incoming light into electrical current. The power system conditions that output before it is distributed or stored.',
    importance: 'For a solar-powered spacecraft, array output sets the energy available for communications, computing, instruments, and thermal control.',
    engineeringConsiderations: 'Array area, pointing, shadowing, degradation, temperature, and distance from the Sun affect available power. Articulation and deployment add mechanical risk.',
    relationships: ['power-distribution-unit', 'batteries', 'spacecraft-bus'],
    exteriorPoint: { x: 218, y: 242 },
    systemPoint: { x: 150, y: 110 },
  },
  {
    id: 'batteries',
    name: 'Batteries',
    category: 'power',
    description: 'Rechargeable energy storage connected to the spacecraft electrical bus.',
    purpose: 'Supply electrical energy when generation is lower than demand, such as during eclipse or peak loads.',
    howItWorks: 'Cells store energy chemically while charging and deliver electrical current when the power system calls for it.',
    importance: 'Stored energy helps keep essential spacecraft functions available when solar generation is interrupted or cannot meet an instantaneous load.',
    engineeringConsiderations: 'Capacity, charge limits, temperature, cycle life, fault containment, and reserve policy must be balanced against mass and volume.',
    relationships: ['solar-panels', 'power-distribution-unit'],
    systemPoint: { x: 150, y: 198 },
  },
  {
    id: 'power-distribution-unit',
    name: 'Power Distribution Unit',
    category: 'power',
    description: 'The switching and distribution hub for the spacecraft electrical system.',
    purpose: 'Route, regulate, and protect electrical power delivered to spacecraft loads.',
    howItWorks: 'Power electronics and switches manage input from generation and storage, then provide controlled feeds to subsystems.',
    importance: 'A fault-protected distribution system keeps critical loads supplied and allows operators or onboard control to isolate problems.',
    engineeringConsiderations: 'Designers plan voltage compatibility, peak loads, current limits, redundancy, switching behavior, and fault isolation.',
    relationships: ['solar-panels', 'batteries', 'flight-computer', 'communication-transceiver', 'camera', 'spectrometer', 'radar', 'environmental-sensors', 'heaters'],
    exteriorPoint: { x: 439, y: 245 },
    systemPoint: { x: 150, y: 286 },
  },
  {
    id: 'high-gain-antenna',
    name: 'High-Gain Antenna',
    category: 'communication',
    description: 'A directional antenna used for a focused radio link between the spacecraft and distant receivers.',
    purpose: 'Support higher-rate communication when the spacecraft can point its antenna toward a ground station.',
    howItWorks: 'Its focused beam concentrates radio energy in a narrower direction than a broad-coverage antenna.',
    importance: 'A high-gain link can return large volumes of science data over interplanetary distances when pointing and link conditions allow.',
    engineeringConsiderations: 'Pointing accuracy, gimbal range, frequency, link margin, ground-station availability, and spacecraft attitude affect performance.',
    relationships: ['communication-transceiver'],
    exteriorPoint: { x: 696, y: 139 },
    systemPoint: { x: 485, y: 110 },
  },
  {
    id: 'low-gain-antenna',
    name: 'Low-Gain Antenna',
    category: 'communication',
    description: 'A broad-coverage antenna that is less dependent on precise pointing than a high-gain antenna.',
    purpose: 'Maintain a basic command and telemetry link when high-gain pointing is unavailable or not selected.',
    howItWorks: 'It transmits and receives over a wider angular region, trading peak link strength or data rate for coverage.',
    importance: 'A broad link can support safe-mode communications and early mission contact while spacecraft attitude is constrained.',
    engineeringConsiderations: 'Coverage, antenna placement, interference, link margin, and the intended low-rate functions guide its design.',
    relationships: ['communication-transceiver'],
    exteriorPoint: { x: 548, y: 125 },
    systemPoint: { x: 485, y: 194 },
  },
  {
    id: 'communication-transceiver',
    name: 'Communication Transceiver',
    category: 'communication',
    description: 'Radio-frequency electronics that transmit and receive commands, telemetry, and mission data.',
    purpose: 'Bridge onboard information and the external radio link to ground stations or relay spacecraft.',
    howItWorks: 'Transmit chains encode and modulate data onto radio signals; receive chains recover and decode incoming signals.',
    importance: 'Without a dependable communications path, teams cannot reliably command the vehicle or receive its status and science return.',
    engineeringConsiderations: 'Frequency bands, antenna compatibility, data rates, power use, radiation tolerance, redundancy, and link budget must align.',
    relationships: ['high-gain-antenna', 'low-gain-antenna', 'data-storage', 'flight-computer', 'power-distribution-unit'],
    exteriorPoint: { x: 563, y: 235 },
    systemPoint: { x: 485, y: 278 },
  },
  {
    id: 'thrusters',
    name: 'Thrusters',
    category: 'propulsion',
    description: 'Small rocket engines used to change spacecraft motion or orientation, depending on mission design.',
    purpose: 'Provide controlled thrust for maneuvers such as trajectory corrections, orbit changes, or attitude control.',
    howItWorks: 'A commanded thruster expels propellant to create reaction force, changing vehicle velocity or rotation.',
    importance: 'Maneuver capability helps the spacecraft navigate, point its instruments and antennas, and respond to mission needs.',
    engineeringConsiderations: 'Thrust level, impulse, propellant use, plume direction, thermal effects, valve reliability, and control authority are considered together.',
    relationships: ['propellant-tank', 'flight-computer', 'power-distribution-unit', 'spacecraft-bus'],
    exteriorPoint: { x: 560, y: 429 },
    systemPoint: { x: 485, y: 446 },
  },
  {
    id: 'propellant-tank',
    name: 'Propellant Tank',
    category: 'propulsion',
    description: 'A pressure vessel that stores the consumable propellant used by the propulsion system.',
    purpose: 'Supply propellant to thrusters for planned maneuvers and control actions.',
    howItWorks: 'Feed lines and valves meter stored propellant from the tank to the selected thruster when a burn is commanded.',
    importance: 'Propellant is a finite mission resource that limits how much maneuvering remains available.',
    engineeringConsiderations: 'Tank pressure, fluid management in microgravity, leak prevention, temperature, structural loads, and remaining-propellant estimation matter.',
    relationships: ['thrusters', 'spacecraft-bus'],
    exteriorPoint: { x: 493, y: 389 },
    systemPoint: { x: 485, y: 362 },
  },
  {
    id: 'flight-computer',
    name: 'Flight Computer',
    category: 'computing',
    description: 'The command and control processor that executes onboard tasks and coordinates spacecraft subsystems.',
    purpose: 'Interpret commands, run control logic, monitor telemetry, and coordinate timed operations.',
    howItWorks: 'Processors execute software instructions using sensor inputs and stored command sequences, then issue outputs to other equipment.',
    importance: 'The computer keeps the spacecraft operating between ground contacts and coordinates complex activities safely.',
    engineeringConsiderations: 'Radiation effects, fault tolerance, watchdog recovery, timing, memory protection, verification, and safe modes shape the design.',
    relationships: ['onboard-software', 'power-distribution-unit', 'communication-transceiver', 'data-processing-unit', 'thrusters'],
    exteriorPoint: { x: 458, y: 258 },
    systemPoint: { x: 485, y: 614 },
  },
  {
    id: 'onboard-software',
    name: 'Onboard Software',
    category: 'computing',
    description: 'The verified set of programs and command sequences that defines spacecraft behavior.',
    purpose: 'Translate mission procedures and control algorithms into repeatable onboard operations.',
    howItWorks: 'Software reads inputs, checks rules and state, then schedules or issues commands to hardware through the flight computer.',
    importance: 'Software enables autonomy, fault response, sequencing, and instrument operations when real-time ground control is unavailable.',
    engineeringConsiderations: 'Testing, version control, safe-state behavior, command validation, timing, and recovery from unexpected inputs are critical.',
    relationships: ['flight-computer', 'data-processing-unit', 'thrusters', 'environmental-sensors'],
    exteriorPoint: { x: 502, y: 271 },
    systemPoint: { x: 485, y: 702 },
  },
  {
    id: 'camera',
    name: 'Camera',
    category: 'science',
    description: 'An imaging instrument that records scenes of the spacecraft environment or target body.',
    purpose: 'Provide visual context for science observations, navigation, inspection, and mission documentation.',
    howItWorks: 'Optics focus incoming light onto a detector; electronics convert detector output into digital image data.',
    importance: 'Images help teams understand terrain and targets, plan operations, and communicate mission discoveries.',
    engineeringConsiderations: 'Field of view, resolution, exposure, pointing, detector temperature, lighting, data volume, and radiation affect image quality.',
    relationships: ['power-distribution-unit', 'data-processing-unit', 'data-storage', 'spacecraft-bus'],
    exteriorPoint: { x: 385, y: 193 },
    systemPoint: { x: 820, y: 110 },
  },
  {
    id: 'spectrometer',
    name: 'Spectrometer',
    category: 'science',
    description: 'An instrument that separates or measures light by wavelength to help identify materials or physical conditions.',
    purpose: 'Collect spectral evidence tied to the mission’s scientific questions.',
    howItWorks: 'Optical elements spread or filter incoming light, and detectors measure its intensity across selected wavelengths.',
    importance: 'Spectral measurements can reveal signatures that are not apparent from an ordinary image alone.',
    engineeringConsiderations: 'Wavelength coverage, calibration, signal-to-noise, target illumination, pointing, thermal stability, and data volume are key trade-offs.',
    relationships: ['power-distribution-unit', 'data-processing-unit', 'data-storage', 'spacecraft-bus'],
    exteriorPoint: { x: 385, y: 252 },
    systemPoint: { x: 820, y: 198 },
  },
  {
    id: 'radar',
    name: 'Radar',
    category: 'science',
    description: 'A radio instrument that transmits signals and analyzes returned echoes.',
    purpose: 'Measure distance or surface properties; radar configuration determines the type of information available.',
    howItWorks: 'The instrument emits radio waves and measures the timing, strength, or frequency characteristics of echoes.',
    importance: 'Radar can provide measurements in conditions where visible-light imaging is limited and can support ranging or remote sensing.',
    engineeringConsiderations: 'Antenna aperture, frequency, transmitted power, clutter, geometry, interference, and processing requirements affect capability.',
    relationships: ['power-distribution-unit', 'data-processing-unit', 'data-storage', 'spacecraft-bus'],
    exteriorPoint: { x: 385, y: 311 },
    systemPoint: { x: 820, y: 286 },
  },
  {
    id: 'environmental-sensors',
    name: 'Environmental Sensors',
    category: 'science',
    description: 'A set of sensors that measures selected conditions around the spacecraft or at its destination.',
    purpose: 'Collect environmental measurements relevant to mission science, operations, or spacecraft health.',
    howItWorks: 'Sensor elements respond to physical conditions such as temperature, radiation, magnetic fields, or pressure and convert them into electrical readings.',
    importance: 'Environmental data can inform scientific interpretation and help operators understand spacecraft operating conditions.',
    engineeringConsiderations: 'Sensor placement, calibration, measurement range, noise, radiation, sampling rate, and cross-sensitivity must be managed.',
    relationships: ['power-distribution-unit', 'flight-computer', 'data-processing-unit', 'data-storage'],
    exteriorPoint: { x: 572, y: 287 },
    systemPoint: { x: 820, y: 374 },
  },
  {
    id: 'radiators',
    name: 'Radiators',
    category: 'thermal',
    description: 'Thermal surfaces designed to reject heat from spacecraft equipment to space.',
    purpose: 'Help maintain equipment within its allowable temperature range by radiating excess heat.',
    howItWorks: 'Heat moves from internal equipment to radiator surfaces and is emitted as infrared radiation.',
    importance: 'Spacecraft lack air convection, so deliberate heat paths and radiative surfaces are essential to thermal balance.',
    engineeringConsiderations: 'Surface properties, view to space, Sun exposure, internal heat loads, dust, and pointing constraints affect radiator performance.',
    relationships: ['spacecraft-bus', 'thermal-insulation', 'environmental-sensors'],
    exteriorPoint: { x: 581, y: 332 },
    systemPoint: { x: 820, y: 526 },
  },
  {
    id: 'thermal-insulation',
    name: 'Thermal Insulation',
    category: 'thermal',
    description: 'Insulating layers and surface treatments used to limit unwanted heat transfer.',
    purpose: 'Reduce temperature swings and help control heat exchange between the spacecraft and its environment.',
    howItWorks: 'Insulation reduces conductive and radiative heat transfer; multilayer blankets reflect infrared energy across small vacuum gaps.',
    importance: 'Thermal balance protects electronics, batteries, propulsion fluids, and instruments across changing sunlight and shadow.',
    engineeringConsiderations: 'Blanket layout, seams, penetrations, surface coatings, mass, contamination, and integration around moving parts need careful design.',
    relationships: ['radiators', 'heaters', 'spacecraft-bus', 'environmental-sensors'],
    exteriorPoint: { x: 422, y: 190 },
    systemPoint: { x: 820, y: 614 },
  },
  {
    id: 'heaters',
    name: 'Heaters',
    category: 'thermal',
    description: 'Electrical heating elements controlled to warm equipment or prevent temperatures from falling too low.',
    purpose: 'Keep temperature-sensitive hardware within operating or survival limits.',
    howItWorks: 'A resistive element converts electrical power into heat, often switched by thermostats or onboard control logic.',
    importance: 'Heaters help protect systems during cold phases, eclipses, or low-activity periods.',
    engineeringConsiderations: 'Power availability, sensor placement, control thresholds, redundancy, local hot spots, and fault behavior are important.',
    relationships: ['power-distribution-unit', 'thermal-insulation', 'environmental-sensors', 'flight-computer'],
    exteriorPoint: { x: 496, y: 304 },
    systemPoint: { x: 820, y: 702 },
  },
  {
    id: 'spacecraft-bus',
    name: 'Spacecraft Bus',
    category: 'structure',
    description: 'The main platform that supports payloads, subsystems, and interfaces across the spacecraft.',
    purpose: 'Provide the mechanical, electrical, thermal, and data interfaces that integrate the vehicle.',
    howItWorks: 'Subsystems mount to the bus and connect through planned harness, power, command, data, and thermal paths.',
    importance: 'A well-integrated bus lets mission-specific instruments operate as one coordinated spacecraft.',
    engineeringConsiderations: 'Mass allocation, interfaces, structural loads, access, electromagnetic compatibility, and integration sequence drive bus design.',
    relationships: ['structural-frame', 'solar-panels', 'thrusters', 'propellant-tank', 'radiators', 'thermal-insulation'],
    exteriorPoint: { x: 474, y: 246 },
    systemPoint: { x: 150, y: 462 },
  },
  {
    id: 'structural-frame',
    name: 'Structural Frame',
    category: 'structure',
    description: 'Load-bearing structure that holds spacecraft equipment and transmits launch and operational loads.',
    purpose: 'Maintain alignment and protect hardware through launch, deployment, and mission operations.',
    howItWorks: 'Frames, panels, and brackets distribute forces from mounted equipment into the primary structure.',
    importance: 'Structure keeps critical components attached and properly aligned while limiting excessive mass.',
    engineeringConsiderations: 'Strength, stiffness, vibration, thermal expansion, material selection, access, and fatigue or fracture margins are assessed.',
    relationships: ['spacecraft-bus', 'solar-panels', 'high-gain-antenna', 'thrusters'],
    exteriorPoint: { x: 448, y: 227 },
    systemPoint: { x: 150, y: 550 },
  },
  {
    id: 'data-storage',
    name: 'Data Storage',
    category: 'data',
    description: 'Non-volatile memory that holds commands, telemetry, and science products for later use or transmission.',
    purpose: 'Buffer data when the spacecraft cannot immediately send it to a ground station.',
    howItWorks: 'Digital records are written to memory and later read by onboard processing or communications tasks.',
    importance: 'Storage preserves valuable observations across communication gaps and enables prioritized downlink.',
    engineeringConsiderations: 'Capacity, radiation effects, error detection, power-loss behavior, data prioritization, and file integrity must be considered.',
    relationships: ['data-processing-unit', 'communication-transceiver', 'camera', 'spectrometer', 'radar', 'environmental-sensors'],
    exteriorPoint: { x: 459, y: 280 },
    systemPoint: { x: 150, y: 638 },
  },
  {
    id: 'data-processing-unit',
    name: 'Data Processing Unit',
    category: 'data',
    description: 'Electronics that prepare instrument and spacecraft data for storage, analysis, or transmission.',
    purpose: 'Organize, format, compress, or otherwise process digital data within mission constraints.',
    howItWorks: 'Processing hardware executes algorithms on incoming data, checks its state, and writes selected products to storage or a downlink queue.',
    importance: 'Processing can reduce transmission demand and help the mission prioritize useful science information.',
    engineeringConsiderations: 'Compute capacity, memory, power, fault recovery, compression trade-offs, latency, and data integrity matter.',
    relationships: ['flight-computer', 'data-storage', 'communication-transceiver', 'camera', 'spectrometer', 'radar', 'environmental-sensors'],
    exteriorPoint: { x: 506, y: 283 },
    systemPoint: { x: 150, y: 726 },
  },
];

export const spacecraftChallenges = [
  {
    question: 'A spacecraft is in eclipse and its solar arrays cannot generate power. Which system provides stored energy?',
    options: ['Batteries', 'High-Gain Antenna', 'Radiators'],
    correctIndex: 0,
    explanation: 'Batteries store energy from generation periods and can supply power when the arrays are not producing electricity.',
  },
  {
    question: 'Which path best describes a science image traveling back to Earth?',
    options: ['Camera → Data Processing Unit → Data Storage → Communication Transceiver → Antenna', 'Thrusters → Propellant Tank → Solar Panels → Earth', 'Radiator → Heater → Flight Computer → Antenna'],
    correctIndex: 0,
    explanation: 'The camera captures information, onboard electronics prepare and store it, then the radio and antenna provide the downlink path.',
  },
  {
    question: 'Why does spacecraft thermal design use both insulation and radiators?',
    options: ['Insulation limits unwanted heat transfer, while radiators reject excess heat.', 'Both systems are antennas that transmit heat to Earth.', 'Radiators store propellant and insulation controls thruster direction.'],
    correctIndex: 0,
    explanation: 'Thermal control is about managing heat flow in both directions: retaining needed heat and rejecting excess heat.',
  },
];
