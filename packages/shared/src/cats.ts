import type { CatId, ConsequenceType } from './enums.js';

export interface CatSeedConfig {
  palette: {
    body: string;
    belly?: string;
    ink: string;
    markings?: string;
    patch?: string;
    eyes?: string;
    eyeGlint?: string;
    nose?: string;
    innerEar?: string;
    socks?: string;
    bib?: string;
    mask?: string;
  };
  structure: {
    ears: 'pointy' | 'roundTall' | 'roundSoft' | 'batEars';
    tailPath: 'bigCurl' | 'longPlume' | 'lowHook' | 'fluffyPuff' | 'zigzag';
    eyeShape: 'dotWide' | 'almond' | 'narrowSly' | 'bigGleam' | 'wideWild';
    bodyLength: number;
    headSize: number;
    postureDefault: 'upright' | 'poised' | 'slink' | 'chonk' | 'gremlin';
  };
  motion: { overshootMul: number; stepFreq: number; pauseBias: number };
  quirks: {
    chosenLine: string;
    waitingLines: string[];
    closeLines: string[];
    loseLine: string;
    winLine: string;
    stageLines?: {
      stage1: string[];
      stage2: string[];
      stage3: string[];
      stage4: string[];
      stage5: string[];
    };
  };
}

export interface CatSeed {
  id: CatId;
  name: string;
  type: string;
  personality: string;
  config: CatSeedConfig;
}

const sharedInk = '#2B231F';

export const CAT_SEED: CatSeed[] = [
  {
    id: 'orange',
    name: 'Miso',
    type: 'ORANGE',
    personality: 'Optimistic / chaotic / playful',
    config: {
      palette: {
        body: '#E28743',
        belly: '#FBE9D2',
        ink: sharedInk,
        markings: '#B85D24',
        eyes: '#E76F51',
        eyeGlint: '#FFFFFF',
        nose: '#E76F51',
        innerEar: '#F9B4A0',
      },
      structure: {
        ears: 'pointy',
        tailPath: 'bigCurl',
        eyeShape: 'dotWide',
        bodyLength: 0.95,
        headSize: 1.1,
        postureDefault: 'upright',
      },
      motion: { overshootMul: 1.3, stepFreq: 1.15, pauseBias: 0.6 },
      quirks: {
        chosenLine: 'oh!! oh!! deal!!',
        waitingLines: ['taking my time. lots of it.', "is that… the cabinet?? nooo (yes)"],
        closeLines: ["I'M SO READY. ARE YOU??"],
        loseLine: 'aw man. okay. maybe next time.',
        winLine: 'I KNEW IT!!! NOM NOM NOM',
        stageLines: {
          stage1: [
            "i'll keep watch from my box!",
            "you got this, right? i believe in you!",
            "just waiting right here for your win!",
          ],
          stage2: [
            "oh!! grass!! we're moving up in the world!!",
            "look at the flowers! keep going!!",
            "sunshine and fresh air! you're doing it!",
          ],
          stage3: [
            "THIS CUSHION IS AMAZING!! BEST DAY EVER!!",
            "you're doing so good!! look at me lounging!",
            "softest bed in the universe! thank you!!",
          ],
          stage4: [
            "A TOY!! LOOK AT IT JINGLE!! WE'RE ALMOST THERE!!",
            "I'M SO EXCITED!! FINISH LINE IN SIGHT!",
            "paw tap! paw tap! we are so close!!",
          ],
          stage5: [
            "FOOOOOD!! WE DID IT!! YOU'RE THE BEST HUMAN EVER!!",
            "FEAST MODE UNLOCKED!! NOM NOM NOM!",
            "GLORIOUS MEAL TIME!! WE WON!!",
          ],
        },
      },
    },
  },
  {
    id: 'tuxedo',
    name: 'Winston',
    type: 'TUXEDO',
    personality: 'Judgmental / sophisticated / sarcastic',
    config: {
      palette: {
        body: '#2B2A29',
        belly: '#FBF8F1',
        ink: '#1E1B18',
        markings: '#FBF8F1',
        eyes: '#4E8752',
        eyeGlint: '#FFFFFF',
        nose: '#EFA7A7',
        innerEar: '#EFA7A7',
        socks: '#FBF8F1',
        bib: '#FBF8F1',
      },
      structure: {
        ears: 'roundTall',
        tailPath: 'longPlume',
        eyeShape: 'almond',
        bodyLength: 1.05,
        headSize: 1,
        postureDefault: 'poised',
      },
      motion: { overshootMul: 0.8, stepFreq: 0.85, pauseBias: 1.4 },
      quirks: {
        chosenLine: 'Very well. I shall wait.',
        waitingLines: ["I've seen faster humans.", 'I do enjoy a good suspense.'],
        closeLines: ['The hour grows late.'],
        loseLine: 'Hm. Adequate, I suppose.',
        winLine: 'Naturally. Bon appétit — moi.',
        stageLines: {
          stage1: [
            "A box in the street. How quaint. Do not tarry, human.",
            "I expect progress posthaste.",
            "I shall supervise from this temporary shelter.",
          ],
          stage2: [
            "Fresh air and garden greenery. An acceptable upgrade.",
            "Acceptable progress. Do not lose momentum.",
            "The scenery improves. As expected of you.",
          ],
          stage3: [
            "Finally, a cushion befitting my aristocratic stature.",
            "Luxurious comfort. You have done well thus far.",
            "Most satisfactory. Keep this exquisite pace.",
          ],
          stage4: [
            "A delightful diversion. Victory is within grasp.",
            "Splendid toy. Maintain this pace to the finish.",
            "I approve of this arrangement. Almost there.",
          ],
          stage5: [
            "Exquisite cuisine. A magnificent triumph, human.",
            "Naturally, perfection was achieved. Bon appétit!",
            "A gourmet victory. Splendidly done.",
          ],
        },
      },
    },
  },
  {
    id: 'black',
    name: 'Nyx',
    type: 'BLACK',
    personality: 'Mischievous / mysterious / slightly evil',
    config: {
      palette: {
        body: '#24202C',
        belly: '#352F40',
        ink: '#141219',
        markings: '#443C53',
        eyes: '#F7D060',
        eyeGlint: '#FFFFFF',
        nose: '#A08F85',
        innerEar: '#6A5D7B',
      },
      structure: {
        ears: 'pointy',
        tailPath: 'lowHook',
        eyeShape: 'narrowSly',
        bodyLength: 1,
        headSize: 0.95,
        postureDefault: 'slink',
      },
      motion: { overshootMul: 1, stepFreq: 1, pauseBias: 1 },
      quirks: {
        chosenLine: 'heh. sure you will.',
        waitingLines: ['tick tock.', 'the bowl is RIGHT THERE.'],
        closeLines: ["you won't make it. i can smell it."],
        loseLine: '…fine.',
        winLine: 'I KNEW IT. feast mode.',
        stageLines: {
          stage1: [
            "the box is cozy... but the streets are cold. get to work.",
            "tick tock. don't leave me out in the alley.",
            "lurking in the shadows... watching your cursor.",
          ],
          stage2: [
            "i can smell the garden... we're getting closer.",
            "good pacing. the void approves.",
            "out of the alley, into the grass. keep going.",
          ],
          stage3: [
            "now this is the good life. don't stop now.",
            "purr... so soft. finish strong, human.",
            "the shadow throne is prepared. almost there.",
          ],
          stage4: [
            "pounce mode ready... bring home the victory.",
            "the final stretch. i can smell the feast.",
            "batting the toy into orbit! finish it!",
          ],
          stage5: [
            "THE FEAST IS OURS!! brilliant work, partner.",
            "we conquered the deadline. pure perfection.",
            "unlimited snacks unlocked! victory is sweet.",
          ],
        },
      },
    },
  },
  {
    id: 'boba',
    name: 'Boba',
    type: 'BOBA',
    personality: 'Sleepy / food-obsessed / gentle chonk',
    config: {
      palette: {
        body: '#F7F1E5',
        belly: '#FFFDF9',
        ink: sharedInk,
        markings: '#4A3E3D',
        patch: '#E07A5F',
        eyes: '#3D5A80',
        eyeGlint: '#E0FBFC',
        nose: '#E76F51',
        innerEar: '#F4A5A5',
      },
      structure: {
        ears: 'roundSoft',
        tailPath: 'fluffyPuff',
        eyeShape: 'bigGleam',
        bodyLength: 1.15,
        headSize: 1.15,
        postureDefault: 'chonk',
      },
      motion: { overshootMul: 0.7, stepFreq: 0.75, pauseBias: 1.6 },
      quirks: {
        chosenLine: 'deal! wake me up when it is food time…',
        waitingLines: [
          'is it snack time yet?',
          'i am conserving energy for the feast.',
          'sleeping with one ear open…',
        ],
        closeLines: ['the aroma of victory is in the air…', 'my bowl calls to me…'],
        loseLine: 'yawn… back to nap then.',
        winLine: 'YESSS! CHONK FEAST COMMENCES!',
        stageLines: {
          stage1: [
            "it's a comfy box, but i'm dreaming of a warm bed...",
            "conserving my energy in this box... you got this!",
            "wake me up when you make some progress!",
          ],
          stage2: [
            "sunshine and grass... feeling cozy already!",
            "warm garden breeze... almost cushion time!",
            "gentle purrs from the grass... keep going!",
          ],
          stage3: [
            "zzzz... this bed is like a giant warm marshmallow...",
            "so soft... keep working, almost snack time...",
            "snuggled up on my cloud... you're doing wonderful!",
          ],
          stage4: [
            "playing with my toy... getting my appetite ready!",
            "almost food time... my tummy is rumbling happily!",
            "pat pat with the paws! the finish line is right here!",
          ],
          stage5: [
            "FOOOOOOD!! delicious golden feast... thank you!!",
            "the happiest chonk in the world! nom nom!",
            "tummy full and heart happy! we did it!!",
          ],
        },
      },
    },
  },
  {
    id: 'ziggy',
    name: 'Ziggy',
    type: 'ZIGGY',
    personality: 'Hyperactive / chaos gremlin / zoomies master',
    config: {
      palette: {
        body: '#EFE8D8',
        belly: '#FBF7EE',
        ink: sharedInk,
        markings: '#3C2F2F',
        mask: '#3C2F2F',
        eyes: '#48CAE4',
        eyeGlint: '#FFFFFF',
        nose: '#2E2222',
        innerEar: '#E29578',
        socks: '#3C2F2F',
      },
      structure: {
        ears: 'batEars',
        tailPath: 'zigzag',
        eyeShape: 'wideWild',
        bodyLength: 0.9,
        headSize: 1.05,
        postureDefault: 'gremlin',
      },
      motion: { overshootMul: 1.5, stepFreq: 1.35, pauseBias: 0.4 },
      quirks: {
        chosenLine: 'ZOOMIES PROTOCOL ENGAGED!!',
        waitingLines: [
          'I HEARD A CRUMB DROP 3 MILES AWAY',
          'CANNOT SIT STILL MUST JUMP',
          'TICK TOCK GO FAST FAST FAST!',
        ],
        closeLines: ['FIVE MINUTES UNTIL MAXIMUM CHAOS!!', 'PREPARING 3AM VICTORY SPRINT!'],
        loseLine: 'REEE! I will sprint anyway!!',
        winLine: 'VICTORY LAP AT THE SPEED OF SOUND!!',
        stageLines: {
          stage1: [
            "BOX HEADQUARTERS ACTIVE!! SPRINT TIME GO GO GO!",
            "I'M WAITING AT MAXIMUM VELOCITY!!",
            "CANNOT SIT STILL IN BOX MUST FOCUS TYPE FAST!!",
          ],
          stage2: [
            "NATURE ZOOMIES UNLOCKED!! SPRINT SPRINT SPRINT!!",
            "LOOK AT MY NEW SPOT!! SPEED LEVEL 2 REACHED!!",
            "BOUNCING THROUGH THE GARDEN!! KEEP TYPING!!",
          ],
          stage3: [
            "SUPER SOFT LAUNCHPAD ACQUIRED!! JUMP JUMP!!",
            "I CAN BOUNCE ON THIS FOREVER!! KEEP GOING!",
            "SPEED BED SPEED BED!! ALMOST THERE!!",
          ],
          stage4: [
            "TOY ENGAGED!! MAXIMUM FUN!! ALMOST THERE!!",
            "HYPER ZOOMIES ACTIVATED!! PUSH PUSH PUSH!",
            "FEATHER SPEED ATTACK!! FINISH LINE IMMINENT!!",
          ],
          stage5: [
            "VICTORY FEAST AT THE SPEED OF SOUND!! WE WON!!",
            "MISSION ACCOMPLISHED!! BEST PARTNER EVER!!",
            "UNSTOPPABLE ZOOMIES CELEBRATION COMMENCES!!",
          ],
        },
      },
    },
  },
];

export const CONSEQUENCE_TYPE_BY_LABEL: Record<string, ConsequenceType> = {
  meals: 'MEALS',
  dryFood: 'DRY_FOOD',
  vetCare: 'VET_CARE',
};
