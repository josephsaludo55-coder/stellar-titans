export interface AcademyImage {
  src: string;
  alt: string;
  caption: string;
  sourceUrl: string;
}

export interface AcademyChallenge {
  question: string;
  options: string[];
  correctIndex: number;
  correctFeedback: string;
  incorrectFeedback: string;
}

export interface AcademyChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  era: string;
  destination: string;
  historicalBackground: string;
  missionObjective: string;
  timeline: Array<{ date: string; event: string }>;
  architecture: string;
  components: Array<{ name: string; explanation: string }>;
  instruments: Array<{ name: string; explanation: string }>;
  achievements: string[];
  engineeringLessons: string[];
  images: AcademyImage[];
  sources: Array<{ label: string; url: string }>;
  challenge: AcademyChallenge;
  isDesignBrief?: boolean;
}

export const academyChapters: AcademyChapter[] = [
  {
    id: 'apollo-11-descent',
    number: 1,
    title: 'Apollo 11 Descent Stage',
    subtitle: 'A controlled landing at Tranquility Base',
    era: '20 July 1969',
    destination: 'Sea of Tranquility, Moon',
    historicalBackground:
      'Apollo 11 was the first crewed mission to land on the Moon and return its crew safely to Earth. Neil Armstrong and Buzz Aldrin descended in the Lunar Module Eagle while Michael Collins remained in the Command and Service Module Columbia in lunar orbit.',
    missionObjective:
      'Achieve a crewed lunar landing and safe return, while conducting surface exploration, deploying experiments, and collecting lunar samples.',
    timeline: [
      { date: '16 Jul 1969', event: 'Saturn V launches Apollo 11 from Kennedy Space Center.' },
      { date: '19 Jul 1969', event: 'Columbia and Eagle enter lunar orbit.' },
      { date: '20 Jul 1969', event: 'Eagle separates, begins powered descent, and lands in the Sea of Tranquility.' },
      { date: '21 Jul 1969', event: 'The ascent stage lifts off, rendezvouses with Columbia, and the crew begins the return journey.' },
      { date: '24 Jul 1969', event: 'The Command Module splashes down in the Pacific Ocean.' },
    ],
    architecture:
      'The Lunar Module had two stages. The descent stage carried the landing engine, landing gear, and surface equipment; it remained on the Moon. The ascent stage carried the crew back to orbit to rejoin Columbia.',
    components: [
      { name: 'Descent engine and propellant', explanation: 'Provided braking and controlled thrust during the powered descent to the lunar surface.' },
      { name: 'Landing radar and guidance', explanation: 'Supplied altitude and velocity information that supported the crew and onboard guidance during approach.' },
      { name: 'Landing gear and footpads', explanation: 'Absorbed touchdown loads and supported Eagle on uneven lunar terrain.' },
      { name: 'Ascent stage', explanation: 'A separate crewed stage that launched from the descent stage and returned Armstrong and Aldrin to lunar orbit.' },
    ],
    instruments: [
      { name: 'Passive Seismic Experiment Package', explanation: 'A seismometer package deployed on the surface to record lunar seismic activity.' },
      { name: 'Laser Ranging Retroreflector', explanation: 'A reflector left on the Moon so Earth-based laser ranging could measure the Earth-Moon distance.' },
      { name: 'Solar Wind Composition Experiment', explanation: 'A foil collector exposed to the solar wind and returned to Earth for analysis.' },
      { name: 'Crew observations and samples', explanation: 'The astronauts photographed the site, described geology, and collected lunar material for laboratory study.' },
    ],
    achievements: [
      'Completed the first crewed lunar landing and returned the crew safely to Earth.',
      'Returned about 21.6 kilograms (47.5 pounds) of lunar material for analysis.',
      'Deployed surface experiments, including a retroreflector that enabled continuing lunar laser-ranging measurements.',
    ],
    engineeringLessons: [
      'Separate ascent and descent stages so landing hardware can remain on the surface while the crew returns to orbit.',
      'Preserve crew authority and clear abort options when navigation, alarms, or terrain require rapid judgment.',
      'Treat landing-site selection, visibility, and fuel margin as linked design constraints.',
    ],
    images: [
      {
        src: 'https://images-assets.nasa.gov/image/6900992/6900992~large.jpg',
        alt: 'Apollo Lunar Module Eagle descending toward the Moon',
        caption: 'The Lunar Module Eagle makes its descent to the Moon. NASA/MSFC.',
        sourceUrl: 'https://images.nasa.gov/details-6900992',
      },
      {
        src: 'https://images-assets.nasa.gov/image/as11-40-5948/as11-40-5948~large.jpg',
        alt: 'Apollo 11 astronaut beside the deployed lunar surface experiment package',
        caption: 'Apollo 11 surface experiments after deployment. NASA/JSC.',
        sourceUrl: 'https://images.nasa.gov/details-as11-40-5948',
      },
    ],
    sources: [
      { label: 'NASA Apollo 11 Mission Overview', url: 'https://www.nasa.gov/history/apollo-11-mission-overview/' },
      { label: 'NASA Image and Video Library: Apollo 11 descent', url: 'https://images.nasa.gov/details-6900992' },
      { label: 'NASA Image and Video Library: EASEP deployment', url: 'https://images.nasa.gov/details-as11-40-5948' },
    ],
    challenge: {
      question: 'Why did Eagle leave its descent stage on the Moon?',
      options: [
        'The descent stage was the launch platform; the separate ascent stage carried the crew back to orbit.',
        'The descent stage was designed to return to Earth without a crew.',
        'The descent stage was converted into a communications satellite.',
      ],
      correctIndex: 0,
      correctFeedback: 'Correct. The two-stage architecture let the landing system stay behind while the lighter ascent stage returned the crew to lunar orbit.',
      incorrectFeedback: 'Not quite. Think about which stage had the engine and equipment needed to land, and which stage was designed to lift the crew back to orbit.',
    },
  },
  {
    id: 'lunokhod-1',
    number: 2,
    title: 'Lunokhod 1 (1970)',
    subtitle: 'The first successful remotely operated rover on another world',
    era: '1970-1971',
    destination: 'Mare Imbrium, Moon',
    historicalBackground:
      'The Soviet Luna 17 spacecraft delivered Lunokhod 1 to the lunar surface in November 1970. Operators on Earth directed the rover using television imagery and commands sent over a long communications delay. NASA’s Lunar Reconnaissance Orbiter later imaged the Luna 17 landing site and the rover’s traverse.',
    missionObjective:
      'Explore the lunar surface remotely, return panoramic imagery, investigate local soil and rocks, and conduct lunar laser-ranging experiments.',
    timeline: [
      { date: '10 Nov 1970', event: 'Luna 17 launches from Earth.' },
      { date: '17 Nov 1970', event: 'Luna 17 lands in Mare Imbrium and deploys Lunokhod 1.' },
      { date: 'Nov 1970 onward', event: 'Earth-based operators direct the rover’s surface traverse and science activities.' },
      { date: '1971', event: 'Surface operations end after the rover stops communicating; the landing site is later imaged by NASA’s Lunar Reconnaissance Orbiter.' },
    ],
    architecture:
      'Luna 17 served as the delivery lander. Lunokhod 1 was a low, eight-wheeled, remotely operated rover with a hinged solar-panel lid, rechargeable batteries, cameras, and science instruments. The rover remained on the lunar surface after operations ended.',
    components: [
      { name: 'Eight-wheel chassis', explanation: 'Supported mobility over the lunar surface and allowed the rover to be driven across uneven ground.' },
      { name: 'Solar-panel lid and batteries', explanation: 'The lid collected solar energy; rechargeable batteries supplied stored power during operations.' },
      { name: 'Television and panoramic cameras', explanation: 'Returned images used by Earth-based operators for navigation and by the science team to inspect the surroundings.' },
      { name: 'Ground-control link', explanation: 'Carried commands to the rover and telemetry and images back to its operators on Earth.' },
    ],
    instruments: [
      { name: 'RIFMA X-ray fluorescence spectrometer', explanation: 'Examined the elemental composition of lunar surface material.' },
      { name: 'Soil mechanics tester', explanation: 'Probed the mechanical properties of the lunar soil.' },
      { name: 'Lunar laser retroreflector', explanation: 'Enabled laser-ranging measurements from Earth to the lunar surface.' },
      { name: 'Radiation and X-ray measurements', explanation: 'The rover also carried experiments to monitor radiation and X-ray sources in its environment.' },
    ],
    achievements: [
      'Became the first successful remotely operated rover to work on another world.',
      'Returned thousands of images and in-situ measurements while traversing Mare Imbrium.',
      'Left a laser retroreflector that remains a target for lunar laser-ranging observations.',
    ],
    engineeringLessons: [
      'Remote driving depends on useful images, careful route planning, and patient command cycles.',
      'A surface rover must manage power across sunlight, darkness, and changing thermal conditions.',
      'Design instruments and mobility together: the rover must reach useful terrain and make stable measurements there.',
    ],
    images: [
      {
        src: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Lunokhod_1_Revisited_%28LROC402_-_M175502049R_LR1_thumb%29.png',
        alt: 'Lunokhod 1 at its final parking place, shown in a Lunar Reconnaissance Orbiter image with a close-up inset',
        caption: 'Lunokhod 1 at its final parking place in Mare Imbrium; the inset shows the rover. NASA/GSFC/Arizona State University.',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lunokhod_1_Revisited_(LROC402_-_M175502049R_LR1_thumb).png',
      },
      {
        src: 'https://images-assets.nasa.gov/image/PIA12967/PIA12967~orig.jpg',
        alt: 'Orbital image of the Luna 17 landing site that delivered Lunokhod 1',
        caption: 'NASA Lunar Reconnaissance Orbiter view of the Luna 17 landing site and Lunokhod 1 traverse. NASA/GSFC/Arizona State University.',
        sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA12967',
      },
    ],
    sources: [
      { label: 'NASA LROC: Lunokhod 1 Revisited', url: 'https://lroc.im-ldi.com/posts/402' },
      { label: 'NASA Lunar Reconnaissance Orbiter image record', url: 'https://photojournal.jpl.nasa.gov/catalog/PIA12967' },
      { label: 'NASA Space Science Data Coordinated Archive: Luna 17 / Lunokhod 1', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1970-095A' },
    ],
    challenge: {
      question: 'What made Lunokhod 1’s driving approach different from a crewed rover?',
      options: [
        'Operators on Earth drove it from returned images and telemetry.',
        'It used a pre-programmed route and had no communication link.',
        'It was piloted by astronauts from lunar orbit.',
      ],
      correctIndex: 0,
      correctFeedback: 'Correct. Lunokhod 1 was remotely operated from Earth, so imagery, communications, and cautious route selection were central to its operations.',
      incorrectFeedback: 'Not quite. Lunokhod 1 was a robotic rover, and its operators were on Earth rather than aboard the rover or in lunar orbit.',
    },
  },
  {
    id: 'opportunity',
    number: 3,
    title: 'Opportunity Mars Rover (2004-2018)',
    subtitle: 'A 90-sol mission that explored for more than 14 years',
    era: '2004-2018',
    destination: 'Meridiani Planum, Mars',
    historicalBackground:
      'Opportunity was one of NASA’s twin Mars Exploration Rovers, built to investigate sites where orbital observations suggested liquid water may once have affected rocks. Its landing area at Meridiani Planum contained hematite detected from orbit. Designed for a 90-sol prime mission, Opportunity operated for more than 14 Earth years.',
    missionObjective:
      'Search for and characterize rocks and soils that could reveal whether past environmental conditions on Mars were wet and potentially habitable.',
    timeline: [
      { date: '7 Jul 2003', event: 'Opportunity launches from Cape Canaveral.' },
      { date: '24 Jan 2004 PST', event: 'The rover lands at Meridiani Planum inside Eagle Crater.' },
      { date: '2004', event: 'Early observations identify hematite-rich spherules and sedimentary textures at the landing site.' },
      { date: '2011', event: 'Opportunity reaches the rim of Endeavour Crater and studies older rocks.' },
      { date: '10 Jun 2018', event: 'The rover sends its last communication during a planet-encircling dust storm.' },
      { date: '13 Feb 2019', event: 'NASA concludes the mission after recovery efforts do not restore contact.' },
    ],
    architecture:
      'Opportunity was a solar-powered, six-wheeled mobile science laboratory. A mast carried navigation and panoramic cameras; a robotic arm positioned contact instruments against rocks and soil. The rover’s mobility system and instrument suite were designed to work together as it crossed and examined the Martian surface.',
    components: [
      { name: 'Solar arrays and batteries', explanation: 'Generated and stored electrical energy; wind sometimes cleaned dust from the panels, affecting available power.' },
      { name: 'Six-wheel mobility system', explanation: 'Allowed the rover to traverse plains, approach outcrops, and visit impact craters.' },
      { name: 'Mast and cameras', explanation: 'Provided navigation views and multispectral panoramas for route planning and geological context.' },
      { name: 'Instrument deployment arm', explanation: 'Placed contact science instruments close to rocks and soil targets.' },
    ],
    instruments: [
      { name: 'Panoramic Camera (Pancam)', explanation: 'Captured multispectral images of terrain, rocks, and the horizon.' },
      { name: 'Miniature Thermal Emission Spectrometer (Mini-TES)', explanation: 'Measured thermal infrared spectra to help identify minerals from a distance.' },
      { name: 'APXS and Mössbauer spectrometer', explanation: 'Contact instruments used to examine elemental composition and iron-bearing minerals.' },
      { name: 'Microscopic Imager and Rock Abrasion Tool', explanation: 'The imager examined close-up textures; the abrasion tool exposed fresh rock surfaces for study.' },
    ],
    achievements: [
      'Found hematite-rich spherules and layered rocks at Meridiani Planum that provided evidence of an ancient watery environment.',
      'Found signs of water-altered rocks at multiple sites, including gypsum veins and clay-bearing terrain near Endeavour Crater.',
      'Drove 45.16 kilometers (28.06 miles) before the mission ended, far beyond its planned 90-sol prime mission.',
    ],
    engineeringLessons: [
      'Build margin into mission lifetime: a robust system can keep returning science long after its design life.',
      'Solar-powered exploration must treat dust, weather, thermal conditions, and energy budgeting as operational concerns.',
      'A mobile science platform needs instruments suited to both remote survey and close contact with targets.',
    ],
    images: [
      {
        src: 'https://science.nasa.gov/wp-content/uploads/2024/03/opportunity-dusty-selfie-pia17759.jpg',
        alt: 'Opportunity rover self-portrait showing its solar panels and mast',
        caption: 'Opportunity used Pancam images to create this self-portrait of the rover and its solar arrays. NASA/JPL-Caltech/Cornell/ASU.',
        sourceUrl: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
      },
      {
        src: 'https://science.nasa.gov/wp-content/uploads/2024/03/pia19113.jpg?w=1200',
        alt: 'Hematite-rich spherical concretions nicknamed blueberries on Mars',
        caption: 'Hematite spherules near Fram Crater, documented by Opportunity’s microscopic imager. NASA/JPL-Caltech/Cornell/USGS.',
        sourceUrl: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/',
      },
    ],
    sources: [
      { label: 'NASA Mars Exploration Rovers mission overview', url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/' },
      { label: 'NASA Mars Exploration Rovers science highlights', url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/' },
    ],
    challenge: {
      question: 'What was Opportunity primarily sent to investigate?',
      options: [
        'Evidence in rocks and soils that Mars may once have had liquid water.',
        'The internal seismic structure of Mars.',
        'The composition of the Martian moons from orbit.',
      ],
      correctIndex: 0,
      correctFeedback: 'Correct. Opportunity examined rocks and soils for evidence of past water and environmental conditions.',
      incorrectFeedback: 'Not quite. Opportunity was a surface geology rover; its twin-rover mission sought evidence in Martian rocks and soils about ancient water.',
    },
  },
  {
    id: 'insight',
    number: 4,
    title: 'InSight Lander (2018)',
    subtitle: 'Listening for the internal structure of Mars',
    era: '2018-2022',
    destination: 'Elysium Planitia, Mars',
    historicalBackground:
      'NASA’s InSight lander was the first mission dedicated to investigating Mars’ deep interior. It landed on a flat plain chosen for safe access to the ground, then deployed instruments to measure seismic activity, heat flow, and the planet’s rotation.',
    missionObjective:
      'Understand how rocky planets form and evolve by measuring Mars’ interior structure, heat flow, seismic activity, and rotation.',
    timeline: [
      { date: '5 May 2018', event: 'InSight launches from Vandenberg Air Force Base aboard an Atlas V 401.' },
      { date: '26 Nov 2018', event: 'The lander touches down at Elysium Planitia.' },
      { date: '2019', event: 'SEIS records the first confirmed marsquake detected by the mission.' },
      { date: '2021-2022', event: 'Seismic observations, including signals from impacts and marsquakes, refine models of the planet’s interior.' },
      { date: '15 Dec 2022', event: 'NASA declares the mission ended after the lander can no longer communicate reliably.' },
    ],
    architecture:
      'InSight used a stationary lander based on the Phoenix Mars lander design. A robotic arm moved the sensitive instruments from the deck to the ground, where direct contact improved measurements. Solar panels powered the lander and its instruments.',
    components: [
      { name: 'Lander deck and solar arrays', explanation: 'Supported the instruments and provided electrical power at the stationary landing site.' },
      { name: 'Instrument Deployment Arm', explanation: 'A 1.8-meter robotic arm placed the seismometer and heat-flow package on the Martian surface.' },
      { name: 'Wind and Thermal Shield', explanation: 'Covered SEIS to reduce environmental noise from wind and temperature changes.' },
      { name: 'Engineering cameras and weather sensors', explanation: 'Helped select instrument placement locations and interpret environmental effects on measurements.' },
    ],
    instruments: [
      { name: 'SEIS', explanation: 'The Seismic Experiment for Interior Structure measured marsquakes, impact signals, and surface vibrations.' },
      { name: 'HP3', explanation: 'The Heat Flow and Physical Properties Package was designed to measure heat moving from the planet’s interior; its mole could not reach its intended depth in Martian soil.' },
      { name: 'RISE', explanation: 'The Rotation and Interior Structure Experiment used radio tracking to measure Mars’ rotation and infer properties of its core.' },
      { name: 'Auxiliary sensors', explanation: 'Pressure, wind, temperature, and magnetic measurements helped characterize the environment and interpret seismic data.' },
    ],
    achievements: [
      'Detected more than 1,300 seismic events and enabled the first detailed seismic investigation of Mars.',
      'Used seismic waves to constrain the thickness and structure of the crust, mantle, and core.',
      'Recorded signals from meteoroid impacts and gathered extensive surface weather data.',
    ],
    engineeringLessons: [
      'Instrument placement can be mission-critical: a robotic arm created a carefully selected workspace for sensitive measurements.',
      'Design assumptions about soil mechanics must be tested against real terrain; HP3 could not burrow to its planned depth.',
      'A stationary observatory can answer deep scientific questions when its instruments are deployed and shielded well.',
    ],
    images: [
      {
        src: 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/resources/detail_files/2/6/26761_26761_PIA25287-clean-web.jpg?w=1200&h=675&fit=clip',
        alt: 'NASA InSight lander taking a final self-portrait on Mars',
        caption: 'InSight’s final selfie, taken on its 1,211th Martian day. NASA/JPL-Caltech.',
        sourceUrl: 'https://science.nasa.gov/mission/insight/spacecraft/',
      },
      {
        src: 'https://science.nasa.gov/wp-content/uploads/2024/03/pia23177-revised.png',
        alt: 'InSight robotic arm deploying the domed SEIS seismometer shield',
        caption: 'SEIS is covered by its Wind and Thermal Shield. NASA/JPL-Caltech.',
        sourceUrl: 'https://science.nasa.gov/mission/insight/science-instruments/',
      },
    ],
    sources: [
      { label: 'NASA InSight mission overview', url: 'https://science.nasa.gov/mission/insight/' },
      { label: 'NASA InSight spacecraft and deployment system', url: 'https://science.nasa.gov/mission/insight/spacecraft/' },
      { label: 'NASA InSight science instruments', url: 'https://science.nasa.gov/mission/insight/science-instruments/' },
      { label: 'NASA InSight science highlights', url: 'https://science.nasa.gov/mission/insight/science-highlights/' },
    ],
    challenge: {
      question: 'Which instrument directly measured seismic waves from marsquakes?',
      options: ['SEIS', 'HP3', 'RISE'],
      correctIndex: 0,
      correctFeedback: 'Correct. SEIS was InSight’s seismometer; HP3 investigated heat flow, while RISE used radio tracking to study rotation.',
      incorrectFeedback: 'Not quite. HP3 was the heat-flow package and RISE studied rotation using radio tracking. The seismometer was SEIS.',
    },
  },
  {
    id: 'mission-designer',
    number: 5,
    title: 'Your Mission: Become a Space Mission Designer',
    subtitle: 'Turn historical lessons into a mission concept',
    era: 'Your design brief',
    destination: 'Choose a destination for your own mission',
    historicalBackground:
      'This is a student design exercise, not a historical mission. You have studied a crewed lunar landing, a remotely operated lunar rover, a long-lived Mars rover, and a stationary Mars geophysical lander. Now use their documented engineering lessons to frame a mission of your own.',
    missionObjective:
      'Define a testable science or exploration objective, then explain how your spacecraft and operations plan could achieve it.',
    timeline: [
      { date: '01 / Ask', event: 'Choose a question worth exploring and a destination where evidence can be collected.' },
      { date: '02 / Design', event: 'Select a mission architecture, systems, and instruments that fit the objective.' },
      { date: '03 / Test', event: 'Identify risks, test assumptions, and explain how the mission will handle failure modes.' },
      { date: '04 / Learn', event: 'Set success criteria and describe what you will measure to evaluate the mission.' },
    ],
    architecture:
      'Your architecture is a design decision, not a preset spacecraft: choose a flyby, orbiter, lander, rover, or a justified combination. Explain how each part supports your objective and destination.',
    components: [
      { name: 'Mission objective', explanation: 'Write one clear question or goal that can guide design decisions.' },
      { name: 'Spacecraft architecture', explanation: 'Choose and justify the vehicle type or mission elements needed to reach the destination and do the work.' },
      { name: 'Power, communications, and mobility', explanation: 'Decide what the spacecraft needs to operate, return data, and move or remain safely at the target.' },
      { name: 'Risk and operations plan', explanation: 'Identify a major risk, a mitigation, and the evidence that will tell you whether the mission is succeeding.' },
    ],
    instruments: [
      { name: 'Choose instruments to answer your question', explanation: 'Select measurements that connect directly to your objective. For each, explain the data it returns and why that data matters.' },
      { name: 'Plan for instrument operations', explanation: 'Consider pointing, contact with a surface, power use, data storage, and communication needs as appropriate to your architecture.' },
    ],
    achievements: [
      'Produce a mission concept with a clear objective, destination, architecture, and measurable success criteria.',
      'Explain at least one engineering trade-off and one risk mitigation using lessons from the earlier chapters.',
    ],
    engineeringLessons: [
      'A mission is a connected system: destination, science objective, spacecraft, instruments, and operations must fit together.',
      'State assumptions clearly and distinguish a proposed design from established mission facts.',
      'Treat test results and unexpected conditions as evidence that can improve the design.',
    ],
    images: [
      {
        src: 'https://science.nasa.gov/wp-content/uploads/2024/03/pia16078.jpg?resize=1200,675',
        alt: 'Illustration of Mars with seismic waves representing planetary interior science',
        caption: 'InSight’s science approach: use planetary signals to study a world’s interior. NASA/JPL-Caltech.',
        sourceUrl: 'https://science.nasa.gov/mission/insight/science/',
      },
    ],
    sources: [
      { label: 'NASA Apollo 11 mission overview', url: 'https://www.nasa.gov/history/apollo-11-mission-overview/' },
      { label: 'NASA Mars Exploration Rovers overview', url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/' },
      { label: 'NASA InSight mission overview', url: 'https://science.nasa.gov/mission/insight/' },
      { label: 'NASA Lunar Reconnaissance Orbiter image of Lunokhod 1 landing site', url: 'https://photojournal.jpl.nasa.gov/catalog/PIA12967' },
    ],
    challenge: {
      question: 'What should guide your choice of spacecraft and instruments?',
      options: [
        'The mission question, destination, and evidence needed to answer it.',
        'The most complex vehicle available, regardless of mission objective.',
        'A favorite instrument, even if it cannot collect relevant data.',
      ],
      correctIndex: 0,
      correctFeedback: 'Exactly. A strong design connects its objective to the destination, architecture, instruments, and success criteria.',
      incorrectFeedback: 'Revisit the relationship between objective and evidence. The vehicle and payload should be selected to answer the mission question.',
    },
    isDesignBrief: true,
  },
];
