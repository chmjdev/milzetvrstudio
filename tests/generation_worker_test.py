import importlib.util, json, os, tempfile, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('worker',Path(__file__).resolve().parents[1]/'Tools/generation_worker.py')
worker=importlib.util.module_from_spec(spec);spec.loader.exec_module(worker)
class WorkerTest(unittest.TestCase):
 def test_uncertain_submit_is_not_repeated(self):
  with tempfile.TemporaryDirectory() as directory:
   path=Path(directory)/'job.json';job={'id':'test-job','provider':'meshy','prompt':'A test object','voiceId':'','status':'prepared','remoteId':''};worker.save(path,job)
   os.environ['MESHY_API_KEY']='test-only';calls=[]
   def fail(*args):calls.append(args);raise TimeoutError('Simulated disconnect')
   with self.assertRaises(TimeoutError):worker.submit(path,job,Path(directory),fail)
   recovered=json.loads(path.read_text());self.assertEqual(recovered['status'],'uncertain')
   with self.assertRaises(ValueError):worker.submit(path,recovered,Path(directory),fail)
   self.assertEqual(len(calls),1)
 def test_narration_is_wav_with_receipt(self):
  with tempfile.TemporaryDirectory() as directory:
   path=Path(directory)/'job.json';job={'id':'test-audio','provider':'elevenlabs','prompt':'Test','voiceId':'testVoice','status':'prepared','remoteId':''};worker.save(path,job)
   os.environ['ELEVENLABS_API_KEY']='test-only'
   result=worker.submit(path,job,Path(directory),lambda *args:(b'\x00\x01'*240,{'request-id':'test-request','x-character-count':'4'}))
   self.assertEqual(result['status'],'succeeded');self.assertEqual(Path(result['output']).read_bytes()[:4],b'RIFF');self.assertEqual(result['receipt']['characterCount'],'4')
if __name__=='__main__':unittest.main()
