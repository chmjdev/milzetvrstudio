using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Milzet.Content {
public class RubricCriterion {
 public string id;
 public string label;
 public double weight;
 public string[] requiredActivities;
 public string[] requiredHotspots;
 public int minEvidenceCount;
 public int maxHints = int.MaxValue;
}

public class Rubric {
 public string id;
 public string title;
 public RubricCriterion[] criteria;
 public double passThreshold;

 public void Validate() {
  PackageReader.Require(!String.IsNullOrWhiteSpace(id) && Regex.IsMatch(id, "^[a-zA-Z0-9-]{1,80}$"), "Invalid rubric ID.");
  PackageReader.Require(!String.IsNullOrWhiteSpace(title) && title.Length <= 120, "Invalid rubric title.");
  PackageReader.Require(criteria != null && criteria.Length > 0 && criteria.Length <= 32, "Invalid criteria count.");
  PackageReader.Require(passThreshold >= 0 && passThreshold <= 100, "Invalid pass threshold.");
  var ids = new HashSet<string>();
  foreach (var c in criteria) {
   PackageReader.Require(c != null && !String.IsNullOrWhiteSpace(c.id) && Regex.IsMatch(c.id, "^[a-zA-Z0-9-]{1,80}$") && ids.Add(c.id), "Invalid criterion ID.");
   PackageReader.Require(!String.IsNullOrWhiteSpace(c.label) && c.label.Length <= 120, "Invalid criterion label.");
   PackageReader.Require(c.weight > 0 && c.weight <= 1000, "Invalid criterion weight.");
  }
 }
}

public class CriterionResult {
 public string criterionId;
 public string label;
 public bool met;
 public double score;
 public double maxScore;
 public List<string> missingActivities = new List<string>();
 public List<string> missingHotspots = new List<string>();
 public int evidenceCount;
 public int hintsUsed;
}

public class EvaluationResult {
 public string rubricId;
 public string rubricTitle;
 public double score;
 public double maxScore;
 public double percentage;
 public bool passed;
 public bool scenarioCompleted;
 public List<CriterionResult> criteriaResults = new List<CriterionResult>();
 public string evaluatedAt;
}

public static class AssessorEvaluator {
 public static EvaluationResult Evaluate(Rubric rubric, IEnumerable<Tuple<string, string, string>> eventLog) {
  rubric.Validate();
  var respondedActivities = new HashSet<string>();
  var selectedHotspots = new HashSet<string>();
  var hintsUsedByActivity = new Dictionary<string, int>();
  int evidenceCount = 0;
  bool completed = false;

  foreach (var ev in eventLog) {
   var type = ev.Item1;
   var id = ev.Item2;
   var detail = ev.Item3;
   if (type == "activity.responded" && !String.IsNullOrEmpty(id)) respondedActivities.Add(id);
   if (type == "hotspot.selected" && !String.IsNullOrEmpty(detail)) selectedHotspots.Add(detail);
   if (type == "evidence.requested") evidenceCount++;
   if (type == "hint.used" && !String.IsNullOrEmpty(id)) {
    int cur = hintsUsedByActivity.ContainsKey(id) ? hintsUsedByActivity[id] : 0;
    hintsUsedByActivity[id] = cur + 1;
   }
   if (type == "scenario.completed") completed = true;
  }

  double totalScore = 0;
  double maxScore = 0;
  var result = new EvaluationResult {
   rubricId = rubric.id,
   rubricTitle = rubric.title,
   scenarioCompleted = completed,
   evaluatedAt = DateTime.UtcNow.ToString("o")
  };

  foreach (var c in rubric.criteria) {
   maxScore += c.weight;
   var reqActs = c.requiredActivities ?? new string[0];
   var missingActs = reqActs.Where(a => !respondedActivities.Contains(a)).ToList();
   var reqSpots = c.requiredHotspots ?? new string[0];
   var missingSpots = reqSpots.Where(s => !selectedHotspots.Contains(s)).ToList();

   int totalHints = 0;
   foreach (var a in reqActs) {
    if (hintsUsedByActivity.ContainsKey(a)) totalHints += hintsUsedByActivity[a];
   }

   bool met = missingActs.Count == 0 && missingSpots.Count == 0 && evidenceCount >= c.minEvidenceCount && totalHints <= c.maxHints;
   double s = met ? c.weight : 0;
   totalScore += s;

   result.criteriaResults.Add(new CriterionResult {
    criterionId = c.id,
    label = c.label,
    met = met,
    score = s,
    maxScore = c.weight,
    missingActivities = missingActs,
    missingHotspots = missingSpots,
    evidenceCount = evidenceCount,
    hintsUsed = totalHints
   });
  }

  result.score = totalScore;
  result.maxScore = maxScore;
  result.percentage = maxScore > 0 ? Math.Round((totalScore / maxScore) * 100) : 0;
  result.passed = result.percentage >= rubric.passThreshold && completed;
  return result;
 }
}
}
