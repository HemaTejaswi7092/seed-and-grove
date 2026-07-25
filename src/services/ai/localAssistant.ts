import { detectSeedDomain } from "../../lib/seedDomain";
import type { Seed, SeedActivityItem, SeedEvidenceItem } from "../../types/seed";
import type { CopilotIntent, CopilotRequest, CopilotResponse } from "./types";

// ---------------------------------------------------------------------------
// Intent classification
// ---------------------------------------------------------------------------

const DEBUG_RE =
  /\b(error|exception|traceback|bug|stuck|not working|doesn'?t work|fails?|crash(es|ing)?|mismatch)\b/i;
const RESULT_RE =
  /(\d{1,3}(\.\d+)?)\s*%.*(\d{1,3}(\.\d+)?)\s*%|from\s+\d.*to\s+\d|\b(improved|increased|decreased)\b/i;
const DECISION_RE = /\b(chose|selected|decided|picked|went with|settled on)\b/i;
const CODE_RE = /\b(code|script|snippet|starter file|implementation)\b/i;
const PLAN_RE =
  /\b(project plan|create a plan|make a plan|roadmap|game plan|get started|where (do|should) i start|next step|outline the steps)\b/i;
const IDEAS_RE = /\bideas?\b|\bbrainstorm\b/i;
const EXPLAIN_RE =
  /\b(what is|what'?s|why (does|is|do)|how does|explain|purpose of|difference between|how do i (choose|pick|select|decide)|what does .* mean)\b/i;
const PROGRESS_RE =
  /\b(i|we) (finished|completed|did|implemented|built|wrote|added|fixed|started|worked on|working on)\b/i;

function classifyIntent(message: string): CopilotIntent {
  const text = message.trim();
  if (!text) return "general_question";

  if (DEBUG_RE.test(text)) return "asking_for_debugging";
  if (RESULT_RE.test(text)) return "reporting_result";
  if (DECISION_RE.test(text)) return "reporting_decision";
  if (CODE_RE.test(text)) return "asking_for_code";
  if (PLAN_RE.test(text)) return "asking_for_plan";
  if (IDEAS_RE.test(text)) return "asking_for_ideas";
  if (EXPLAIN_RE.test(text)) return "asking_for_explanation";
  if (PROGRESS_RE.test(text)) return "reporting_progress";
  return "general_question";
}

// ---------------------------------------------------------------------------
// Evidence / activity eligibility — decoupled from intent classification.
// Intent decides how we respond; this decides what (if anything) gets
// written to the Seed's record. See the product spec's "Evidence Capture
// Rules": only specific, supported claims become evidence.
// ---------------------------------------------------------------------------

const SPECIFICITY_RE = /\d|=|\bover\b|instead of|\bvs\.?\b|compared to/i;

function hasSpecificity(message: string): boolean {
  return SPECIFICITY_RE.test(message);
}

interface MetricChange {
  metric: string;
  before: string;
  after: string;
}

function extractMetricChange(message: string): MetricChange | null {
  const match = message.match(
    /(\d{1,3}(?:\.\d+)?)\s*%\s*(?:to|→|->)\s*(\d{1,3}(?:\.\d+)?)\s*%/i,
  );
  if (!match) return null;
  const metricMatch = message.match(/\b(accuracy|precision|recall|f1|score)\b/i);
  return {
    metric: metricMatch ? metricMatch[1].toLowerCase() : "result",
    before: match[1],
    after: match[2],
  };
}

// ---------------------------------------------------------------------------
// KNN knowledge base
// ---------------------------------------------------------------------------

interface KnnTopic {
  id: string;
  keywords: RegExp;
  explain: string;
}

const KNN_TOPICS: KnnTopic[] = [
  {
    id: "feature_scaling",
    keywords: /scal(e|ing)|normali[sz]e|standardi[sz]e/i,
    explain:
      "KNN classifies a point by looking at the distance to its nearest neighbors, so it's directly sensitive to the scale of each feature. If one feature ranges 0–1000 and another 0–1, the large-range feature will dominate the distance calculation even if it's not actually more informative. Standardizing (zero mean, unit variance) or min-max scaling puts every feature on comparable footing before you compute distances.",
  },
  {
    id: "choosing_k",
    keywords:
      /\bk\b.*\b(choose|choosing|select|value|best|optimal|pick)\b|\b(choose|choosing|select|value|best|optimal|pick)\b.*\bk\b/i,
    explain:
      "There's no formula for the 'right' k — you find it empirically. Try a range of odd values (odd avoids ties in binary classification), evaluate each with cross-validation rather than the test set, and plot accuracy vs. k. Small k (like 1) tends to overfit and is noisy; large k oversmooths and can underfit. A common starting range is k = 1 up to roughly the square root of your training set size, refined from there.",
  },
  {
    id: "distance_metrics",
    keywords: /distance metric|euclidean|manhattan|minkowski|cosine/i,
    explain:
      "Euclidean distance is the default and works well for continuous, similarly-scaled features. Manhattan distance is more robust to outliers in some cases. Cosine distance is better when the direction of the feature vector matters more than its magnitude (common in text/embedding data). Worth trying more than one if your first choice underperforms.",
  },
  {
    id: "cross_validation",
    keywords: /cross.?validation|k.?fold/i,
    explain:
      "Cross-validation splits your training data into k folds, trains on k-1 of them and validates on the remaining one, then rotates through all folds and averages the score. It gives a much more reliable estimate of how a given k (or any hyperparameter) will generalize than a single train/test split, especially on smaller datasets.",
  },
  {
    id: "confusion_matrix",
    keywords: /confusion matrix/i,
    explain:
      "A confusion matrix breaks predictions down by actual vs. predicted class, so you can see exactly which classes get mixed up rather than just an overall accuracy number. It's especially useful with imbalanced classes, where accuracy alone can be misleading.",
  },
  {
    id: "precision_recall_f1",
    keywords: /precision|recall|\bf1\b/i,
    explain:
      "Precision is: of everything you predicted as class X, how much was actually X. Recall is: of everything that's actually X, how much did you catch. F1 is their harmonic mean — useful when you need one number that balances both. These matter more than raw accuracy when classes are imbalanced or the cost of false positives vs. false negatives differs.",
  },
  {
    id: "overfitting",
    keywords: /overfit|underfit/i,
    explain:
      "In KNN, a very small k (like 1) tends to overfit — it memorizes noise in the training data and doesn't generalize. A very large k oversmooths and can underfit, ignoring real local structure. Cross-validation across a range of k values is how you find the balance.",
  },
  {
    id: "missing_values",
    keywords: /missing value|\bnull\b|\bnan\b|imputation/i,
    explain:
      "KNN can't compute a distance with missing values, so you need to handle them before fitting: drop rows/columns with too many gaps, or impute (mean/median for numeric, mode for categorical). Impute using statistics from the training set only, before scaling, to avoid leaking test-set information.",
  },
  {
    id: "train_test_split",
    keywords: /train.?test split|holdout/i,
    explain:
      "Split your data before doing anything else — 80/20 or 70/30 are common ratios. The test set should stay untouched until the very end so it gives an honest estimate of real-world performance. If you're also tuning k, use cross-validation within the training set rather than repeatedly checking against the test set.",
  },
  {
    id: "model_comparison",
    keywords: /logistic regression|decision tree|compare.*model|baseline model/i,
    explain:
      "A simple baseline (Logistic Regression, a Decision Tree) is worth training alongside KNN — it tells you whether KNN's extra distance computation is actually buying you anything, and gives you a sanity check on your pipeline independent of the model choice.",
  },
  {
    id: "streamlit_deployment",
    keywords: /streamlit|deploy/i,
    explain:
      "A minimal Streamlit app just needs a form for the input features, your trained (and pickled) model loaded once at startup, and a predict() call wired to a button. It's a fast way to turn a notebook model into something you can actually click through.",
  },
  {
    id: "datasets",
    keywords: /dataset|which data|what data/i,
    explain:
      "Iris is the classic starting dataset for KNN — small, clean, and multi-class, so you can focus on the pipeline rather than data cleaning. Once that's working end-to-end, moving to a slightly messier real-world dataset (missing values, more features) is a good next challenge.",
  },
  {
    id: "preprocessing",
    keywords: /preprocess/i,
    explain:
      "For KNN, preprocessing usually means: handle missing values, encode categorical features numerically, then scale everything — in that order. Because KNN is purely distance-based, this step matters more here than for tree-based models.",
  },
  {
    id: "knn_basics",
    keywords: /what is knn|k.?nearest neighbo(u)?rs?/i,
    explain:
      "KNN classifies a new point by looking at its k closest neighbors (by some distance metric) in the training data and taking a majority vote of their labels. It's simple, has no real 'training' step beyond storing the data, but prediction can get slow on large datasets and it's sensitive to feature scale and irrelevant features.",
  },
];

function matchKnnTopic(message: string): KnnTopic | null {
  return KNN_TOPICS.find((topic) => topic.keywords.test(message)) ?? null;
}

function isProjectOverviewRequest(message: string): boolean {
  return /\bthis (project|seed)\b|\bmy (project|seed)\b/i.test(message);
}

// ---------------------------------------------------------------------------
// KNN build-stage sequence — shared by the full plan and the "next step"
// responses so they never disagree with each other.
// ---------------------------------------------------------------------------

interface Stage {
  label: string;
  detail: string;
  keywords: RegExp;
}

const KNN_STAGES: Stage[] = [
  {
    label: "Explore the dataset",
    detail:
      "Look at feature distributions, class balance, and missing values.",
    keywords: /explor|distribution|class balance/i,
  },
  {
    label: "Handle missing values",
    detail: "Impute or drop missing values before scaling.",
    keywords: /missing value|imput|\bnan\b/i,
  },
  {
    label: "Scale features",
    detail:
      "Standardize or normalize features — KNN is distance-based, so scale matters a lot.",
    keywords: /scal(e|ing)|normali[sz]e|standardi[sz]e/i,
  },
  {
    label: "Train/test split",
    detail: "Hold out a test set you don't touch until the end.",
    keywords: /train.?test split|holdout/i,
  },
  {
    label: "Fit a baseline model",
    detail:
      "Start with a default k (e.g. 5) to get a working pipeline end-to-end.",
    keywords: /baseline/i,
  },
  {
    label: "Sweep k with cross-validation",
    detail:
      "Test a range of (usually odd) k values and pick the one with the best CV score.",
    keywords: /\bk\s*=\s*\d+|cross.?validation|sweep k/i,
  },
  {
    label: "Evaluate properly",
    detail:
      "Look at accuracy, precision/recall/F1, and a confusion matrix — not just accuracy.",
    keywords: /confusion matrix|precision|recall|\bf1\b|evaluat/i,
  },
  {
    label: "Compare against another model",
    detail:
      "Logistic Regression or a Decision Tree makes a good baseline to compare against.",
    keywords: /logistic regression|decision tree|compare/i,
  },
  {
    label: "Ship something visible",
    detail:
      "A small Streamlit app turns the model into something you can show and click through.",
    keywords: /streamlit|deploy/i,
  },
];

function currentStageIndex(
  activity: SeedActivityItem[],
  evidence: SeedEvidenceItem[],
): number {
  const text = [...activity.map((a) => a.content), ...evidence.map((e) => e.description)]
    .join(" ")
    .toLowerCase();
  let highest = -1;
  KNN_STAGES.forEach((stage, index) => {
    if (stage.keywords.test(text)) highest = index;
  });
  return highest + 1;
}

// ---------------------------------------------------------------------------
// Response builders — KNN domain
// ---------------------------------------------------------------------------

function knnIdeas(seed: Seed): string {
  return [
    `Since you're building "${seed.title}", here are a few useful directions:`,
    "",
    "1. Baseline classifier on the Iris (or a similarly clean tabular) dataset.",
    "2. Compare accuracy before and after feature scaling.",
    "3. Sweep k across a range and plot accuracy vs. k to find a sweet spot.",
    "4. Build a confusion matrix to see which classes get confused.",
    "5. Compare KNN against Logistic Regression or a Decision Tree.",
    "6. Wrap the trained model in a small Streamlit app for live predictions.",
    "",
    "For a beginner-friendly first version: data exploration → scaling → train/test split → sweep k → evaluate → simple app.",
    "",
    "Want me to turn this into a step-by-step plan, or help write the first Python file?",
  ].join("\n");
}

function knnPlanFull(seed: Seed): string {
  const lines = KNN_STAGES.map((s, i) => `${i + 1}. ${s.label} — ${s.detail}`);
  return [
    `Here's a practical build sequence for "${seed.title}":`,
    "",
    ...lines,
    "",
    "Want me to start with the first step, or jump to whichever one you're currently on?",
  ].join("\n");
}

function knnPlanNextStep(
  activity: SeedActivityItem[],
  evidence: SeedEvidenceItem[],
): string {
  const idx = currentStageIndex(activity, evidence);
  if (idx >= KNN_STAGES.length) {
    return "You've worked through the core pipeline already, as far as I can tell from what's logged. At this point I'd focus on polishing evaluation and writing up what you learned, or shipping the Streamlit app if you haven't yet.";
  }
  const stage = KNN_STAGES[idx];
  const basis = idx === 0 ? "Nothing's logged yet, so" : "Based on what's logged so far,";
  return [
    `${basis} the next step is: ${stage.label}.`,
    stage.detail,
    "",
    "Let me know once it's done and I'll help with what comes after.",
  ].join("\n");
}

function knnExplanation(message: string, seed: Seed): string {
  if (isProjectOverviewRequest(message)) return projectOverview(seed);
  const topic = matchKnnTopic(message);
  if (!topic) {
    return [
      "I don't have a specific answer mapped for that exact phrasing yet.",
      "I can explain: feature scaling, choosing k, distance metrics, cross-validation, train/test split, missing values, confusion matrix, precision/recall/F1, overfitting, model comparison, or Streamlit deployment.",
      "Which one would help most?",
    ].join("\n");
  }
  return [topic.explain, "", "Want a concrete example using your dataset?"].join("\n");
}

function knnStarterCode(): string {
  return [
    "Here's a starter pipeline you can build on:",
    "",
    "```python",
    "import pandas as pd",
    "from sklearn.model_selection import train_test_split, cross_val_score",
    "from sklearn.preprocessing import StandardScaler",
    "from sklearn.neighbors import KNeighborsClassifier",
    "from sklearn.metrics import accuracy_score, confusion_matrix, classification_report",
    "",
    "# 1. Load data",
    'df = pd.read_csv("your_dataset.csv")',
    'X = df.drop(columns=["target"])',
    'y = df["target"]',
    "",
    "# 2. Split before scaling to avoid leaking test data into the scaler",
    "X_train, X_test, y_train, y_test = train_test_split(",
    "    X, y, test_size=0.2, random_state=42, stratify=y",
    ")",
    "",
    "# 3. Scale features (KNN is distance-based, so this matters)",
    "scaler = StandardScaler()",
    "X_train_scaled = scaler.fit_transform(X_train)",
    "X_test_scaled = scaler.transform(X_test)",
    "",
    "# 4. Fit a baseline model, then sweep k with cross-validation",
    "best_k, best_score = None, -1",
    "for k in range(1, 26, 2):",
    "    model = KNeighborsClassifier(n_neighbors=k)",
    "    score = cross_val_score(model, X_train_scaled, y_train, cv=5).mean()",
    "    if score > best_score:",
    "        best_k, best_score = k, score",
    "",
    'print(f"Best k: {best_k} (CV accuracy: {best_score:.3f})")',
    "",
    "# 5. Evaluate on the held-out test set",
    "final_model = KNeighborsClassifier(n_neighbors=best_k)",
    "final_model.fit(X_train_scaled, y_train)",
    "preds = final_model.predict(X_test_scaled)",
    "",
    'print("Accuracy:", accuracy_score(y_test, preds))',
    "print(confusion_matrix(y_test, preds))",
    "print(classification_report(y_test, preds))",
    "```",
    "",
    "Swap in your actual dataset path and target column. Want me to adjust this for a specific dataset you're using?",
  ].join("\n");
}

function projectOverview(seed: Seed): string {
  return [
    `"${seed.title}" — ${seed.description || "no description recorded yet."}`,
    `Status: ${seed.status}. Progress: ${seed.progress}%.`,
    "",
    "Want me to suggest ideas, put together a build plan, or jump into a specific concept?",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Response builders — generic domain (any Seed that isn't KNN-flavored)
// ---------------------------------------------------------------------------

function genericIdeas(seed: Seed): string {
  return [
    `Here are some general directions for "${seed.title}":`,
    "",
    "1. Start with the smallest end-to-end slice that proves the core idea works.",
    "2. List the 2-3 riskiest technical unknowns and tackle those first.",
    "3. Sketch the main components/architecture before writing code.",
    '4. Write down what "done" looks like for a first version.',
    "",
    "Tell me more about what you're building and I can get more specific.",
  ].join("\n");
}

function genericPlanFull(seed: Seed): string {
  return [
    `Here's a general build sequence for "${seed.title}":`,
    "",
    "1. Define scope — what's the smallest version that's actually useful?",
    "2. Sketch the architecture — main pieces and how data flows between them.",
    "3. Build the core path end-to-end before polishing anything.",
    "4. Test it against real (or realistic) input.",
    "5. Polish and handle edge cases.",
    "6. Ship or demo it.",
    "",
    "Want me to start with scope, or do you already know what you're building first?",
  ].join("\n");
}

function genericExplanation(seed: Seed): string {
  return `I don't have a specific concept database for "${seed.title}" yet — tell me exactly what you'd like explained and I'll do my best with the context you give me.`;
}

function genericStarterCode(seed: Seed): string {
  return `I don't have a starter template for "${seed.title}" yet — tell me the language/framework you're using and what the first piece of functionality should do, and I'll draft something.`;
}

// ---------------------------------------------------------------------------
// Response builders — domain-agnostic (debugging, progress, results, decisions, general)
// ---------------------------------------------------------------------------

function debuggingResponse(isKnn: boolean): string {
  const hint = isKnn
    ? "A shape mismatch in KNN is usually one of: X_train and X_test having a different number of features, fitting on a 1D array where a 2D array (n_samples, n_features) is expected, or y having a different length than X."
    : null;
  return [
    "Let's dig into it — a couple things would help me pin it down:",
    "",
    "1. The full error message and traceback.",
    "2. Any relevant shapes/types of the data involved.",
    "3. The code around where it's failing.",
    hint ? "" : null,
    hint,
    "",
    "Paste what you've got and I'll help trace it.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function progressResponse(): string {
  return [
    "Nice — logged that as activity.",
    "To turn this into evidence, it helps to know the effect: did accuracy or another metric change? A quick before/after comparison (same split, with vs. without this change) would tell you.",
    "",
    "Want to run that comparison next, or move on to the next step?",
  ].join("\n");
}

function resultResponse(message: string): CopilotResponse {
  const change = extractMetricChange(message);
  const causeNote = /scal(e|ing)|normali[sz]e|standardi[sz]e/i.test(message)
    ? "That makes sense — KNN is purely distance-based, so putting features on the same scale stops any single large-range feature from dominating the distance calculation."
    : /\bk\s*=\s*\d+|cross.?validation/i.test(message)
      ? "Good — tuning k, ideally with cross-validation rather than the test set, is usually where KNN gains the most."
      : "Worth noting what specifically changed, so you know what to credit if you revisit this later.";

  const content = [
    change
      ? `That's a solid, measurable improvement (${change.metric} ${change.before}% → ${change.after}%).`
      : "That's a solid result worth recording.",
    causeNote,
    "I've logged this as evidence for your Seed.",
    "",
    "Want to check this against a different k, or compare it with another model next?",
  ].join("\n");

  return {
    content,
    intent: "reporting_result",
    evidenceSuggestion: {
      category: change ? capitalize(change.metric) : "Result",
      title: change
        ? `${capitalize(change.metric)} improved to ${change.after}%`
        : "Reported measurable result",
      description: message.trim(),
    },
  };
}

function decisionResponse(message: string): CopilotResponse {
  if (!hasSpecificity(message)) {
    return {
      content:
        "Got it — what specifically did you decide, and what made you choose it over the alternative? A bit more detail (the parameter/value and the reason) is what makes this worth recording as evidence.",
      intent: "reporting_decision",
    };
  }
  return {
    content: [
      "Good call — that's the kind of documented decision worth having on record.",
      "I've logged this as evidence for your Seed.",
      "",
      "Want to note the reasoning behind it too, in case you revisit this later?",
    ].join("\n"),
    intent: "reporting_decision",
    evidenceSuggestion: {
      category: "Decision",
      title: "Design decision recorded",
      description: message.trim(),
    },
  };
}

function generalResponse(seed: Seed): string {
  return [
    `I'm here to help you build "${seed.title}". I can suggest ideas, put together a plan, explain a concept, write starter code, or help debug something.`,
    "",
    "What would be most useful right now?",
  ].join("\n");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateLocalResponse(
  request: CopilotRequest,
): Promise<CopilotResponse> {
  const { seed, message, activity, evidence } = request;
  const domain = detectSeedDomain(seed);
  const isKnn = domain === "knn";
  const intent = classifyIntent(message);

  // A small artificial delay so the typing indicator reads as genuine
  // rather than instant — not a claim that real inference is happening.
  await wait(400 + Math.random() * 400);

  switch (intent) {
    case "asking_for_ideas":
      return { content: isKnn ? knnIdeas(seed) : genericIdeas(seed), intent };
    case "asking_for_plan": {
      const isNextStepPhrasing = /\bnext step\b/i.test(message);
      if (isKnn) {
        return {
          content: isNextStepPhrasing
            ? knnPlanNextStep(activity, evidence)
            : knnPlanFull(seed),
          intent,
        };
      }
      return { content: genericPlanFull(seed), intent };
    }
    case "asking_for_explanation":
      return {
        content: isKnn ? knnExplanation(message, seed) : genericExplanation(seed),
        intent,
      };
    case "asking_for_code":
      return {
        content: isKnn ? knnStarterCode() : genericStarterCode(seed),
        intent,
      };
    case "asking_for_debugging":
      return { content: debuggingResponse(isKnn), intent };
    case "reporting_result":
      return resultResponse(message);
    case "reporting_decision":
      return decisionResponse(message);
    case "reporting_progress":
      return { content: progressResponse(), intent, activityContent: message.trim() };
    case "general_question":
    default:
      return { content: generalResponse(seed), intent };
  }
}
