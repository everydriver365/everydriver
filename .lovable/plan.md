

## Investigation Result: All 700 Questions Are Already Available

After reviewing the codebase, the theory mock test **already uses all 700 questions**:

- `src/data/theoryQuestions.ts` contains ~100 base questions (ids 1–100)
- `src/data/theoryQuestionsExtra.ts` contains 600 additional questions (ids 101–700)
- They are merged on line 1282: `export const theoryQuestions = [...baseQuestions, ...theoryQuestionsExtra]`
- The `TheoryMockTest` component shuffles the full pool and selects 50 random questions per test

Each time a pupil starts a mock test, 50 questions are randomly drawn from the full 700-question bank — meaning every test is different.

### What Might Look Like "Only 10 Questions"

If you're seeing fewer questions on-screen, it could be:
1. **The intro screen** — it shows stats before the test starts, not the questions themselves
2. **You finished early** or the test was interrupted
3. **A different component** — the `TheoryProgressChart` shows only the last 10 *attempts* (not questions)

### No Code Changes Needed

The full 700-question bank is already wired up and working. No changes are required.

