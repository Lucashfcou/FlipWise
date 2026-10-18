# Product lens (round 4)
Score: 6/10 | Vote: FUND IF

Lens: focus by saying no, start from the experience, own the whole experience, craft, one-sentence simplicity. Scores the business, not the founder.

## Does the vote change vs round 3 (score 6)? Why
Score stays 6; vote stays FUND IF. Gains and losses cancel.

Gains:
- Real data layer: 247 products, official eBay API, cleaning pipeline.
- Honest "no data" instead of a doubtful number. This is the craft-in-unseen-parts signal.
- Simple decision output (Buy / Negotiate / Pass) is a clear core moment.

Losses and caps:
- Scope grew (10 categories, lots, fiscal, listing generator, CSV, print reading, AI search) while zero real users exist. Focus is eroding, not improving.
- The core promise "what will it sell for" still rests on asked prices, not sold prices. The experience is a good-looking number with an unproven link to the outcome.
- The product still has no second user and no recorded sale. Nothing proves the output helps.

Score would rise only on evidence from other resellers, not on more features.

## Is there a future in the paid plan? The hook, and the main risk
Future: conditional, yes. The paid items are not equal.

- Candidate hook: "Snap the listing, know the max offer in seconds, while standing in the fair or chatting on a marketplace." The moment of use is time-pressured and at the point of purchase. Print reading + any-product AI search serve exactly that moment. Cross-country comparison and alerts serve a different moment (sourcing), a second product.
- One-sentence pitch test: "Screenshot a listing, get the most you should pay." That passes. "Print + AI search + cross-country + alerts + more categories + exports" fails.
- Main risk: the hook is the least proven piece. Print reading is a proof of concept, never measured on real prints. AI-search prices are explicitly "unreliable". Charging for the least reliable output breaks trust at the moment of payment.
- Second risk: the value rests on asked-price data. If buyers learn it is not sold prices and it misses, the paid layer sells a guess.
- Third risk: free tier may already deliver the daily job (look up a model, get a range), leaving the paid hook as a convenience, not a need. Willingness to pay is an open question.
- Open questions (unknown, not estimated): how many resellers in the target market, whether they pay, acquisition cost, print-reading accuracy, eBay commercial-use terms.

## Free vs paid: what to put where, and what is missing from the paid tier
Free (the habit and the proof):
- Catalog with prices, evaluate item, decision, max offer.
- Basic stock and profit tracking, "was the app right?", basic fiscal view.
- Lots: keep free if it is the reason people open the app; otherwise move to paid.

Paid (the speed and the reach):
- Print reading, AI search for products outside the catalog, alerts, cross-country comparison, extra exports.

Missing from the paid tier (candidates, to test, not to build yet):
1. Trust layer: for each AI-read or AI-searched price, show a visible confidence label and the sources behind it. Paid should feel safer, not riskier.
2. Personal calibration: the app learns from the user's own recorded sales and adjusts the discount and max offer. This is the one thing a free catalog cannot copy and it grows with use. Depends on users logging sales.
3. Watchlist with threshold alerts on a specific model ("tell me when X is below Y"): converts occasional use to daily use.
4. Margin and tax-aware output (DAC7 tracking is already built): worth paid only if resellers actually care. Unvalidated.

Cut or defer: more categories for their own sake, extra exports, listing generator as a headline feature. Each is a seam, not the hook.

Billing note: accounts, server and payments do not exist. Do not build them before demand evidence (see actions).

## The 3 defects that remain
1. No outside user. The whole experience was designed with the founder as the only customer. Taste is unverified.
2. The central promise (what it will sell for) is not backed by sold prices or by a recorded outcome. The output is polished, the foundation is soft.
3. Scope outrunning focus: many surfaces, no single moment proven to be brilliant. The paid hook (print reading) is also unmeasured on real prints.

## Next 3 actions, in order
1. Measure print reading on a set of real listing prints (varied apps, screenshots, languages) against the correct values. Decide the hook only after the number exists. Stop adding features meanwhile.
2. Put the app in front of a small group of real resellers doing real purchases, with no founder in the room. Observe the first five minutes and what they do next.
3. Record outcomes: for each evaluated item, capture the buy, the sale and the gap to the prediction. Use it to publish an honest accuracy figure and to feed personal calibration.

Only after 1-3: check eBay commercial-use terms, then build accounts and payments.

## First thing to validate with real users, and the continue/stop criterion
Validate: does the single moment "evaluate a listing, get a max offer" change a real purchase decision for someone who is not the founder?

Method (to be set by the founder, thresholds below are proposals, not market facts):
- Recruit a small cohort of active resellers. Have them use it on live buying for a few weeks.
- Measure: repeat use unprompted; decisions changed; predicted vs actual sale gap; whether they ask for print reading unprompted.
- Then show the paid offer (waitlist or pre-sale at a real price) to test willingness to pay before building billing.

Continue if: a clear minority of the cohort comes back unprompted for the evaluate moment, the predicted-vs-sold gap is within a tolerance they judge acceptable, and some commit to pay at a real price. Stop or pivot if: users admit the number does not change what they buy, or the gap to real sale prices is too wide for them to trust it, or nobody commits to pay. The founder should fix the exact numbers before starting, so results cannot be rationalised afterward.

## Conditions
- Freeze new features until print-reading accuracy is measured and at least a small outside cohort has used it.
- Do not charge for AI outputs labelled unreliable. Gate paid on the trust layer.
- Publish what the numbers are: asked-price-based estimates, not sales, until real sold data exists.
- Confirm eBay API terms for commercial use before any paid launch.
- No accounts, server or payments before a pre-sale or waitlist shows intent.
- Fiscal and tax claims need confirmation by an accountant before being marketed.
