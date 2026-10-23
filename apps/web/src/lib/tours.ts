import { HONOR_STARTER_BONUS, HONOR_STARTER_COUNT, HONOR_STARTER_STAKE, PURR_WELCOME } from '@purrpose/shared';
import type { TourStep } from '../components/Tour.js';
import { num, t } from '../i18n/index.js';

/** Every screen's guided tour, written for someone who has never seen the app. */

export function homeTour(): TourStep[] {
  return [
    {
      title: t('Welcome to Purrpose'),
      body: t('A quick look around, about a minute. Skip it any time — you can bring it back from Settings.'),
    },
    {
      target: '[data-tour="home-wallet"]',
      title: t('Your pantry and your PURR'),
      body: t('Pantry is real cat food you can put on the line in strict pacts. PURR is the app’s coin: you stake it in “on my word” pacts, and spend it on new cats and toys. You start with {n} PURR.', { n: num(PURR_WELCOME) }),
    },
    {
      target: '[data-tour="hub-pacts"]',
      title: t('Make a commitment'),
      body: t('The heart of Purrpose. Pick a task and a deadline, put something on the line, and a cat waits with you — getting hungrier as the deadline gets close.'),
    },
    {
      target: '[data-tour="hub-focus"]',
      title: t('Focus Room'),
      body: t('A quiet room for deep work: start the timer and your cat curls up beside you. Press and hold any room to read what it’s for.'),
    },
    {
      target: '[data-tour="hub-detective"]',
      title: t('Detective Cheat'),
      body: t('For quitting a habit. You confess every slip to the detective, and each slip locks part of what you staked.'),
    },
    {
      target: '.nav-new',
      title: t('The + button'),
      body: t('The quickest way to a new pact, from any screen.'),
    },
    {
      target: '[data-tour="nav"]',
      title: t('Shop, Pantry, Impact'),
      body: t('Shop: new cats and toys for PURR. Pantry: your food and what’s on the line. Impact: everything you kept or lost, and the meals that went to real cats.'),
    },
    {
      target: '[data-tour="home-settings"]',
      title: t('Settings'),
      body: t('Language, reminders, and this guide whenever you want it again.'),
    },
  ];
}

export function newPactTour(mode: 'STRICT' | 'HONOR' | null): TourStep[] {
  return [
    {
      target: '[data-tour="pact-mode"]',
      title: t('Strict or on your word'),
      body:
        mode === 'STRICT'
          ? t('This is a strict pact: real food on the line and a proof at the end. Tap “change” to switch.')
          : t('This pact is on your word: PURR on the line, and your “I did it” is enough. Tap “change” to switch.'),
    },
    {
      target: '[data-tour="pact-cat"]',
      title: t('Your opponent'),
      body: t('The cat you’re up against. Each one has its own mood and lines. Locked cats can be unlocked with PURR in the shop.'),
    },
    {
      target: '[data-tour="pact-task"]',
      title: t('The promise'),
      body: t('Write it so there’s no doubt when it’s done: “Send the report”, not “work on the report”.'),
    },
    {
      target: '[data-tour="pact-deadline"]',
      title: t('The deadline'),
      body: t('If it comes and you haven’t said you’re done, the cat wins.'),
    },
    {
      target: '[data-tour="pact-stake"]',
      title: t('What’s on the line'),
      body:
        mode === 'STRICT'
          ? t('Real food from your pantry. Keep the pact and it stays yours; miss it and it goes to a shelter.')
          : t('PURR. Your first {n} pacts are {stake} PURR each, and every one you keep pays +{bonus}. Keep all three and you can get a new cat.', {
              n: num(HONOR_STARTER_COUNT),
              stake: num(HONOR_STARTER_STAKE),
              bonus: num(HONOR_STARTER_BONUS),
            }),
    },
    {
      target: '[data-tour="pact-witness"]',
      title: t('A witness (optional)'),
      body: t('A friend who checks your proof. Their email has to be different from yours. You’ll get a link to send them.'),
    },
    {
      target: '[data-tour="pact-seal"]',
      title: t('Seal it'),
      body: t('After sealing you have 5 minutes to take it back. After that, it’s on.'),
    },
  ];
}

export function pactTour(mode: 'STRICT' | 'HONOR', proofRequired: boolean): TourStep[] {
  return [
    {
      target: '[data-tour="pact-chips"]',
      title: t('At a glance'),
      body: t('The deadline, what’s on the line and how much time is left. The Focus Room chip opens a timer tied to this pact.'),
    },
    {
      target: '[data-tour="pact-scene"]',
      title: t('Your cat’s day'),
      body: t('The cat lives through your deadline: relaxed at first, hungrier as time runs out, eyeing the food at the end. Tap it — it reacts.'),
    },
    {
      target: '[data-tour="pact-stages"]',
      title: t('The bar at the bottom'),
      body: t('Where the cat is on its way up: Box → Yard → Cozy Room → Cat Tree → Grand Feast. It moves up as time passes, and the next move has a countdown. The feast is the last stop — that’s when your stake is in danger.'),
    },
    {
      target: '[data-tour="pact-witness-link"]',
      title: t('Your witness'),
      body: t('Send them the link now, so they’re ready to check your proof.'),
    },
    {
      target: '[data-tour="pact-did-it"]',
      title: t('I did it'),
      body:
        mode === 'HONOR' || !proofRequired
          ? t('Tap it when it’s done. Your word counts — the stake is yours again.')
          : t('Tap it when it’s done and send a short proof. Your witness (or our team) checks it. No answer within 48 hours means it counts.'),
    },
  ];
}

export function pactsTour(): TourStep[] {
  return [
    {
      target: '[data-tour="pacts-summary"]',
      title: t('Your pacts'),
      body: t('How many are running, how much food is on the line, and what’s left in the pantry.'),
    },
    {
      target: '.featured-scene',
      title: t('The most urgent one'),
      body: t('The pact closest to its deadline gets the big stage. Tap its title to open it.'),
    },
    {
      target: '.stage-path',
      title: t('The cat’s way up'),
      body: t('Box → Yard → Cozy Room → Cat Tree → Grand Feast. The cat moves up as the deadline gets near.'),
    },
  ];
}

export function pantryTour(): TourStep[] {
  return [
    {
      target: '[data-tour="pantry-supplies"]',
      title: t('Your food'),
      body: t('Real cat food you own: meals, dry food and vet care. Strict pacts lock some of it until you keep them. Food you lose goes to cats at a shelter.'),
    },
  ];
}

export function shopTour(): TourStep[] {
  return [
    {
      target: '.shop-balance',
      title: t('Your PURR'),
      body: t('What you can spend. PURR locked in an open “on my word” pact can’t be spent until that pact ends.'),
    },
    {
      target: '.shop-menu',
      title: t('What’s in the shop'),
      body: t('New cats to make pacts with, toys and outfits for them, and more PURR.'),
    },
  ];
}

export function impactTour(): TourStep[] {
  return [
    {
      target: '[data-tour="impact-totals"]',
      title: t('What your pacts did'),
      body: t('Pacts you kept, pacts the cat won, and how much food went to real cats because of them.'),
    },
    {
      target: '[data-tour="impact-filters"]',
      title: t('The full history'),
      body: t('Filter to see only what the cats ate, or only what you added to the pantry.'),
    },
  ];
}

export function focusTour(): TourStep[] {
  return [
    {
      target: '[data-tour="focus-scene"]',
      title: t('Focus Room'),
      body: t('A calm room for one thing at a time. Rain on the window, a lamp, your cat on its cushion.'),
    },
    {
      target: '[data-tour="focus-controls"]',
      title: t('The timer'),
      body: t('Start it and work; the cat curls up and sleeps while you do. Link a pact below so the minutes count toward it.'),
    },
  ];
}

export function detectiveTour(): TourStep[] {
  return [
    {
      target: '.room-stage',
      title: t('The interrogation room'),
      body: t('The detective cat watches your case. Slipped? Press the red button and confess — twice, so it’s on purpose.'),
    },
    {
      target: '[data-tour="detective-locker"]',
      title: t('The evidence locker'),
      body: t('What you staked, how much each slip locks, and how many slips you have left before the case closes.'),
    },
  ];
}
