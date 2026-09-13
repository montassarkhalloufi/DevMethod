"""Encode recorded scenes with French system speech, MP4 subtitles, and an SRT sidecar.
Requires ffmpeg, ffprobe and macOS say with the Thomas voice. Run after record-demo.cjs.
"""
import json, pathlib, subprocess
root=pathlib.Path('docs/media/from-zero');tmp=pathlib.Path('/private/tmp/devmethod-video');tmp.mkdir(exist_ok=True)
scenes=json.loads((root/'scenes.json').read_text())
def run(args): subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
subs=[];elapsed=0
for i,s in enumerate(scenes):
 text=tmp/f'{i}.txt';text.write_text(s['voice'])
 if not (tmp/f'{i}.aiff').exists(): run(['say','-v','Thomas','-r','155','-f',str(text),'-o',str(tmp/f'{i}.aiff')])
 run(['ffmpeg','-y','-i',str(tmp/f'scene-{i}.webm'),'-i',str(tmp/f'{i}.aiff'),'-vf','fps=30,scale=1280:720,format=yuv420p','-af','apad','-t',str(s['duration']),'-c:v','libx264','-preset','medium','-crf','21','-c:a','aac','-b:a','160k',str(tmp/f'{i}.mp4')])
 sentences=[v.strip()+'.' for v in s['voice'].split('.') if v.strip()];voice_duration=s['duration']-1.2;cursor=elapsed
 for sentence in sentences:
  duration=voice_duration*len(sentence)/sum(map(len,sentences));subs.append(f'{len(subs)+1}\n{stamp(cursor)} --> {stamp(cursor+duration)}\n{sentence}\n');cursor+=duration
 elapsed+=s['duration']
(root/'devmethod-demo.fr.srt').write_text('\n'.join(subs))
(tmp/'concat.txt').write_text(''.join(f"file '{i}.mp4'\n" for i in range(len(scenes))))
run(['ffmpeg','-y','-f','concat','-safe','0','-i',str(tmp/'concat.txt'),'-i',str(root/'devmethod-demo.fr.srt'),'-map','0:v','-map','0:a','-map','1:0','-c:v','copy','-c:a','copy','-c:s','mov_text','-metadata:s:s:0','language=fra','-movflags','+faststart',str(root/'devmethod-demo.fr.mp4')])
print(f'Encoded {elapsed:.1f}s video with French narration and subtitles.')
