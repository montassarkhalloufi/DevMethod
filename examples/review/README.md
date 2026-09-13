# Fictional review example

This is a demonstration of the review format and viewer, not a review of a real product. It is separate from the Lisière video pilot.

- [review.json](review.json) owns the illustrative results.
- [REVIEW.md](REVIEW.md) is generated from that JSON.
- [review-demo.html](review-demo.html) is the same standalone interactive viewer. Download it to open locally; GitHub's file page displays source.
- [Step-by-step guide](../../docs/REVIEW-GUIDE.md) explains filters, evidence, coverage, sources and exports.

```sh
npx --yes devmethod-ai@0.3.1 review --demo --output review-demo.html --open
```

Choose a fresh output path. This works from the distributed package without this source checkout. The packaged generated HTML is illustrative; your real results belong in your own mission's review record.
