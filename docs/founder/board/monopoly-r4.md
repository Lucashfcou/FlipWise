# Monopoly lens (round 4)
Score: 5/10 | Vote: FUND IF

## Does the vote change vs round 3 (score 4)? Why
Vote stays FUND IF. Score moves 4 to 5, only on engineering evidence.
- Up: the official eBay Browse API works. A cleaning pipeline exists (accessories, bundles, scams, IQR). 247 products in 10 categories. The app refuses to show a number when data is thin. CeX floor and ceiling add a second source. The paid-tier idea (print + AI search) now has a concrete shape and an estimated unit cost.
- Not up: the data is still asking prices from one marketplace (eBay.es), not sold prices. Anyone with the same API can rebuild it. No real user besides the founder, no sale logged, no hosting, no accounts, no payment. eBay commercial-use terms are unreviewed.
- Lens reading: the monopoly question is still open. The product is better, but nothing yet stops a copycat in month six.

## Is there a future in the paid plan? The hook, and the main risk
- Future: possible, narrow. A small market can be owned first: the individual reseller in Europe who buys on Vinted/OLX/Wallapop and needs a fast buy/pass number.
- Hook: print in, decision out, in seconds, on a platform the app is not allowed to read. This is the one step that is hard to copy cheaply and that the buyer feels at the moment of purchase. The "did the app get it right?" record is the second hook, because it compounds with use.
- Main risk: the hook is built on borrowed ground. (1) Print reading quality has never been measured on real prints. (2) The price behind the decision is eBay asking prices, which may not match Vinted/OLX sale prices. A fast wrong number is worse than a slow honest one. (3) eBay terms for a paid commercial product are unknown.
- Secondary risk: a general AI assistant can read a print and answer "what is this worth" with no catalog. The paid value must be the data and the personal history, not the reading itself.

## Free vs paid: what to put where, and what is missing from the paid tier
Free (the distribution engine, and the data seed):
- Large catalog with prices, basic stock, bundles, basic tax panel. Keep it good. It brings reach and trust.
- Logging a sale and the "did the app get it right?" check should be free. It is where the proprietary data starts, and charging for it starves the dataset.

Paid:
- Print reading and AI search for items outside the catalog (flagged as low reliability).
- Cross-country eBay comparison, alerts, extra categories, exports.

Missing from the paid tier (what makes it durable, not just convenient):
1. Personal accuracy score per user and per category (the app's past calls vs real sales). This is the part that cannot be copied.
2. Realized-sale price layer built from users' logged sales, shown next to asking prices. This is the long-run proprietary asset. Open question: how many logged sales per product before it beats asking prices.
3. Alerts tied to the user's own margin target and category, not generic price drops.
4. Price model: subscription fits a daily-use reseller. Per-query billing fits the AI cost but punishes the habit you want. Hypothesis to test: flat subscription with a fair-use cap on AI reads. All price points are open questions, to be tested with real users.

## The 3 defects that remain
1. No proof of price accuracy. Asking prices minus 10% is an assumption, not a measured relation to sale price, and one marketplace stands in for a European market.
2. No second user, no distribution path. Zero evidence of who pays or how the first 100 customers arrive and at what cost.
3. No defensible asset yet. The data is reproducible by anyone with the same API, and the print step is unmeasured. Add the unreviewed API terms as a legal gate on the whole plan.

## Next 3 actions, in order
1. Measure, do not build: run 50 to 100 real prints through the reader and compare against the founder's actual buys and sales. Also log the founder's own sales to calibrate the 10% discount per category.
2. Read the eBay API commercial terms and decide whether a paid product is allowed. If not, redesign before any payment work.
3. Put the free app online (hosting only, no accounts) and hand it to a small group of real resellers in one country and one category; add the sale-logging loop.

Do not build accounts, payments or more categories before 1 and 2.

## First thing to validate with real users, and the continue/stop criterion
Validate: do other resellers, in a real buying moment, trust and act on the number, and do they come back?
- Setup: 10 to 20 resellers from one narrow niche (for example PS4/console buyers in one country), using it on live purchases for 3 to 4 weeks. Not friends of the founder if avoidable.
- Continue if (thresholds are hypotheses, set before starting): a clear share of testers use it on real purchases more than once a week by week 3; the suggested price lands near their real sale price in most logged cases (the founder's earlier 7 of 10 bar, now across several people); and some testers say they would pay or accept a pre-order at a stated price.
- Stop or pivot if: usage falls after the first week, the numbers are repeatedly off against real sales, or nobody will commit money when asked. If accuracy fails, the paid plan has no hook.
- Open: what share counts as "clear", and what price to ask.

## Conditions
- Eliminate the eBay-terms uncertainty before charging anyone.
- Print-reading quality measured on real prints before it is sold as the hook.
- Price shown with its source and confidence, never as a firm value, until realized sales exist.
- Start logging real sales from day one; this is the only route to a proprietary dataset.
- Pick one narrow niche and one country to dominate first; widen only after retention is shown.
- No market-size or willingness-to-pay figures are assumed here; both are open questions.
