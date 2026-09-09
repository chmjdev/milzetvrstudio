using System;
using System.Collections.Generic;
using UnityEngine;
namespace Milzet.Content {
    public static class RoomPlacementMath
    {
        public static bool Contains(IReadOnlyList<Vector3> polygon, Vector3 p)
        {
            bool inside = false;
            for (int i = 0, j = polygon.Count - 1; i < polygon.Count; j = i++)
            {
                var a = polygon[i]; var b = polygon[j];
                if ((a.z > p.z) != (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
            }
            return inside;
        }
        public static bool TryFindCenter(IReadOnlyList<Vector3> polygon, Func<Vector3, bool> clear, out Vector3 result)
        {
            result = Vector3.zero; if (polygon == null || polygon.Count < 3) return false;
            double area = 0, cx = 0, cz = 0;
            for (int i = 0; i < polygon.Count; i++)
            {
                var a = polygon[i]; var b = polygon[(i + 1) % polygon.Count]; double cross = a.x * b.z - b.x * a.z;
                area += cross; cx += (a.x + b.x) * cross; cz += (a.z + b.z) * cross;
            }
            if (Math.Abs(area) < .001) return false;
            var centroid = new Vector3((float)(cx / (3 * area)), polygon[0].y, (float)(cz / (3 * area)));
            float Clearance(Vector3 p)
            {
                float distance = float.PositiveInfinity;
                for (int i = 0; i < polygon.Count; i++)
                {
                    var a = polygon[i]; var b = polygon[(i + 1) % polygon.Count]; a.y = b.y = p.y;
                    var edge = b - a; float t = Mathf.Clamp01(Vector3.Dot(p - a, edge) / Mathf.Max(edge.sqrMagnitude, .0001f));
                    distance = Mathf.Min(distance, Vector3.Distance(p, a + edge * t));
                }
                return distance;
            }
            if (Contains(polygon, centroid) && Clearance(centroid) >= .6f && clear(centroid)) { result = centroid; return true; }
            var bounds = new Bounds(polygon[0], Vector3.zero); foreach (var p in polygon) bounds.Encapsulate(p);
            float best = float.NegativeInfinity;
            for (int x = 0; x <= 40; x++) for (int z = 0; z <= 40; z++)
            {
                var p = new Vector3(Mathf.Lerp(bounds.min.x, bounds.max.x, x / 40f), centroid.y, Mathf.Lerp(bounds.min.z, bounds.max.z, z / 40f));
                if (!Contains(polygon, p)) continue;
                float margin = Clearance(p); if (margin < .6f || !clear(p)) continue;
                float score = -Vector3.Distance(p, centroid) + Mathf.Min(margin, 1) * .1f;
                if (score > best) { best = score; result = p; }
            }
            return !float.IsNegativeInfinity(best);
        }
    }
}
