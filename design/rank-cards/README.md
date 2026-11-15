# Rank cards: design references

`refs/catN.png` is rank N's cat exactly as the app draws it; `refs/cardN.png` is the in-app
card layout for that rank (apps/web/src/components/RankCard.tsx). They are fed to an image
model as references when making illustrated versions of the cards.

`scenes/sceneN.jpg`: the illustration for rank N (Higgsfield, GPT Image 2.6), used as a reference for the full 4:5 cards.
