# Research relevant to human control and context continuity

Consulted on **2026-09-16** through live web search and the primary publications below. This is a bounded research note, not a systematic review. Five publications are retained. Study results belong to their original populations, tasks and tool versions. None evaluates DevMethod. All DevMethod hypotheses and human comparisons below are **proposed, not tried**; this research ran no model, recruited nobody and collected no new human measurements.

## 1. Control must be understandable and correctable

**Source:** Amershi et al., *Guidelines for Human-AI Interaction*, CHI **2019-05-04–09**. [Author paper hosted by Microsoft Research](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf).

**Observed evidence:** The authors synthesized guidelines and iteratively evaluated them, including 49 design practitioners assessing 20 AI products. They recommend clear capabilities, contextual information, efficient correction, appropriate limits under uncertainty, recent-interaction memory and visible consequences of actions. This validates guideline relevance and clarity, not a causal productivity gain from a particular interface.

**DevMethod hypothesis:** Separating structural delegation, visual reservation and version adoption could reduce unwanted implementation while permitting useful autonomy. A visible approval should identify exactly which artifact it covers. The current backend records visual approval against a selected design ID; it does not infer revocation from later conversation, and has no dedicated visual-reopening operation. A layout preference must therefore not be treated as final aesthetic approval.

**Human falsifier:** Compare explicit reservation controls with ordinary conversation that can state the same reservations. Ask real participants to revise a visual preference during work. Measure unauthorized progression, successful correction, understanding of what is approved, and interruption cost. Equal or worse control with greater effort rejects the claimed advantage. Testing a reopening control requires implementing it first.

## 2. Make the context supplied to the assistant inspectable

**Source:** Barke, James and Polikarpova, *Grounded Copilot*, preprint **2022-06-30**, inspected revision **2022-10-31**. [Author paper, especially sections 3 and 6](https://arxiv.org/html/2206.15000v3).

**Observed evidence:** A qualitative study observed 20 programmers across four languages, with training and approximately 20–40-minute core tasks. It identified acceleration and exploration interaction modes. Participants were sometimes uncertain about which context influenced suggestions; some wanted more explicit control. Comparing alternatives also imposed interpretation costs. This is grounded qualitative evidence, not a randomized demonstration that a context pane improves performance.

**DevMethod hypothesis:** An inspectable packet containing intention, references, selected visual, decisions and revision can make omissions easier to correct and support an interruption/restart. This is an inference beyond the paper: persistent artifact-based context was not experimentally validated there. The current job context and immutable revisions provide a mechanism to test, not proof of benefit.

**Human falsifier:** After equivalent real-project interruptions, compare ordinary chat plus maintained notes with Studio’s artifact-linked context. Measure time to reconstruct the current intention, omitted constraints, mistaken revision/visual references and work repeated. Count time spent preparing both sets of context. No reduction at comparable total effort rejects the continuity advantage.

## 3. Preserve the possibility that lightweight assistance is already sufficient

**Source:** Peng et al., *The Impact of AI on Developer Productivity: Evidence from GitHub Copilot*, **2023-02-13**. [Author paper, sections Study Design and Results](https://arxiv.org/pdf/2302.06590).

**Observed evidence:** In May–June 2022, 95 professional programmers recruited through Upwork were randomized to Copilot access or control while implementing a JavaScript HTTP server. Completion used repository timestamps and 12 supplied checks. Among completers, the reported mean time reduction was 55.8% (71.17 versus 160.89 minutes). The standardized task and completion-conditioned estimate do not establish gains for long-term product decisions, maintainability, or current agents. Product-affiliated authors also warrant independent replication.

**DevMethod hypothesis:** Guidance should be proportional. Explicitly delegated, already-understood work should proceed without repeated framing demands; otherwise Studio may consume gains available through ordinary assistance.

**Human falsifier:** On small, well-understood changes, compare Studio’s delegated path with the same assistant, editor, Git and tests. Include configuration, context preparation, verification and correction time. If the method adds time without improving acceptance or preventing relevant errors, reject its advantage for that task class; do not hide this stratum inside a broader average.

## 4. Measure accepted work, not perceived speed or generated volume

**Source:** Becker et al., METR, *Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity*, released **2025-07-10**. [Primary paper](https://metr.org/Early_2025_AI_Experienced_OS_Devs_Study-paper.pdf).

**Observed evidence:** Sixteen developers completed 246 real tasks in mature repositories they knew well; tasks were randomized to AI allowed/disallowed. The main tools were early-2025 Cursor and Claude 3.5/3.7. Completion took 19% longer with AI, despite participants estimating a speedup afterward. Repository familiarity, participant selection and dated tools limit generalization. This is a historical result, not evidence that September 2026 agents slow everyone down.

**DevMethod hypothesis:** Retained decisions, revision-bound checks and visible source differences might reduce inspection and rework. They can also add overhead. Passing checks or producing more code alone cannot decide between these possibilities.

**Human falsifier:** Compare complete maintenance tasks on familiar projects, keeping acceptance and review standards fixed. Record active human time, waiting, review, repair, rejected changes and quality of the accepted result. If review and correction erase any production-time saving, reject the net-productivity claim. Keep participants’ perceived gains as a separate outcome.

## 5. Do not treat the historical negative result as a current universal verdict

**Source:** METR, *We are Changing our Developer Productivity Experiment Design*, **2026-02-24**. [Official research update](https://metr.org/blog/2026-02-24-uplift-update/).

**Observed evidence:** The follow-up recruited 10 original and 47 new developers. METR reports that participation and task selection increasingly depended on willingness to work without AI; concurrent agent work also complicated time reporting. Raw estimates moved toward speedup, but the authors judged their data an unreliable measure of the current effect. This update is a methodological report, not a confirmed universal reversal or a DevMethod experiment.

**DevMethod hypothesis:** Evaluate the human-plus-tool workflow against another competent AI-assisted workflow. Separate elapsed time, active human effort, concurrent work and accepted value; predefine task inclusion rather than selecting only attractive successes.

**Human falsifier:** Run a predeclared set of participants’ actual tasks with counterbalanced workflow order, recording exclusions, abandonment and concurrent activity. If an apparent benefit disappears when those cases and preparation costs are included, reject it. Report single-owner trials as such; they can reveal failures but cannot establish a population effect.

## Shared comparison contract for a future authorized human trial

The comparison unit is a person completing useful work with assistance. Both conditions receive the same available source facts, model access, references, ordinary development tools and quality requirements. The ordinary condition may ask questions, explore alternatives, keep good notes and use Git. It is neither weakened nor given a free, preconstructed DevMethod context packet: time to discover, clarify and maintain context belongs in each condition’s cost. A separate mechanism-isolation comparison may provide identical prepared context to both, but must then report only the interface/control effect.

Predefine useful acceptance, harmful divergence, active effort and elapsed-time measures; account for setup, operator help, review and repairs. Choose sample size and meaningful benefit margins before collecting results. Failure to detect an effect in a small trial is not proof of equivalence. Tests of gates, hashes, restart preservation and real HTTP behavior establish implementation properties; they do not establish human productivity, confidence calibration or a breakthrough in product creation.
