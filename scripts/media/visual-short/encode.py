import pathlib,json,subprocess,re
r=pathlib.Path('/private/tmp/devmethod-shortfilm');o=pathlib.Path('docs/media/visual-chain');s=json.loads((r/'scenes.json').read_text());t=json.loads((r/'times.json').read_text());base=t[0]['start'];total=t[-1]['start']-base
subs=[];concat=[]
def run(a):
 p=subprocess.run(a,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 if p.returncode:raise RuntimeError(p.stderr.decode()[-1500:])
def stamp(v):
 m=round(v*1000);return f'{m//3600000:02}:{m//60000%60:02}:{m//1000%60:02},{m%1000:03}'
for i,scene in enumerate(s):
 duration=t[i+1]['start']-t[i]['start'];run(['ffmpeg','-y','-i',str(r/f'audio/{i}.aiff'),'-af','apad','-t',str(duration),'-ar','48000','-c:a','pcm_s16le',str(r/f'audio/{i}.wav')]);concat.append(f"file '{r}/audio/{i}.wav'")
 parts=re.split(r'(?<=[.!?])\s+',scene['voice']);cursor=t[i]['start']-base;spoken=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(r/f'audio/{i}.aiff')]))
 for part in parts:
  length=spoken*len(part)/sum(map(len,parts));subs.append(f'{len(subs)+1}\n{stamp(cursor)} --> {stamp(cursor+length)}\n{part}\n');cursor+=length
(r/'audio-concat.txt').write_text('\n'.join(concat));(o/'devmethod-du-besoin-au-produit.fr.srt').write_text('\n'.join(subs))
vf=f"[0:v]trim=start={base}:end={t[-1]['start']},setpts=PTS-STARTPTS,fps=25,format=yuv420p[v]"
run(['ffmpeg','-y','-i',str(r/'film.webm'),'-f','concat','-safe','0','-i',str(r/'audio-concat.txt'),'-i',str(o/'devmethod-du-besoin-au-produit.fr.srt'),'-filter_complex',vf,'-map','[v]','-map','1:a','-map','2:0','-t',str(total),'-c:v','libx264','-threads','4','-preset','veryfast','-crf','20','-c:a','aac','-b:a','192k','-c:s','mov_text','-metadata:s:a:0','language=fra','-metadata:s:s:0','language=fra','-movflags','+faststart',str(o/'devmethod-du-besoin-au-produit-4k.fr.mp4')]);print('FINAL',total,flush=True)
