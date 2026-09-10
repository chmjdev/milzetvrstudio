using System;
using System.Collections.Generic;
using Milzet.Content;

class AssessorSmoke {
 static int Main(string[] args) {
  var rubric = new Rubric {
   id = "trench-safety-rubric",
   title = "Trench Safety Rubric",
   passThreshold = 80,
   criteria = new[] {
    new RubricCriterion { id = "crit-1", label = "Inspect PPE", weight = 50, requiredHotspots = new[] { "point-1" }, minEvidenceCount = 0 },
    new RubricCriterion { id = "crit-2", label = "Permit Evidence", weight = 50, requiredHotspots = new[] { "point-4" }, minEvidenceCount = 1 }
   }
  };

  var events = new List<Tuple<string, string, string>> {
   Tuple.Create("hotspot.selected", "induct", "point-1"),
   Tuple.Create("hotspot.selected", "induct", "point-4"),
   Tuple.Create("evidence.requested", "induct", "point-4"),
   Tuple.Create("scenario.completed", "prove", "")
  };

  var res = AssessorEvaluator.Evaluate(rubric, events);
  if (res.score != 100 || !res.passed || !res.scenarioCompleted || res.criteriaResults.Count != 2) {
   Console.Error.WriteLine("Assessor evaluation failed.");
   return 1;
  }

  Console.WriteLine("PASS: native C# assessor evaluator verified rubric scoring, evidence checks and pass thresholds.");
  return 0;
 }
}
