# Product lens (round 3)
Score: 6/10 | Vote: FUND IF

Lens applied: focus, experience-first, whole experience, craft, one-sentence simplicity. The business is scored, not the founder.

## Does the vote change given the eBay scenario? (and why)
Partly. The vote stays FUND IF, but the reason changes.

- Before: the core promise ("what is this worth, what do I pay max") rested on example prices. The experience was hollow.
- With eBay active listings across several European markets, the promise can be backed by real data for the first time. That removes the biggest hole in the first five minutes.
- It does not fix the central gap. Active listings are asking prices, not sold prices. A flat ~10% discount is an assumption, not a measurement. The number on screen looks precise but is soft.
- It pulls the product toward "cover all electronics" (consoles, phones, laptops, tablets). That conflicts with focus. Breadth with soft numbers is worse than a few categories with trusted numbers.
- The reseller buys on Vinted/OLX/Wallapop and sells there. eBay is a proxy market, not the buyer's real market. Whether eBay asks track Portuguese Vinted/OLX paid prices is unknown.

Net: the scenario moves the product from "demo" to "testable". The vote moves up only if the main number is shown honestly as an estimate with its basis.

## The 3 defects that remain
1. The main number is not earned. Price = eBay ask minus ~10%, with no sold-price check. The confidence label must reflect this (few listings, wide spread, other market, no sold data), or the screen over-promises. Open question: how large is the gap between eBay asks and what Portuguese buyers pay?
2. Breadth over focus. Four categories (consoles, phones, laptops, tablets) plus lots, fiscal panel, ad generator, CSV, cleaning pipeline. Phones and laptops have variants (storage, RAM, battery, condition) that make standardization hard. The product risks being shallow everywhere.
3. The daily loop is weak. The moment of use is in front of a listing or in a fair, in seconds. Evaluate depends on typing or picking. Print reading by AI does not exist yet. Without a fast capture, it is a reference tool, not a habit. The "did the app get it right?" feature is the right idea, but it only works if the user logs sales, which is manual work.

## Product improvements (max 5, by impact)
1. Fast capture: print or link in, product and price out, under 10 seconds. This is the daily moment. (Build only after checking that AI reading is reliable enough; unknown.)
2. Honest confidence: show the basis on screen (number of listings, spread, markets used, "asking price, not sold"). Make low-confidence states say "not enough data" instead of a number.
3. Close the learning loop: make marking a sale one tap from stock, and show the "did it get it right?" score prominently. This builds the only proprietary data and the proof of value.
4. Narrow the launch scope: pick one or two categories where the catalog is clean (consoles, controllers, PS4 games) and make them excellent. Add phones only after the standardization works there.
5. Stock-to-money view: stuck stock, suggested price drops, cash tied up. This is a reason to open the app daily even when not buying.

What to cut or hide for now: lot evaluation, ad generator, CSV import and the cleaning pipeline UI from the main flow. Keep the fiscal panel as a quiet export, not a headline. They are not wrong, but they dilute the one sentence.

One sentence the product should pass: "Point at a listing, know the most you should pay, and learn from every sale." If the screen does not deliver that in the first five minutes, the rest does not matter.

## Pricing model: what is free, what is paid (hypotheses to test, no invented market numbers)
Principle: charge for the thing that makes or saves money, not for the screens.

- Free (hypothesis): limited number of evaluations per period, basic stock tracking, manual sale logging. This lets people reach the moment of value and starts the data loop.
- Paid (hypothesis): unlimited or fast capture (print/link), full confidence detail, stuck-stock suggestions, fiscal export, multi-category coverage.
- Models to compare, not decide:
  - Subscription: fits a daily-use reseller; risks churn if use is seasonal.
  - Per-query packs: fits occasional buyers and matches the real cost of data and AI calls; weaker recurring revenue.
  - Hybrid: free quota plus subscription for volume.
- Price points: the brief's 5 to 15 EUR per month is a hypothesis. Test what a reseller will pay against the money saved on one avoided bad purchase. Open question: how many bad purchases does a typical user avoid per month?
- Cost note: eBay API terms and AI reading carry a per-query cost. Check that the free tier cannot lose money. Open question: eBay API limits and licensing for a paid product.

## How to validate with less bias
- Recruit resellers who are not the founder, ideally 10 or more, from different categories and platforms. Do not recruit friends who want to be kind.
- Run a blind check: for past purchases, ask users to record the price paid and the sale price, then compare against what the app would have said. Judge by the data, not by opinion.
- Define success before the test: for example the share of evaluations within a set tolerance of the real sale, and the share of testers who open it unprompted in week 2. Set thresholds in advance.
- Test willingness to pay with a real ask (pre-sale, deposit, or a paywall on a limited beta), not with "would you pay?".
- Watch behavior, not comments: does the tester use it before buying, or after? Where do they stop?
- Compare against the tester's current method (own memory, Vinted search, spreadsheet) on the same items. The product must beat that, not beat nothing.
- Keep the founder's own sales out of the headline accuracy number, or report them separately.

## Conditions
1. Show eBay-derived numbers with an explicit basis and low confidence where data is thin. No false precision.
2. Measure the real gap between eBay asks and sold or paid prices on a sample before charging anyone. If the gap is large and unstable, the 10% rule must change or the category must be dropped.
3. Launch in one or two categories; add phones and laptops only after accuracy is shown there.
4. Ship fast capture (print or link) or accept that the product is a reference tool, and price it as one.
5. Run the external validation above, with thresholds set beforehand, before any paid launch.
6. Confirm eBay API terms allow a paid product, and confirm the Portuguese tax treatment with an accountant (both are open questions in the brief).
