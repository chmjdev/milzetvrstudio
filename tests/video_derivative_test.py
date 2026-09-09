import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("optimize_video", root / "Tools/optimize_video.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DeliveryCopyTests(unittest.TestCase):
    def test_local_copy_keeps_original_and_records_verified_output(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "capture.mp4"
            output = Path(directory) / "delivery.mp4"
            subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=1280x640:rate=12:duration=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(source)], check=True)
            original = module.digest(source)
            receipt = module.optimize(source, output, 1024, 200000)
            self.assertEqual(module.digest(source), original)
            self.assertEqual(receipt["sourceSha256"], original)
            self.assertEqual(receipt["outputSha256"], module.digest(output))
            self.assertEqual((receipt["width"], receipt["height"]), (1024, 512))
            self.assertLessEqual(receipt["bytes"], 200000)
            with self.assertRaises(ValueError):
                module.optimize(source, source)
            with self.assertRaises(ValueError):
                module.optimize(source, output)


if __name__ == "__main__":
    unittest.main()
