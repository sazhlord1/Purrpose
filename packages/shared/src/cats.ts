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
    ears: string;
    tailPath: string;
    eyeShape: string;
    bodyLength: number;
    headSize: number;
    postureDefault: string;
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
  /** 0 = free for everyone. Otherwise the PURR price to unlock this cat. */
  pricePurr: number;
  config: CatSeedConfig;
}

const sharedInk = '#26201D';

export const CAT_SEED: CatSeed[] = [
  // 1. MISO (Golden Honey Tabby with Joyful Closed Eyes — Top 2nd in ref)
  {
    id: 'orange',
    name: 'Miso',
    type: 'TABBY',
    personality: 'Joyful / optimistic / warm sunbather',
    pricePurr: 0,
    config: {
      palette: {
        body: '#EEB038',
        belly: '#EEB038',
        ink: sharedInk,
        markings: '#26201D',
        eyes: '#26201D',
        eyeGlint: '#FFFDF9',
        nose: '#26201D',
      },
      structure: {
        ears: 'pointy',
        tailPath: 'spiralCurl',
        eyeShape: 'joyfulArch',
        bodyLength: 1,
        headSize: 1,
        postureDefault: 'seatedPaws',
      },
      motion: { overshootMul: 1.2, stepFreq: 1.1, pauseBias: 0.7 },
      quirks: {
        chosenLine: 'oh!! oh!! deal!!',
        waitingLines: ['taking my time in the sun.', 'is that… the snack cabinet??'],
        closeLines: ["I'M SO READY. ARE YOU??"],
        loseLine: 'aw man. okay. maybe next time.',
        winLine: 'I KNEW IT!!! NOM NOM NOM',
        stageLines: {
          stage1: ["i'll keep watch from my box!", "you got this, right? i believe in you!"],
          stage2: ["oh!! grass!! we're moving up in the world!!", "sunshine and fresh air!"],
          stage3: ["THIS CUSHION IS AMAZING!! BEST DAY EVER!!", "look at me lounging!"],
          stage4: ["A TOY!! LOOK AT IT JINGLE!! WE'RE ALMOST THERE!!", "paw tap! finish line in sight!"],
          stage5: ["FOOOOOD!! WE DID IT!! BEST HUMAN EVER!!", "FEAST MODE UNLOCKED!! NOM NOM!"],
        },
      },
    },
  },

  // 2. WINSTON (Striped Cap & Flanks Tuxedo — Bottom Right in ref)
  {
    id: 'tuxedo',
    name: 'Winston',
    type: 'TUXEDO',
    personality: 'Aristocratic / dignified / sardonic',
    pricePurr: 0,
    config: {
      palette: {
        body: '#FFFDF9',
        belly: '#FFFDF9',
        ink: sharedInk,
        markings: '#26201D',
        eyes: '#26201D',
        eyeGlint: '#FFFDF9',
        nose: '#26201D',
        patch: '#F4978E', // Rosy cheeks
      },
      structure: {
        ears: 'tallStriped',
        tailPath: 'rootedStripedCurl',
        eyeShape: 'dotWide',
        bodyLength: 1,
        headSize: 1,
        postureDefault: 'aristocratSeated',
      },
      motion: { overshootMul: 0.8, stepFreq: 0.85, pauseBias: 1.4 },
      quirks: {
        chosenLine: 'Very well. I shall wait.',
        waitingLines: ["I've seen faster humans.", 'I do enjoy a good suspense.'],
        closeLines: ['The hour grows late.'],
        loseLine: 'Hm. Adequate, I suppose.',
        winLine: 'Naturally. Bon appétit — moi.',
        stageLines: {
          stage1: ["A box in the street. How quaint. Do not tarry, human.", "I expect progress posthaste."],
          stage2: ["Fresh air and garden greenery. An acceptable upgrade.", "Keep your momentum."],
          stage3: ["Finally, a cushion befitting my aristocratic stature.", "Luxurious comfort."],
          stage4: ["A delightful diversion. Victory is within grasp.", "Splendid toy. Almost there."],
          stage5: ["Exquisite cuisine. A magnificent triumph, human.", "Naturally, perfection was achieved."],
        },
      },
    },
  },

  // 3. NYX (Midnight Velvet Black with Pink Inner Ears — Bottom 2nd in ref)
  {
    id: 'black',
    name: 'Nyx',
    type: 'MIDNIGHT',
    personality: 'Mysterious / graceful / luminous-eyed',
    pricePurr: 0,
    config: {
      palette: {
        body: '#1E1B18',
        belly: '#1E1B18',
        ink: sharedInk,
        markings: '#FFFDF9',
        eyes: '#FFFDF9',
        eyeGlint: '#1E1B18',
        nose: '#E05368',
        innerEar: '#E05368',
      },
      structure: {
        ears: 'pinkInner',
        tailPath: 'sleekUpright',
        eyeShape: 'luminousOval',
        bodyLength: 0.95,
        headSize: 0.95,
        postureDefault: 'slenderSeated',
      },
      motion: { overshootMul: 1, stepFreq: 1, pauseBias: 1 },
      quirks: {
        chosenLine: 'heh. sure you will.',
        waitingLines: ['tick tock.', 'the bowl is RIGHT THERE.'],
        closeLines: ["you won't make it. i can smell it."],
        loseLine: '…fine.',
        winLine: 'I KNEW IT. feast mode.',
        stageLines: {
          stage1: ["the box is cozy... but the streets are cold. get to work.", "tick tock."],
          stage2: ["i can smell the garden... we're getting closer.", "the void approves."],
          stage3: ["now this is the good life. don't stop now.", "the shadow throne is prepared."],
          stage4: ["pounce mode ready... bring home the victory.", "the final stretch."],
          stage5: ["THE FEAST IS OURS!! brilliant work, partner.", "unlimited snacks unlocked!"],
        },
      },
    },
  },

  // 4. BOBA (Calico Patch with Playful Side-Glance Eyes — Bottom 3rd in ref)
  {
    id: 'boba',
    name: 'Boba',
    type: 'CALICO',
    personality: 'Curious / sweet / cheeky side-glancer',
    pricePurr: 150,
    config: {
      palette: {
        body: '#FFFDF9',
        belly: '#FFFDF9',
        ink: sharedInk,
        markings: '#E07A5F',
        patch: '#E07A5F',
        eyes: '#FFFDF9',
        eyeGlint: '#26201D',
        nose: '#26201D',
      },
      structure: {
        ears: 'splitCalico',
        tailPath: 'groundTail',
        eyeShape: 'sideGlance',
        bodyLength: 1.05,
        headSize: 1,
        postureDefault: 'calicoSeated',
      },
      motion: { overshootMul: 0.9, stepFreq: 0.9, pauseBias: 1.2 },
      quirks: {
        chosenLine: 'deal! wake me up when it is food time…',
        waitingLines: ['is it snack time yet?', 'side-eyeing your procrastination…'],
        closeLines: ['the aroma of victory is in the air…'],
        loseLine: 'yawn… back to nap then.',
        winLine: 'YESSS! CHONK FEAST COMMENCES!',
        stageLines: {
          stage1: ["dreaming of a warm bed from my box...", "wake me up when you make progress!"],
          stage2: ["sunshine and grass... feeling cozy already!", "warm garden breeze!"],
          stage3: ["zzzz... this bed is like a giant warm marshmallow...", "so soft... keep working!"],
          stage4: ["playing with my toy... getting my appetite ready!", "almost food time!"],
          stage5: ["FOOOOOOD!! delicious golden feast... thank you!!", "tummy full and heart happy!"],
        },
      },
    },
  },

  // 5. MOCHI (Snow White with Black Ear & Tail Hook — Top Left in ref)
  {
    id: 'mochi',
    name: 'Mochi',
    type: 'BICOLOR',
    personality: 'Quiet / gentle / marshmallow soft',
    pricePurr: 150,
    config: {
      palette: {
        body: '#FFFDF9',
        belly: '#FFFDF9',
        ink: sharedInk,
        markings: '#26201D',
        eyes: '#26201D',
        eyeGlint: '#FFFDF9',
        nose: '#26201D',
      },
      structure: {
        ears: 'blackLeftComb',
        tailPath: 'hookLeft',
        eyeShape: 'dotWide',
        bodyLength: 1,
        headSize: 1,
        postureDefault: 'jjLegs',
      },
      motion: { overshootMul: 0.85, stepFreq: 0.9, pauseBias: 1.3 },
      quirks: {
        chosenLine: 'purr... i believe in you.',
        waitingLines: ['sitting very still.', 'watching your screen quietly.'],
        closeLines: ['almost done, right?'],
        loseLine: 'oh well... i still like you.',
        winLine: 'Mochi is very, very happy!',
        stageLines: {
          stage1: ["i am small in this box, but i have big hopes!", "keep typing, friend."],
          stage2: ["i like this little garden patch.", "green grass makes me calm."],
          stage3: ["such a cloud-soft cushion. thank you.", "purring very gently now."],
          stage4: ["i nudged the toy with my paw!", "almost finished."],
          stage5: ["a feast! mochi bows gratefully.", "we did it together!"],
        },
      },
    },
  },

  // 6. OREO (Masked Tuxedo on Ledge with Big Eyes & Mustache Dots — Top 3rd in ref)
  {
    id: 'oreo',
    name: 'Oreo',
    type: 'MASKED',
    personality: 'Inquisitive / observant / mustache gentleman',
    pricePurr: 200,
    config: {
      palette: {
        body: '#FFFDF9',
        belly: '#FFFDF9',
        ink: sharedInk,
        markings: '#26201D',
        eyes: '#FFFDF9',
        eyeGlint: '#26201D',
        nose: '#26201D',
      },
      structure: {
        ears: 'blackMaskEars',
        tailPath: 'uprightLedge',
        eyeShape: 'bigRoundStare',
        bodyLength: 1,
        headSize: 1.05,
        postureDefault: 'ledgePaws',
      },
      motion: { overshootMul: 1.1, stepFreq: 1, pauseBias: 0.9 },
      quirks: {
        chosenLine: 'Eyes on the prize! Let us begin.',
        waitingLines: ['Observing every keystroke.', 'My mustache senses progress.'],
        closeLines: ['The ledge is vibrating with anticipation!'],
        loseLine: 'A momentary setback. Re-strategize!',
        winLine: 'Spectacular achievement! A feast well earned.',
        stageLines: {
          stage1: ["Stationed in the street box. I have my eyes on you!", "Commence operation."],
          stage2: ["Perched near the garden. Splendid vantage point.", "Keep up the momentum."],
          stage3: ["The cushion is impeccably padded.", "Comfort level: maximum."],
          stage4: ["A playful distraction! Focus remains sharp.", "Almost at the goal."],
          stage5: ["Magnificent feast unlocked! Mission accomplished.", "Splendid work, human."],
        },
      },
    },
  },

  // 7. PEPPER (Dalmatian Polka-Dot Cat with Ring Tail — Top 4th in ref)
  {
    id: 'pepper',
    name: 'Pepper',
    type: 'POLKADOT',
    personality: 'Playful / bubbly / spotty sweetheart',
    pricePurr: 200,
    config: {
      palette: {
        body: '#FFFDF9',
        belly: '#FFFDF9',
        ink: sharedInk,
        markings: '#26201D',
        eyes: '#26201D',
        eyeGlint: '#FFFDF9',
        nose: '#26201D',
        patch: '#F4978E', // Blush cheeks
      },
      structure: {
        ears: 'combForehead',
        tailPath: 'ringLoop',
        eyeShape: 'dotWide',
        bodyLength: 1,
        headSize: 1,
        postureDefault: 'polkaDots',
      },
      motion: { overshootMul: 1.25, stepFreq: 1.2, pauseBias: 0.6 },
      quirks: {
        chosenLine: 'Every dot on my fur is cheering for you!!',
        waitingLines: ['Counting my spots while you work!', 'Wiggle wiggle! You can do it!'],
        closeLines: ['My ring tail is spinning with joy!'],
        loseLine: 'Aww pouts... but next time for sure!',
        winLine: 'YAAAAY!! Pepper party time!!',
        stageLines: {
          stage1: ["Spotty cat in a cozy box! Let's get started!!", "Yay! Let's go!"],
          stage2: ["Garden vibes are 10/10!! Spots are sparkling!", "Look at the flowers!"],
          stage3: ["Plush cushion cuddle time! So soft!!", "Bouncing on the cushion!"],
          stage4: ["Playing with my toy!! Jingle jingle!", "Final sprint time!"],
          stage5: ["SNACK EXPLOSION!! BEST DAY EVER!!", "Pepper dances with joy!"],
        },
      },
    },
  },

  // 8. YUKI (Expressive White Sketch Cat with Alert Lines — Bottom Left in ref)
  {
    id: 'yuki',
    name: 'Yuki',
    type: 'SKETCH',
    personality: 'Energetic / expressive / playful ghost',
    pricePurr: 250,
    config: {
      palette: {
        body: '#FFFDF9',
        belly: '#FFFDF9',
        ink: sharedInk,
        markings: '#26201D',
        eyes: '#26201D',
        eyeGlint: '#FFFDF9',
        nose: '#26201D',
      },
      structure: {
        ears: 'alertPointy',
        tailPath: 'hookRight',
        eyeShape: 'dotWide',
        bodyLength: 1,
        headSize: 1,
        postureDefault: 'wLegs',
      },
      motion: { overshootMul: 1.3, stepFreq: 1.25, pauseBias: 0.5 },
      quirks: {
        chosenLine: 'ALERT! Commitment registered! Engage!',
        waitingLines: ['Sparks of creativity incoming!', 'Tail is hooked and ready!'],
        closeLines: ['Maximum energy surge! Finish strong!'],
        loseLine: 'Whoosh... scattered into the wind.',
        winLine: 'BAM! Target destroyed! Delicious victory!',
        stageLines: {
          stage1: ["Box radar online! Antenna ears listening!", "Type fast, human!"],
          stage2: ["Garden breeze detected! Energy rising!", "Moving with the wind!"],
          stage3: ["Landing on the soft cushion pad! Ahhh yeah!", "Comfort recharge active!"],
          stage4: ["Pouncing on the toy! Zoom zoom!", "Finish line locked in!"],
          stage5: ["FEAST VICTORY CONFIRMED! High paws!!", "We crushed the deadline!"],
        },
      },
    },
  },
];

export const FREE_CAT_IDS: readonly CatId[] = CAT_SEED.filter(c => c.pricePurr === 0).map(c => c.id);

export function catById(id: string): CatSeed | undefined {
  return CAT_SEED.find(c => c.id === id);
}

export function isFreeCat(id: string): boolean {
  return (catById(id)?.pricePurr ?? 1) === 0;
}

export const CONSEQUENCE_TYPE_BY_LABEL: Record<string, ConsequenceType> = {
  meals: 'MEALS',
  dryFood: 'DRY_FOOD',
  vetCare: 'VET_CARE',
};
